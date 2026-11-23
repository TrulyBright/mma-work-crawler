// data/*.json을 읽어 색인 바이너리를 만들고, 해시가 붙은 파일로 내보낸다.
// 앱은 virtual:mma-data에서 파일 주소를 받는다. index.html에는 첫 화면 데이터를 바로 받는 스크립트를 넣는다.
import { createHash } from "node:crypto"
import { existsSync, readFileSync, statSync } from "node:fs"
import { resolve } from "node:path"
import { gzipSync, constants } from "node:zlib"
import type { Plugin, ResolvedConfig } from "vite"
import type { DatasetName } from "../src/db/schema"
import { type Encoded, encodeCompanies, encodeOpenings } from "./encode"

const VIRTUAL = "virtual:mma-data"
const RESOLVED = "\0" + VIRTUAL

type Asset = { fileName: string, source: Uint8Array }
type Files = { core: string, detail: string, coreRaw: string, detailRaw: string }

const sources: Record<DatasetName, { file: string, encode: (raw: Record<string, unknown>[], updatedAt: number) => Encoded }> = {
    openings: { file: "채용공고목록.json", encode: encodeOpenings },
    companies: { file: "병역지정업체목록.json", encode: encodeCompanies },
}

const readJson = (path: string): unknown => (existsSync(path) ? JSON.parse(readFileSync(path, "utf-8")) : undefined)

const updatedAt = (dir: string) => {
    const value = readJson(resolve(dir, "최종갱신.json"))
    if (typeof value === "string" && !Number.isNaN(Date.parse(value))) return Date.parse(value)
    if (typeof value === "number") return value < 1e12 ? value * 1000 : value
    const mtimes = Object.values(sources).map((s) => resolve(dir, s.file)).filter(existsSync).map((p) => statSync(p).mtimeMs)
    return mtimes.length ? Math.max(...mtimes) : 0
}

const build = (dir: string) => {
    const assets: Asset[] = []
    const urls = {} as Record<DatasetName, Files>
    const time = updatedAt(dir)
    for (const [name, { file, encode }] of Object.entries(sources) as [DatasetName, typeof sources[DatasetName]][]) {
        const raw = readJson(resolve(dir, file))
        if (raw === undefined) console.warn(`[mma-data] ${file}이 없습니다. 빈 목록으로 빌드합니다.`)
        if (raw !== undefined && !Array.isArray(raw)) throw new Error(`${file}의 형식이 올바르지 않습니다.`)
        const encoded = encode((raw ?? []) as Record<string, unknown>[], time)
        const files = {} as Files
        for (const part of ["core", "detail"] as const) {
            const bytes = encoded[part]
            const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 10)
            const base = `data/${name}.${part}.${hash}`
            const gz = gzipSync(bytes, { level: constants.Z_BEST_COMPRESSION, memLevel: 9 })
            assets.push({ fileName: `${base}.bin`, source: gz }, { fileName: `${base}.raw`, source: bytes })
            files[part] = `${base}.bin`
            files[`${part}Raw`] = `${base}.raw`
        }
        urls[name] = files
        console.info(`[mma-data] ${name}: ${encoded.n}건, core ${(encoded.core.length / 1024).toFixed(0)}KB → gzip ${(assets.at(-4)!.source.length / 1024).toFixed(0)}KB, detail ${(encoded.detail.length / 1024).toFixed(0)}KB → gzip ${(assets.at(-2)!.source.length / 1024).toFixed(0)}KB`)
    }
    return { assets, urls }
}

const bootScript = (urls: Record<DatasetName, Files>, base: string) => {
    const o = JSON.stringify(base + urls.openings.core)
    const c = JSON.stringify(base + urls.companies.core)
    // 앱 JS를 받는 동안 첫 화면 데이터도 함께 받는다.
    return `<script>(function(w){try{if(!w.DecompressionStream)return;var c=location.pathname.indexOf("/companies")===0;(w.__mma={})[c?"companies":"openings"]=fetch(c?${c}:${o}).then(function(r){if(!r.ok)throw new Error(r.status);return r.arrayBuffer()})}catch(e){}})(window)</script>`
}

export default function mmaData(): Plugin {
    let config: ResolvedConfig
    let result: ReturnType<typeof build> | undefined
    const get = () => (result ??= build(process.env.MMA_DATA_DIR ? resolve(process.env.MMA_DATA_DIR) : resolve(config.root, "data")))
    return {
        name: "mma-data",
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
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                const path = req.url?.split("?")[0].slice(config.base.length)
                const asset = path && get().assets.find((a) => a.fileName === path)
                if (!asset) return next()
                res.setHeader("Content-Type", "application/octet-stream")
                res.end(asset.source)
            })
        },
        transformIndexHtml(html) {
            return html.replace("<!--mma-boot-->", bootScript(get().urls, config.base))
        },
    }
}
