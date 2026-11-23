import { andInto, countAnd, full, has, orInto } from "./bits"
import type { Table } from "./table"

/** 검색조건 이름 → 고른 값 번호 */
export type Selection = ReadonlyMap<string, ReadonlySet<number>>

export type Query = {
    selection: Selection
    /** 고른 값을 모두 가진 레코드만 남기는 조건(그 외에는 하나라도 가지면 남는다) */
    matchAll: ReadonlySet<string>
    /** 그 필드가 없는 레코드를 남길지 */
    keepMissing: boolean
    /** 이름 검색, 즐겨찾기 같은 추가 조건 */
    extra: Uint32Array[]
}

/** 검색조건 하나를 만족하는 레코드. 아무것도 고르지 않았으면 undefined. */
export const facetMask = (table: Table, name: string, query: Query) => {
    const chosen = query.selection.get(name)
    const facet = table.facet(name)
    if (!chosen || chosen.size === 0 || !facet) return undefined
    const out = new Uint32Array(table.W)
    if (query.matchAll.has(name)) {
        out.fill(0xffffffff)
        for (const v of chosen) andInto(out, facet.row(v))
    } else {
        for (const v of chosen) orInto(out, facet.row(v))
    }
    if (query.keepMissing) orInto(out, facet.missing)
    return out
}

export const evaluate = (table: Table, query: Query) => {
    const result = full(table.n)
    for (const name of query.selection.keys()) {
        const mask = facetMask(table, name, query)
        if (mask) andInto(result, mask)
    }
    for (const mask of query.extra) andInto(result, mask)
    return result
}

/**
 * 검색조건별로 각 값을 고르면 몇 건이 되는지 센다.
 * 하나라도 가지면 되는 조건은 그 조건만 뺀 결과와, 모두 가져야 하는 조건은 현재 결과와 교집합을 센다.
 */
export const facetCounts = (table: Table, query: Query, names: readonly string[]) => {
    const masks = new Map<string, Uint32Array>()
    for (const name of query.selection.keys()) {
        const mask = facetMask(table, name, query)
        if (mask) masks.set(name, mask)
    }
    const base = full(table.n)
    for (const mask of query.extra) andInto(base, mask)
    const result = base.slice()
    for (const mask of masks.values()) andInto(result, mask)
    const out = new Map<string, Int32Array>()
    for (const name of names) {
        const facet = table.facet(name)
        if (!facet) continue
        let scope = result
        if (masks.has(name) && !query.matchAll.has(name)) {
            scope = base.slice()
            for (const [other, mask] of masks) if (other !== name) andInto(scope, mask)
        }
        const counts = new Int32Array(facet.values.length)
        for (let v = 0; v < counts.length; v++) counts[v] = countAnd(scope, facet.row(v))
        out.set(name, counts)
    }
    return { result, counts: out }
}

/** 결과를 정렬 순서대로 limit개까지 꺼낸다. */
export const take = (table: Table, result: Uint32Array, sort: string, limit: number) => {
    const out: number[] = []
    const order = table.order(sort)
    if (order) {
        for (let i = 0; i < order.length && out.length < limit; i++) if (has(result, order[i])) out.push(order[i])
    } else {
        for (let w = 0; w < result.length && out.length < limit; w++) {
            let x = result[w]
            while (x !== 0 && out.length < limit) {
                const t = x & -x
                out.push((w << 5) + 31 - Math.clz32(t))
                x ^= t
            }
        }
    }
    return out
}
