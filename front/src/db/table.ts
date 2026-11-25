import { has, wordCount } from "./bits.ts"
import type { Container } from "./container.ts"

export type Facet = {
    readonly name: string
    /** 검색조건 체크박스에 나오는 순서 */
    readonly values: string[]
    /** 값 v의 비트셋은 bits[v*W .. (v+1)*W) */
    readonly bits: Uint32Array
    /** 이 필드가 없는 레코드 */
    readonly missing: Uint32Array
    row(v: number): Uint32Array
}

type Cat = { dict: string[], ids: Uint8Array | Uint16Array | Uint32Array }

export class Table {
    readonly n: number
    readonly W: number
    readonly updatedAt: number
    private readonly parts: Container[]
    private readonly memo = new Map<string, unknown>()
    private readonly listeners = new Set<() => void>()
    detailLoaded = false

    constructor(core: Container) {
        this.parts = [core]
        this.n = core.n
        this.W = wordCount(core.n)
        this.updatedAt = core.updatedAt
    }

    attach(detail: Container) {
        if (detail.n !== this.n) throw new Error("상세정보와 목록의 레코드 수가 다릅니다.")
        this.parts.push(detail)
        this.detailLoaded = true
        for (const fn of this.listeners) fn()
    }

    onDetail(fn: () => void) {
        this.listeners.add(fn)
        return () => void this.listeners.delete(fn)
    }

    private cached<T>(key: string, make: () => T | undefined): T | undefined {
        if (this.memo.has(key)) return this.memo.get(key) as T
        const value = make()
        if (value !== undefined) this.memo.set(key, value)
        return value
    }

    private strings(name: string) {
        for (const part of this.parts) if (part.has(name)) return part.strings(name)
    }

    private array(name: string) {
        for (const part of this.parts) if (part.has(name)) return part.array(name)
    }

    facet(name: string): Facet | undefined {
        return this.cached(`f:${name}`, () => {
            const values = this.strings(`f:${name}:v`)
            const bits = this.array(`f:${name}:b`) as Uint32Array | undefined
            const missing = this.array(`f:${name}:m`) as Uint32Array | undefined
            if (!values || !bits || !missing) return undefined
            const W = this.W
            return { name, values, bits, missing, row: (v: number) => bits.subarray(v * W, (v + 1) * W) }
        })
    }

    text(name: string): string[] | undefined {
        return this.cached(`t:${name}`, () => this.strings(`t:${name}`))
    }

    num(name: string) {
        return this.cached(`n:${name}`, () => this.array(`n:${name}`))
    }

    private cat(name: string): Cat | undefined {
        return this.cached(`c:${name}`, () => {
            const dict = this.strings(`c:${name}:v`)
            const ids = this.array(`c:${name}:i`)
            return dict && ids ? { dict, ids } : undefined
        })
    }

    /** 정렬 순열. 저장 순서(첫 번째 정렬)이면 undefined. 차분으로 저장돼 있어 누적합으로 되돌린다. */
    order(name: string) {
        return this.cached(`s:${name}`, () => {
            const deltas = this.array(`s:${name}`)
            if (!deltas) return undefined
            const order = new Uint16Array(deltas.length)
            let id = 0
            for (let i = 0; i < deltas.length; i++) order[i] = id = (id + deltas[i]) & 0xffff
            return order
        })
    }

    /** 다른 데이터셋에 같은 업체가 있는지 (빌드 때 이름으로 맞춰 둔 값) */
    flag(name: string, id: number) {
        const bits = this.cached(`x:${name}`, () => this.array(`x:${name}`) as Uint32Array | undefined)
        return bits ? has(bits, id) : false
    }

    facetValues(name: string, id: number): string[] {
        const f = this.facet(name)
        if (!f) return []
        const out: string[] = []
        for (let v = 0; v < f.values.length; v++) if (has(f.row(v), id)) out.push(f.values[v])
        return out
    }

    /** 화면에 보일 값. 없으면 undefined. */
    field(name: string, id: number): string | undefined {
        const text = this.text(name)
        if (text) return text[id] || undefined
        const cat = this.cat(name)
        if (cat) return cat.ids[id] ? cat.dict[cat.ids[id] - 1] : undefined
        const num = this.num(name)
        if (num) return String(num[id])
        const values = this.facetValues(name, id)
        return values.length ? values.join(", ") : undefined
    }
}
