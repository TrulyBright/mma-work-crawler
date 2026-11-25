import type { DatasetName, Schema } from "../db/schema.ts"
import type { Table } from "../db/table.ts"
import type { IconName } from "../view/icon-paths.ts"

export type Chip = { label: string, color: "error" | "warning" | "success" }

/** 화면 하나(채용공고·업체목록)의 설정. 빌드 때 HTML을 그릴 때와 브라우저에서 함께 쓴다. */
export type PageConfig = {
    path: "/openings" | "/companies"
    dataset: DatasetName
    schema: Schema
    noun: string
    icons: Record<string, IconName>
    moreHint: string
    /** 그 필드가 없는 레코드도 검색조건을 통과시킬지 */
    keepMissing: boolean
    favoritesStorage: string
    favoriteKey: (table: Table, id: number) => string
    /** now: 마감일 표시 기준. 빌드 때 그린 뒤 브라우저에서 다시 맞춘다. */
    item: (table: Table, id: number, now: Date) => { primary: string, secondary: string, chip?: Chip }
    detailRows: readonly (readonly string[])[]
    /** 이 행은 병역일터 원문 링크로 보여 준다. */
    link: (table: Table, id: number) => { row: string, href: string, text: string } | undefined
    /** 상세정보에서 이 필드 값을 사이트 안의 다른 화면으로 잇는다. */
    fieldLink?: (table: Table, id: number, field: string) => string | undefined
    /** 업체명 말고 더 찾을 글 */
    keyword?: { label: string, fields: readonly string[] }
    format?: (name: string, value: string) => string
}
