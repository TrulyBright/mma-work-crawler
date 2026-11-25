// data/*.json을 읽어 색인 바이너리를 만들고, 해시가 붙은 파일로 내보낸다.
// 같은 색인으로 각 화면을 HTML로 미리 그려 openings.html, companies.html, 404.html을 만든다(index.html은 채용공고와 같다).
// 앱은 virtual:mma-data에서 파일 주소를 받는다. 각 HTML에는 첫 화면 데이터를 바로 받는 스크립트를 넣는다.
// 공고·업체마다 정적 페이지(/openings/<공고번호>/, /companies/<업체코드>/)도 만든다.
// 검색엔진용으로 robots.txt, sitemap.xml을 만들고 각 화면에 canonical 주소를 적는다.
// index.html의 애드센스 게시자 ID로 ads.txt를 만든다(없으면 광고 구매자 일부가 입찰하지 않는다).
import { createHash } from "node:crypto"
import { existsSync, readFileSync, statSync } from "node:fs"
import { extname, resolve } from "node:path"
import { gzipSync, constants } from "node:zlib"
import type { Plugin, ResolvedConfig } from "vite"
import type { DatasetName } from "../src/db/schema.ts"
import { normalizeName } from "../src/db/ngram.ts"
import { esc } from "../src/view/html.ts"
import { encodeCompanies, encodeOpenings, isCompanyData } from "./encode.ts"
import { type ItemMeta, jsonLdScript } from "./item-pages.ts"
import { type Item, type Pages, prerender } from "./prerender.ts"

/** 운영 주소. canonical, sitemap.xml에 쓴다. */
const SITE = "https://sangiyo.kr"
const VIRTUAL = "virtual:mma-data"
const RESOLVED = "\0" + VIRTUAL
const BOOT = "<!--mma-boot-->"
const APP = "<!--mma-app-->"

/** 주소 → 미리 그린 화면 (개발 서버와 preview에서 Azure SWA의 routes를 흉내 낸다) */
const ROUTES: Record<string, keyof Pages> = { "/": "openings", "/index.html": "openings", "/openings": "openings", "/companies": "companies" }
/** 공고·업체 페이지 주소 */
const ITEM_PATH = /^\/(openings|companies)\/[^/.]+\/?$/
/** 빌드 결과 HTML 파일 */
const OUTPUT: Record<string, keyof Pages> = { "index.html": "openings", "openings.html": "openings", "companies.html": "companies", "404.html": "notFound" }
/** 화면 → 검색엔진에 알릴 주소. /와 검색조건이 붙은 주소는 이 주소와 같은 화면으로 본다. */
const CANONICAL: Partial<Record<keyof Pages, string>> = { openings: "/openings", companies: "/companies" }

type Asset = { fileName: string, source: Uint8Array }
type Files = { core: string, detail: string, coreRaw: string, detailRaw: string }

const sources: Record<DatasetName, string> = {
    openings: "채용공고목록.json",
    companies: "병역지정업체목록.json",
}

type Raw = Record<string, unknown>[]

const readJson = (path: string): unknown => (existsSync(path) ? JSON.parse(readFileSync(path, "utf-8")) : undefined)

const updatedAt = (dir: string) => {
    const value = readJson(resolve(dir, "최종갱신.json"))
    if (typeof value === "string" && !Number.isNaN(Date.parse(value))) return Date.parse(value)
    if (typeof value === "number") return value < 1e12 ? value * 1000 : value
    const mtimes = Object.values(sources).map((file) => resolve(dir, file)).filter(existsSync).map((p) => statSync(p).mtimeMs)
    return mtimes.length ? Math.max(...mtimes) : 0
}

const build = (dir: string) => {
    const assets: Asset[] = []
    const urls = {} as Record<DatasetName, Files>
    const time = updatedAt(dir)
    const raws = {} as Record<DatasetName, Raw>
    for (const [name, file] of Object.entries(sources) as [DatasetName, string][]) {
        const raw = readJson(resolve(dir, file))
        if (raw === undefined) console.warn(`[mma-data] ${file}이 없습니다. 빈 목록으로 빌드합니다.`)
        if (raw !== undefined && !Array.isArray(raw)) throw new Error(`${file}의 형식이 올바르지 않습니다.`)
        raws[name] = (raw ?? []) as Raw
    }
    if (!isCompanyData(raws.companies)) {
        console.warn("[mma-data] 병역지정업체목록.json이 예전 형식입니다. 업체목록을 비워 둡니다.")
        raws.companies = []
    }
    const names = (raw: Raw) => new Set(raw.map((r) => normalizeName(String(r["업체명"] ?? ""))))
    const encoded = {
        openings: encodeOpenings(raws.openings, time, names(raws.companies)),
        companies: encodeCompanies(raws.companies, time, names(raws.openings)),
    }
    for (const name of Object.keys(sources) as DatasetName[]) {
        const files = {} as Files
        const sizes: string[] = []
        for (const part of ["core", "detail"] as const) {
            const bytes = encoded[name][part]
            const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 10)
            const base = `data/${name}.${part}.${hash}`
            const gz = gzipSync(bytes, { level: constants.Z_BEST_COMPRESSION, memLevel: 9 })
            assets.push({ fileName: `${base}.bin`, source: gz }, { fileName: `${base}.raw`, source: bytes })
            files[part] = `${base}.bin`
            files[`${part}Raw`] = `${base}.raw`
            sizes.push(`${part} ${(bytes.length / 1024).toFixed(0)}KB → gzip ${(gz.length / 1024).toFixed(0)}KB`)
        }
        urls[name] = files
        console.info(`[mma-data] ${name}: ${encoded[name].n}건, ${sizes.join(", ")}`)
    }
    return { assets, urls, encoded, time }
}

