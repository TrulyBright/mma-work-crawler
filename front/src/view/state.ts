// 검색조건. 주소 쿼리와 서로 바꿀 수 있다.
import type { Schema } from "../db/schema.ts"
import type { Table } from "../db/table.ts"
import type { PageConfig } from "../pages/types.ts"

export const PAGE = 50

export type Favorites = { yes: boolean, no: boolean }

export type State = {
    /** 검색조건 이름 → 고른 값 번호. 아무것도 고르지 않은 조건은 들어 있지 않다. */
    selection: ReadonlyMap<string, ReadonlySet<number>>
    name: string
    keyword: string
    favorites: Favorites
    sort: string
}

export const emptyState = (schema: Schema): State => ({
    selection: new Map(),
    name: "",
    keyword: "",
    favorites: { yes: false, no: false },
    sort: schema.sorts[0],
})

/** 검색조건을 주소 쿼리로. 값 번호는 배포마다 바뀔 수 있어 값 이름을 쓴다. */
export const toSearch = (table: Table, config: PageConfig, state: State) => {
    const params = new URLSearchParams()
    for (const [entry, chosen] of state.selection) {
        const values = table.facet(entry)?.values ?? []
        for (const i of chosen) params.append(entry, values[i])
    }
    if (state.favorites.yes) params.append("즐겨찾기", "1")
    if (state.favorites.no) params.append("즐겨찾기", "0")
    if (state.name.trim()) params.set("업체명", state.name)
    if (config.keyword && state.keyword.trim()) params.set(config.keyword.label, state.keyword)
    if (state.sort !== config.schema.sorts[0]) params.set("정렬", state.sort)
    const search = params.toString()
    return search ? `?${search}` : ""
}

export const fromSearch = (table: Table, config: PageConfig, search: string): State => {
    const params = new URLSearchParams(search)
    const state = emptyState(config.schema)
    const selection = new Map<string, Set<number>>()
    for (const entry of [...config.schema.main, ...config.schema.more]) {
        const values = table.facet(entry)?.values ?? []
        const chosen = new Set(params.getAll(entry).map((v) => values.indexOf(v)).filter((i) => i >= 0))
        if (chosen.size) selection.set(entry, chosen)
    }
    const favorites = params.getAll("즐겨찾기")
    const sort = params.get("정렬") ?? ""
    return {
        ...state,
        selection,
        name: params.get("업체명") ?? "",
        keyword: config.keyword ? params.get(config.keyword.label) ?? "" : "",
        favorites: { yes: favorites.includes("1"), no: favorites.includes("0") },
        sort: config.schema.sorts.includes(sort) ? sort : state.sort,
    }
}

/** 조건 배지에 마우스를 올리면 보이는 목록 */
export const conditions = (table: Table, config: PageConfig, state: State) => {
    const out: string[] = []
    for (const [entry, chosen] of state.selection) {
        const values = table.facet(entry)?.values ?? []
        out.push(`${entry}: ${[...chosen].map((i) => values[i]).join(", ")}`)
    }
    const { yes, no } = state.favorites
    if (yes !== no) out.push(`즐겨찾기: ${yes ? `즐겨찾는 ${config.noun}` : `즐겨찾지 않는 ${config.noun}`}`)
    if (state.name.trim()) out.push(`업체명: ${state.name}`)
    if (config.keyword && state.keyword.trim()) out.push(`${config.keyword.label}: ${state.keyword}`)
    return out
}

export const moreSelected = (schema: Schema, state: State) => schema.more.some((entry) => state.selection.has(entry))
