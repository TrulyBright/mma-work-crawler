// 공고·업체마다 정적 페이지를 만들기 위한 정보. 검색엔진이 "업체명 + 산업기능요원" 같은 검색어로 찾아오게 한다.
// 화면은 목록에서 하나를 펼친 모습과 같아 새 문구가 없다. 제목과 설명은 데이터 값을 이어 붙여 만든다.
// 공고에는 JobPosting 구조화 데이터(https://developers.google.com/search/docs/appearance/structured-data/job-posting)를 단다.
import type { Table } from "../src/db/table.ts"
import type { PageConfig } from "../src/pages/types.ts"
import { text } from "../src/view/html.ts"

export type ItemMeta = {
    /** 끝에 /가 붙은 주소. Azure SWA는 폴더의 index.html을 이 주소로 준다. */
    path: string
    title: string
    description: string
    /** 내용이 바뀐 날(sitemap). 모르면 비워 둔다. */
    lastmod?: string
    jsonLd?: Record<string, unknown>
}

const SITE_NAME = "병역일터 공고검색"

const ymd = (v: string | undefined) => (v && /^\d{8}$/.test(v) ? `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}` : undefined)

const join = (values: (string | undefined)[]) => values.filter(Boolean).join("·")

/** 상세정보에 보이는 필드를 "필드 이름: 값" 그대로 옮긴다. */
const detailHtml = (table: Table, config: PageConfig, id: number, skip: ReadonlySet<string>) => {
    const format = config.format ?? ((_: string, value: string) => value)
    let html = ""
    for (const name of config.detailRows.flat()) {
        const value = table.field(name, id)
        if (value === undefined || skip.has(name)) continue
        html += `<p><strong>${text(name)}</strong><br>${text(format(name, value)).replace(/\n/g, "<br>")}</p>`
    }
    return html
}

const opening = (table: Table, config: PageConfig, id: number): ItemMeta => {
    const f = (name: string) => table.field(name, id)
    const no = f("공고번호")!
    const salary = /^(\d+)~(\d+)만원$/.exec(f("급여") ?? "")
    const address = f("주소")
    const [region, locality] = (address ?? "").split(" ")
    const deadline = ymd(f("마감일"))
    return {
        path: `/openings/${no}/`,
        title: `${f("공고제목")} - ${SITE_NAME}`,
        description: join([f("업체명"), f("요원"), f("업종"), f("급여"), table.facetValues("주소", id)[0], f("담당업무")]),
        lastmod: ymd(f("최종변동일")),
        jsonLd: {
            "@context": "https://schema.org/",
            "@type": "JobPosting",
            title: f("공고제목"),
            description: detailHtml(table, config, id, new Set(["공고제목", "공고번호", "담당자연락처", "대표연락처", "사업자등록번호", "홈페이지주소"])),
            identifier: { "@type": "PropertyValue", name: "병역일터", value: no },
            datePosted: ymd(f("공고등록일")),
            validThrough: deadline ? `${deadline}T23:59:59+09:00` : undefined,
            // 산업기능요원·전문연구요원은 모두 상근이다.
            employmentType: "FULL_TIME",
            hiringOrganization: { "@type": "Organization", name: f("업체명") },
            jobLocation: {
                "@type": "Place",
                address: { "@type": "PostalAddress", streetAddress: address, addressRegion: region || undefined, addressLocality: locality || undefined, addressCountry: "KR" },
            },
            baseSalary: salary
                ? { "@type": "MonetaryAmount", currency: "KRW", value: { "@type": "QuantitativeValue", minValue: Number(salary[1]) * 10000, maxValue: Number(salary[2]) * 10000, unitText: "YEAR" } }
                : undefined,
            directApply: false,
        },
    }
}

const company = (table: Table, id: number): ItemMeta | undefined => {
    const code = table.num("업체코드")?.[id]
    if (!code) return undefined
    const f = (name: string) => table.field(name, id)
    return {
        path: `/companies/${code}/`,
        title: `${f("업체명")} ${f("요원") ?? ""} - ${SITE_NAME}`.replace(/\s+-/, " -"),
        description: join([f("요원"), f("업종"), f("기업규모"), f("주소"), f("주생산품목"), f("연구분야")]),
    }
}

/** 페이지를 만들 레코드. 업체코드가 없는 업체는 원문 주소가 없어 건너뛴다. */
export const itemMeta = (table: Table, config: PageConfig, id: number): ItemMeta | undefined =>
    config.dataset === "openings" ? opening(table, config, id) : company(table, id)

/** <script type="application/ld+json"> 안에 넣어도 </script>로 끊기지 않게 한다. */
export const jsonLdScript = (data: Record<string, unknown>) =>
    `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`
