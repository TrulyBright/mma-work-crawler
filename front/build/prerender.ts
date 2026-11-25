// 빌드한 색인으로 각 화면의 처음 모습을 HTML로 그린다. 브라우저는 이 HTML을 그대로 이어받는다.
import { Container } from "../src/db/container.ts"
import type { DatasetName } from "../src/db/schema.ts"
import { Table } from "../src/db/table.ts"
import { pages } from "../src/pages/index.ts"
import * as R from "../src/view/render.ts"
import { evaluate, shownFacets } from "../src/view/model.ts"
import { PAGE, emptyState } from "../src/view/state.ts"
import type { Encoded } from "./encode.ts"

export type Pages = { openings: string, companies: string, notFound: string }

const buffer = (bytes: Uint8Array) => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer

export const prerender = (encoded: Record<DatasetName, Encoded>, now = new Date()): Pages => {
    const html = {} as Record<DatasetName, string>
    for (const config of Object.values(pages)) {
        const table = new Table(new Container(buffer(encoded[config.dataset].core)))
        const state = emptyState(config.schema)
        const { counts, total, ids } = evaluate(table, config, state, [], shownFacets(config, false), PAGE)
        const page = R.searchPage({
            table, config, state, counts, total, ids,
            limit: PAGE, open: new Set(), moreOpen: false, favorites: {},
            // 빌드 서버 시간대와 상관없이 한국 시간으로 적는다. 브라우저가 다시 맞춘다.
            now, updatedAt: R.formatUpdatedAt(table.updatedAt, "Asia/Seoul"),
        })
        html[config.dataset] = R.shell(config.path, R.pageSlot(config.path, page))
    }
    return { openings: html.openings, companies: html.companies, notFound: R.shell("", R.errorView("Not Found")) }
}
