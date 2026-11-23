// 크롤러가 Gist에 올린 원본 JSON을 색인이 들어간 바이너리로 바꾼다.
import { wordCount } from "../src/db/bits"
import { Kind, type Section, writeContainer } from "../src/db/container"
import { normalizeName } from "../src/db/ngram"
import { type Schema, 병역지정업체, 채용공고 } from "../src/db/schema"

type Raw = Record<string, unknown>
type Record_ = Record<string, string | string[] | number | undefined>

export type Encoded = { n: number, core: Uint8Array, detail: Uint8Array }

/** 빈 문자열과 빈 배열은 값이 없는 것으로 본다. */
const clean = (raw: Raw): Record_ => {
    const out: Record_ = {}
    for (const [key, value] of Object.entries(raw)) {
        if (typeof value === "number") out[key] = value
        else if (typeof value === "string") {
            const s = value.replace(/\0/g, "")
            if (s !== "") out[key] = s
        } else if (Array.isArray(value)) {
            const list = value.filter((v): v is string => typeof v === "string" && v !== "").map((v) => v.replace(/\0/g, ""))
            if (list.length) out[key] = list
        }
    }
    return out
}

const byCodeUnit = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0)

/** 키 함수 기준 정렬 순열. 키가 같으면 저장 순서를 따른다. */
const permutation = (n: number, key: (i: number) => number) => {
    const keys = Array.from({ length: n }, (_, i) => key(i))
    return Array.from({ length: n }, (_, i) => i).sort((a, b) => keys[a] - keys[b] || a - b)
}

class Builder {
    readonly core: Section[] = []
    readonly detail: Section[] = []
    constructor(readonly n: number) {
        if (n > 0xffff) throw new Error(`레코드가 너무 많습니다: ${n}`)
    }

    facet(name: string, values: (string | string[] | undefined)[], compare = byCodeUnit) {
        const pool = [...new Set(values.flatMap((v) => (v === undefined ? [] : v)))].sort(compare)
        const index = new Map(pool.map((v, i) => [v, i]))
        const W = wordCount(this.n)
        const bits = new Uint32Array(pool.length * W)
        const missing = new Uint32Array(W)
        values.forEach((v, id) => {
            const bit = 1 << (id & 31)
            if (v === undefined) missing[id >>> 5] |= bit
            else for (const x of typeof v === "string" ? [v] : v) bits[index.get(x)! * W + (id >>> 5)] |= bit
        })
        this.core.push(
            { name: `f:${name}:v`, kind: Kind.Strings, data: pool },
            { name: `f:${name}:b`, kind: Kind.U32, data: bits },
            { name: `f:${name}:m`, kind: Kind.U32, data: missing },
        )
    }

    cat(name: string, values: (string | undefined)[]) {
        const dict = [...new Set(values.filter((v): v is string => v !== undefined))]
        const index = new Map(dict.map((v, i) => [v, i + 1]))
        const ids = values.map((v) => (v === undefined ? 0 : index.get(v)!))
        this.core.push(
            { name: `c:${name}:v`, kind: Kind.Strings, data: dict },
            dict.length < 0xff
                ? { name: `c:${name}:i`, kind: Kind.U8, data: Uint8Array.from(ids) }
                : { name: `c:${name}:i`, kind: Kind.U16, data: Uint16Array.from(ids) },
        )
    }

    text(name: string, values: (string | undefined)[], part: "core" | "detail") {
        this[part].push({ name: `t:${name}`, kind: Kind.Strings, data: values.map((v) => v ?? "") })
    }

    num(name: string, values: number[], part: "core" | "detail") {
        const max = values.reduce((a, b) => Math.max(a, b), 0)
        this[part].push(
            max <= 0xffff
                ? { name: `n:${name}`, kind: Kind.U16, data: Uint16Array.from(values) }
                : { name: `n:${name}`, kind: Kind.U32, data: Uint32Array.from(values) },
        )
    }

    /** 다른 데이터셋에 같은 업체가 있는지 같은 레코드 집합. 빌드 때 두 목록을 이름으로 맞춰 둔다. */
    flags(name: string, values: boolean[]) {
        const bits = new Uint32Array(wordCount(this.n))
        values.forEach((v, id) => {
            if (v) bits[id >>> 5] |= 1 << (id & 31)
        })
        this.core.push({ name: `x:${name}`, kind: Kind.U32, data: bits })
    }

    /** 순열을 앞 원소와의 차로 저장한다. 같은 키끼리는 번호가 오름차순이라 차가 작아 압축이 잘 된다. */
    sort(name: string, order: number[]) {
        this.core.push({ name: `s:${name}`, kind: Kind.U16, data: Uint16Array.from(order, (id, i) => (id - (i ? order[i - 1] : 0)) & 0xffff) })
    }

    encode(updatedAt: number): Encoded {
        return {
            n: this.n,
            core: writeContainer(this.n, updatedAt, this.core),
            detail: writeContainer(this.n, updatedAt, this.detail),
        }
    }
}