/** 앱 JS를 받는 동안 첫 화면 데이터도 함께 받는다. 주소에 검색조건이 있으면 적용할 때까지 본문을 가린다(app.css의 .pending). */
const bootScript = (urls: Record<DatasetName, Files>, base: string) => {
    const o = JSON.stringify(base + urls.openings.core)
    const co = JSON.stringify(base + urls.companies.core)
    return `<script>(function(w,d){try{var c={"/":0,"/index.html":0,"/openings":0,"/openings/":0,"/openings.html":0,"/companies":1,"/companies/":1,"/companies.html":1}[location.pathname];if(c===undefined)return;if(location.search)d.documentElement.classList.add("pending");if(!w.DecompressionStream)return;(w.__mma={})[c?"companies":"openings"]=fetch(c?${co}:${o}).then(function(r){if(!r.ok)throw new Error(r.status);return r.arrayBuffer()})}catch(e){}})(window,document)</script>`
}

type Head = { canonical?: string, title?: string, description?: string, jsonLd?: Record<string, unknown> }

const TITLE = /<title>[^<]*<\/title>/
const DESCRIPTION = /<meta name="description" content="[^"]*"\s*\/?>/

const fill = (template: string, head: Head, root: string) => {
    if (!template.includes(APP)) throw new Error(`index.html에 ${APP}이 없습니다.`)
    if (!TITLE.test(template) || !DESCRIPTION.test(template)) throw new Error("index.html에 title이나 description이 없습니다.")
    let html = template
    if (head.title) html = html.replace(TITLE, () => `<title>${esc(head.title!)}</title>`)
    if (head.description) html = html.replace(DESCRIPTION, () => `<meta name="description" content="${esc(head.description!)}" />`)
    const extra = (head.canonical ? `<link rel="canonical" href="${SITE}${head.canonical}">` : "") + (head.jsonLd ? jsonLdScript(head.jsonLd) : "")
    if (extra) html = html.replace("</head>", () => `${extra}\n</head>`)
    return html.replace(APP, () => `<div id="root">${root}</div>`)
}

const pageHead = (page: keyof Pages): Head => ({ canonical: CANONICAL[page] })
const itemHead = (meta: ItemMeta): Head => ({ canonical: meta.path, title: meta.title, description: meta.description, jsonLd: meta.jsonLd })

const robots = () => `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`

/** f08c47fec0942fa0은 Google의 TAG 인증 ID */
const adsTxt = (template: string) => {
    const publisher = /client=ca-(pub-\d+)/.exec(template)?.[1]
    return publisher ? `google.com, ${publisher}, DIRECT, f08c47fec0942fa0\n` : undefined
}

