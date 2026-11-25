import { count } from "../db/bits.ts"
import { facetCounts, type Query, take } from "../db/query.ts"
import type { Table } from "../db/table.ts"
import type { PageConfig } from "../pages/types.ts"
import type { State } from "./state.ts"

/** 검색조건으로 결과 수, 보여 줄 레코드, 검색조건별 건수를 구한다. 빌드와 브라우저가 같이 쓴다. */
export const evaluate = (table: Table, config: PageConfig, state: State, extra: Uint32Array[], shown: readonly string[], limit: number) => {
    const query: Query = {
        selection: state.selection,
        matchAll: new Set(config.schema.matchAll),
        keepMissing: config.keepMissing,
        extra,
    }
    const { result, counts } = facetCounts(table, query, shown)
    return { counts, total: count(result), ids: take(table, result, state.sort, limit) }
}

export const shownFacets = (config: PageConfig, moreOpen: boolean) =>
    moreOpen ? [...config.schema.main, ...config.schema.more] : config.schema.main