const str = (r: Record_, key: string) => (typeof r[key] === "string" ? (r[key] as string) : undefined)
const list = (r: Record_, key: string) => {
    const v = r[key]
    return typeof v === "string" ? [v] : Array.isArray(v) ? v : undefined
}
const words = (v: string | string[] | undefined) => (v === undefined ? [] : typeof v === "string" ? v.split(" ") : v)
const region = (v: string | string[] | undefined) => {
    const w = words(v).filter(Boolean)
    return w.length ? w.slice(0, 2).join(" ") : undefined
}

const facets = (b: Builder, schema: Schema, records: Record_[], special: Record<string, (r: Record_) => string | string[] | undefined>, order: Record<string, (a: string, b: string) => number> = {}) => {
    for (const name of [...schema.main, ...schema.more]) {
        const get = special[name] ?? ((r: Record_) => (schema.matchAll.includes(name) ? list(r, name) : str(r, name)))
        b.facet(name, records.map(get), order[name])
    }
}

const 급여하한 = (s: string) => (s.startsWith("~") ? 0 : Number(/\d+/.exec(s)?.[0] ?? 0))
const 급여상한 = (s: string | undefined) => {
    const nums = Array.from(s?.matchAll(/\d[\d,]*/g) ?? [], (m) => Number(m[0].replace(/,/g, "")))
    return nums.length ? Math.max(...nums) : -1
}

export const encodeOpenings = (raw: Raw[], updatedAt: number, companyNames: ReadonlySet<string>): Encoded => {
    const records = raw.map(clean).sort((a, b) =>
        byCodeUnit(str(b, "최종변동일") ?? "", str(a, "최종변동일") ?? "")
        || byCodeUnit(str(b, "공고등록일") ?? "", str(a, "공고등록일") ?? "")
        || byCodeUnit(str(b, "공고번호") ?? "", str(a, "공고번호") ?? ""))
    const s = 채용공고
    const b = new Builder(records.length)
    facets(b, s, records, { 주소: (r) => region(r["주소"] as string[] | undefined) }, {
        급여: (x, y) => 급여하한(x) - 급여하한(y) || byCodeUnit(x, y),
    })
    for (const name of s.cats) b.cat(name, records.map((r) => str(r, name)))
    for (const name of s.coreText) b.text(name, records.map((r) => str(r, name)), "core")
    for (const name of s.detailText)
        b.text(name, records.map((r) => (name === "주소" ? words(r[name] as string[] | undefined).join(" ") || undefined : str(r, name))), "detail")
    b.flags("업체목록", records.map((r) => companyNames.has(normalizeName(str(r, "업체명") ?? ""))))
    b.sort("연봉순", permutation(records.length, (i) => -급여상한(str(records[i], "급여"))))
    b.sort("마감일순", permutation(records.length, (i) => Number(str(records[i], "마감일") ?? 99999999)))
    return b.encode(updatedAt)
}

const 요원순서 = ["산업기능요원", "전문연구요원", "승선근무예비역"]

/** 2024년까지 쓰던 공공데이터 API 형식이면 false. 다음 크롤링 때 새 형식으로 바뀐다. */
export const isCompanyData = (raw: Raw[]) => raw.length === 0 || "요원" in raw[0]

export const encodeCompanies = (raw: Raw[], updatedAt: number, openingNames: ReadonlySet<string>): Encoded => {
    const collator = new Intl.Collator("ko")
    const records = raw.map(clean).sort((a, b) =>
        collator.compare(str(a, "업체명") ?? "", str(b, "업체명") ?? "")
        || 요원순서.indexOf(str(a, "요원") ?? "") - 요원순서.indexOf(str(b, "요원") ?? "")
        || byCodeUnit(str(a, "업체코드") ?? "", str(b, "업체코드") ?? ""))
    const s = 병역지정업체
    const b = new Builder(records.length)
    facets(b, s, records, { 주소: (r) => region(str(r, "주소")) }, {
        요원: (x, y) => 요원순서.indexOf(x) - 요원순서.indexOf(y),
        선정년도: (x, y) => byCodeUnit(y, x),
    })
    for (const name of s.coreText) b.text(name, records.map((r) => str(r, name)), "core")
    b.num("업체코드", records.map((r) => Number(str(r, "업체코드") ?? 0)), "core")
    for (const name of s.detailText) b.text(name, records.map((r) => str(r, name)), "detail")
    for (const name of s.detailNum) b.num(name, records.map((r) => (typeof r[name] === "number" ? (r[name] as number) : 0)), "detail")
    b.flags("채용공고", records.map((r) => openingNames.has(normalizeName(str(r, "업체명") ?? ""))))
    b.sort("최신순", permutation(records.length, (i) => -Number(str(records[i], "선정년도") ?? 0)))
    b.sort("복무인원순", permutation(records.length, (i) => -(((records[i]["현역복무인원"] as number) ?? 0) + ((records[i]["보충역복무인원"] as number) ?? 0))))
    return b.encode(updatedAt)
}