/** 목록 화면의 lastmod는 데이터를 마지막으로 갱신한 시각, 공고는 최종변동일. 업체는 바뀐 날을 몰라 적지 않는다. */
const sitemap = (updatedAt: number, items: readonly Item[]) => {
    const lastmod = new Date(updatedAt || Date.now()).toISOString().replace(/\.\d+Z$/, "Z")
    const url = (path: string, date?: string) => `  <url><loc>${SITE}${path}</loc>${date ? `<lastmod>${date}</lastmod>` : ""}</url>`
    const urls = [
        ...Object.values(CANONICAL).map((path) => url(path, lastmod)),
        ...items.map(({ meta }) => url(meta.path, meta.lastmod)),
    ]
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`
}

export default function site(): Plugin {
    let config: ResolvedConfig
    let data: ReturnType<typeof build> | undefined
    let html: ReturnType<typeof prerender> | undefined
    let byPath: Map<string, Item> | undefined
    const get = () => (data ??= build(process.env.MMA_DATA_DIR ? resolve(process.env.MMA_DATA_DIR) : resolve(config.root, "data")))
    const rendered = () => (html ??= prerender(get().encoded))
    const item = (path: string) => (byPath ??= new Map(rendered().items.map((i) => [i.meta.path, i]))).get(path.endsWith("/") ? path : `${path}/`)
    return {
        name: "mma-site",
        // index.html이 번들에 들어간 뒤에 페이지를 만든다.
        enforce: "post",
        config: () => ({ appType: "mpa" }),
        configResolved(resolved) {
            config = resolved
        },
        buildStart() {
            if (config.command !== "build") return
            for (const asset of get().assets) this.emitFile({ type: "asset", fileName: asset.fileName, source: asset.source })
        },
        resolveId(id) {
            if (id === VIRTUAL) return RESOLVED
        },
        load(id) {
            if (id !== RESOLVED) return
            const urls = Object.fromEntries(Object.entries(get().urls).map(([name, files]) => [
                name,
                Object.fromEntries(Object.entries(files).map(([part, file]) => [part, config.base + file])),
            ]))
            return `export default ${JSON.stringify(urls)}`
        },
        transformIndexHtml: {
            order: "post",
            handler: (source) => source.replace(BOOT, () => bootScript(get().urls, config.base)),
        },
        generateBundle(_, bundle) {
            const index = bundle["index.html"]
            if (!index || index.type !== "asset") throw new Error("번들에 index.html이 없습니다.")
            const linked = String(index.source)
            // 목록 화면은 CSS를 HTML에 넣어, HTML만 받으면 바로 그릴 수 있게 한다(gzip 3KB 남짓).
            // 공고·업체 페이지는 수천 개라 CSS 파일을 따로 두고 캐시를 같이 쓴다.
            const inlined = linked.replace(/<link\b[^>]*\brel="stylesheet"[^>]*>/g, (tag) => {
                const file = /\bhref="([^"]+)"/.exec(tag)?.[1].slice(config.base.length)
                const css = file ? bundle[file] : undefined
                return css?.type === "asset" ? `<style>${String(css.source).trim()}</style>` : tag
            })
            delete bundle["index.html"]
            const { pages, items } = rendered()
            for (const [fileName, page] of Object.entries(OUTPUT)) this.emitFile({ type: "asset", fileName, source: fill(inlined, pageHead(page), pages[page]) })
            for (const { meta, root } of items) this.emitFile({ type: "asset", fileName: `${meta.path.slice(1)}index.html`, source: fill(linked, itemHead(meta), root) })
            this.emitFile({ type: "asset", fileName: "robots.txt", source: robots() })
            const ads = adsTxt(linked)
            if (ads) this.emitFile({ type: "asset", fileName: "ads.txt", source: ads })
            this.emitFile({ type: "asset", fileName: "sitemap.xml", source: sitemap(get().time, items) })
            const count = (prefix: string) => items.filter((i) => i.meta.path.startsWith(prefix)).length
            console.info(`[mma-site] 공고 페이지 ${count("/openings/")}개, 업체 페이지 ${count("/companies/")}개`)
        },
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                const url = req.url ?? "/"
                const path = url.split("?")[0]
                const asset = get().assets.find((a) => a.fileName === path.slice(config.base.length))
                if (asset) {
                    res.setHeader("Content-Type", "application/octet-stream")
                    res.end(asset.source)
                    return
                }
                const page = ROUTES[path]
                const found = !page && ITEM_PATH.test(path) ? item(path) : undefined
                if (!page && !found) return next()
                server.transformIndexHtml(url, readFileSync(resolve(config.root, "index.html"), "utf-8"), req.originalUrl)
                    .then((template) => {
                        res.setHeader("Content-Type", "text/html; charset=utf-8")
                        res.end(page ? fill(template, pageHead(page), rendered().pages[page]) : fill(template, itemHead(found!.meta), found!.root))
                    })
                    .catch(next)
            })
        },
        configurePreviewServer(server) {
            const outDir = resolve(config.root, config.build.outDir)
            server.middlewares.use((req, res, next) => {
                const [path, query = ""] = (req.url ?? "/").split(/\?(.*)/s)
                if (path === "/openings" || path === "/companies") {
                    req.url = `${path}.html${query ? `?${query}` : ""}`
                    return next()
                }
                if (ITEM_PATH.test(path)) {
                    req.url = `${path.replace(/\/?$/, "/")}index.html`
                    return next()
                }
                if (path === "/" || extname(path) !== "") return next()
                res.statusCode = 404
                res.setHeader("Content-Type", "text/html; charset=utf-8")
                res.end(readFileSync(resolve(outDir, "404.html")))
            })
        },
    }
}
