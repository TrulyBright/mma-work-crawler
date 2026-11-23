import { useCallback, useEffect, useMemo, useRef, useState } from "preact/hooks"
import { count, set } from "../db/bits"
import { load } from "../db/load"
import { NameIndex } from "../db/ngram"
import { evaluate, type Query, type Selection, take } from "../db/query"
import type { DatasetName, Schema } from "../db/schema"
import type { Table } from "../db/table"
import { FilterGroup } from "./FilterGroup"
import { Icon, type IconName } from "./icons"
import { memo } from "./memo"
import { ErrorView, Loading } from "./Shell"

export type Chip = { label: string, color: "error" | "warning" | "success" }

export type PageConfig = {
    dataset: DatasetName
    schema: Schema
    noun: string
    icons: Record<string, IconName>
    moreHint: string
    /** 그 필드가 없는 레코드도 검색조건을 통과시킬지 */
    keepMissing: boolean
    favoritesStorage: string
    favoriteKey: (table: Table, id: number) => string
    item: (table: Table, id: number) => { primary: string, secondary: string, chip?: Chip }
    detailRows: readonly (readonly string[])[]
    /** 이 행은 병역일터 원문 링크로 보여 준다. */
    link: (table: Table, id: number) => { row: string, href: string, text: string } | undefined
    format?: (name: string, value: string) => string
}

const PAGE = 50

const readFavorites = (key: string): Record<string, true> => {
    try {
        return JSON.parse(localStorage.getItem(key) || "{}")
    } catch {
        return {}
    }
}

const writeFavorites = (key: string, value: Record<string, true>) => {
    try {
        localStorage.setItem(key, JSON.stringify(value))
    } catch {
        // 저장하지 못해도 이번 방문에서는 유지된다.
    }
}

export const SearchPage = ({ config }: { config: PageConfig }) => {
    const [table, setTable] = useState<Table>()
    const [error, setError] = useState<string>()
    useEffect(() => {
        load(config.dataset).then(setTable, (e: unknown) => setError(e instanceof Error ? e.message : String(e)))
    }, [config.dataset])
    if (error) return <ErrorView message={error} />
    if (!table) return <Loading />
    return <Search table={table} config={config} />
}

type Favorites = { yes: boolean, no: boolean }

const Search = ({ table, config }: { table: Table, config: PageConfig }) => {
    const { schema, noun } = config
    const [selection, setSelection] = useState<Selection>(new Map())
    const [name, setName] = useState("")
    const [favoriteFilter, setFavoriteFilter] = useState<Favorites>({ yes: false, no: false })
    const [favorites, setFavorites] = useState(() => readFavorites(config.favoritesStorage))
    const [sort, setSort] = useState(schema.sorts[0])
    const [limit, setLimit] = useState(PAGE)
    const [open, setOpen] = useState<ReadonlySet<number>>(new Set())
    const [moreOpen, setMoreOpen] = useState(false)

    const nameIndex = useRef<NameIndex>()
    const keyIndex = useRef<Map<string, number>>()

    const nameMask = useMemo(() => {
        if (!name.trim()) return undefined
        nameIndex.current ??= new NameIndex(table.text("업체명") ?? [])
        return nameIndex.current.search(name)
    }, [table, name])

    const favoriteMask = useMemo(() => {
        const { yes, no } = favoriteFilter
        if (yes === no) return undefined
        if (!keyIndex.current) {
            keyIndex.current = new Map()
            for (let id = 0; id < table.n; id++) keyIndex.current.set(config.favoriteKey(table, id), id)
        }
        const mask = new Uint32Array(table.W)
        for (const key in favorites) {
            const id = keyIndex.current.get(key)
            if (id !== undefined) set(mask, id)
        }
        if (no) for (let i = 0; i < mask.length; i++) mask[i] = ~mask[i]
        return mask
    }, [table, config, favorites, favoriteFilter])

    const matchAll = useMemo(() => new Set(schema.matchAll), [schema])
    const result = useMemo(() => {
        const query: Query = {
            selection,
            matchAll,
            keepMissing: config.keepMissing,
            extra: [nameMask, favoriteMask].filter((m): m is Uint32Array => m !== undefined),
        }
        return evaluate(table, query)
    }, [table, config, matchAll, selection, nameMask, favoriteMask])
    const total = useMemo(() => count(result), [result])
    const ids = useMemo(() => take(table, result, sort, limit), [table, result, sort, limit])

    useEffect(() => setLimit(PAGE), [selection, name, favoriteFilter])
    useEffect(() => writeFavorites(config.favoritesStorage, favorites), [config, favorites])

    const onFilter = useCallback((entry: string, next: ReadonlySet<number>) => {
        setSelection((prev) => {
            const copy = new Map(prev)
            if (next.size) copy.set(entry, next)
            else copy.delete(entry)
            return copy
        })
    }, [])
    const reset = () => {
        setSelection(new Map())
        setName("")
        setFavoriteFilter({ yes: false, no: false })
    }
    const toggleOpen = useCallback((id: number) => {
        setOpen((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }, [])
    const toggleFavorite = useCallback((id: number) => {
        const key = config.favoriteKey(table, id)
        setFavorites((prev) => {
            const next = { ...prev }
            if (next[key]) delete next[key]
            else next[key] = true
            return next
        })
    }, [table, config])

    const active: string[] = []
    for (const [entry, chosen] of selection) {
        const values = table.facet(entry)?.values ?? []
        active.push(`${entry}: ${[...chosen].map((i) => values[i]).join(", ")}`)
    }
    if (favoriteFilter.yes !== favoriteFilter.no) active.push(`즐겨찾기: ${favoriteFilter.yes ? `즐겨찾는 ${noun}` : `즐겨찾지 않는 ${noun}`}`)
    if (name.trim()) active.push(`업체명: ${name}`)

    const group = (entry: string) => {
        const facet = table.facet(entry)
        return (
            <FilterGroup
                key={entry}
                name={entry}
                icon={config.icons[entry]}
                noun={noun}
                values={facet?.values ?? []}
                chosen={selection.get(entry)}
                onChange={onFilter}
            />
        )
    }

    return (
        <>
            <section class="paper">
                <ul class="list">
                    <li class="subheader">
                        <span>검색조건</span>
                        <button type="button" class="text-btn" onClick={reset}>전체 초기화</button>
                    </li>
                    {schema.main.map(group)}
                    <li class="filter">
                        <fieldset>
                            <legend><Icon name="Star" /><strong>즐겨찾기</strong></legend>
                            <div class="options inline">
                                <label>
                                    <input type="checkbox" checked={favoriteFilter.yes} onChange={(e) => setFavoriteFilter({ ...favoriteFilter, yes: e.currentTarget.checked })} />
                                    <span>즐겨찾는 {noun}</span>
                                </label>
                                <label>
                                    <input type="checkbox" checked={favoriteFilter.no} onChange={(e) => setFavoriteFilter({ ...favoriteFilter, no: e.currentTarget.checked })} />
                                    <span>즐겨찾지 않는 {noun}</span>
                                </label>
                            </div>
                        </fieldset>
                    </li>
                    <li>
                        <button type="button" class="row-btn" aria-expanded={moreOpen} onClick={() => setMoreOpen(!moreOpen)}>
                            <Icon name="ExpandMore" class={moreOpen ? "flip" : undefined} />
                            <span class="row-text">
                                <span class="primary">상세검색</span>
                                <span class="secondary hint">{config.moreHint}</span>
                            </span>
                        </button>
                    </li>
                    {moreOpen && (
                        <>
                            {schema.more.map(group)}
                            <li>
                                <button type="button" class="row-btn" onClick={() => setMoreOpen(false)}>
                                    <Icon name="ExpandMore" class="flip" />
                                    <span class="row-text"><span class="primary">상세검색 접기</span></span>
                                </button>
                            </li>
                        </>
                    )}
                    <li class="name-search">
                        <div class="textfield">
                            <input id={`${config.dataset}-name`} type="search" placeholder=" " value={name} onInput={(e) => setName(e.currentTarget.value)} autocomplete="off" />
                            <label for={`${config.dataset}-name`}>업체명</label>
                        </div>
                    </li>
                </ul>
            </section>
            <ul class="list results">
                <li class="subheader sticky">
                    <span>
                        전체 {noun} <strong>{table.n}</strong>개 중{" "}
                        <span class="badge-wrap" title={active.join("\n") || "선택된 조건이 없습니다."}>
                            <span class="contained-btn">조건</span>
                            {active.length > 0 && <span class="badge">{active.length}</span>}
                        </span>
                        에 맞는 <strong>{total}</strong>개를{" "}
                        <span class="sort">
                            <select value={sort} onChange={(e) => setSort(e.currentTarget.value)} aria-label="정렬">
                                {schema.sorts.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <Icon name="ArrowDropDown" />
                        </span>
                        으로 정렬합니다.
                    </span>
                    <button type="button" class="text-btn" onClick={() => setOpen(new Set())}>모두 접기</button>
                </li>
                {total === 0 && (
                    <li class="empty">
                        <Icon name="SearchOff" />
                        <p>조건에 맞는 {noun}가 없습니다. 검색 조건을 조정해 주세요.</p>
                    </li>
                )}
                {ids.map((id) => (
                    <Row
                        key={id}
                        table={table}
                        config={config}
                        id={id}
                        open={open.has(id)}
                        favorite={favorites[config.favoriteKey(table, id)] === true}
                        onToggle={toggleOpen}
                        onFavorite={toggleFavorite}
                    />
                ))}
                {limit < total && (
                    <li>
                        <button type="button" class="row-btn" onClick={() => setLimit(limit + PAGE)}>
                            <Icon name="ExpandMore" />
                            <span class="row-text">
                                <span class="primary">{noun} {Math.min(total - limit, PAGE)}개 더보기 ({limit} / {total})</span>
                            </span>
                        </button>
                    </li>
                )}
                {table.updatedAt > 0 && (
                    <li class="footer">최종갱신: {new Date(table.updatedAt).toLocaleString("ko-KR")}</li>
                )}
            </ul>
        </>
    )
}

type RowProps = {
    table: Table
    config: PageConfig
    id: number
    open: boolean
    favorite: boolean
    onToggle: (id: number) => void
    onFavorite: (id: number) => void
}

const Row = memo(({ table, config, id, open, favorite, onToggle, onFavorite }: RowProps) => {
    const item = config.item(table, id)
    return (
        <>
            <li class="item">
                <button type="button" class="icon-btn" aria-label={favorite ? "즐겨찾기 해제" : "즐겨찾기 추가"} onClick={() => onFavorite(id)}>
                    <Icon name={favorite ? "Star" : "StarBorder"} small />
                </button>
                <button type="button" class="row-btn" aria-expanded={open} onClick={() => onToggle(id)}>
                    <span class="row-text">
                        <span class="primary">{item.primary}</span>
                        <span class="secondary">{item.secondary}</span>
                    </span>
                    {item.chip && <span class={`chip ${item.chip.color}`}>{item.chip.label}</span>}
                    <Icon name="ExpandMore" class={open ? "flip" : undefined} />
                </button>
            </li>
            {open && <Detail table={table} config={config} id={id} onClose={onToggle} />}
        </>
    )
})

const Detail = ({ table, config, id, onClose }: { table: Table, config: PageConfig, id: number, onClose: (id: number) => void }) => {
    const [, rerender] = useState(0)
    useEffect(() => (table.detailLoaded ? undefined : table.onDetail(() => rerender((x) => x + 1))), [table])
    if (!table.detailLoaded) return <li class="detail"><Loading /></li>
    const link = config.link(table, id)
    const format = config.format ?? ((_: string, value: string) => value)
    return (
        <li class="detail">
            <ul>
                {config.detailRows.map((row) => {
                    const present = row.filter((name) => table.field(name, id) !== undefined)
                    if (present.length === 0) return null
                    const icon = config.icons[present[0]]
                    const primary = present.join(" / ")
                    const content = link && link.row === row[0]
                        ? (
                            <a href={link.href} target="_blank" rel="noreferrer">
                                {link.text}
                                <Icon name="OpenInNew" small />
                            </a>
                        )
                        : present.map((name) => format(name, table.field(name, id)!)).join(" / ")
                    return (
                        <li key={primary} class="field">
                            {icon ? <Icon name={icon} /> : <span class="icon" />}
                            <span class="row-text">
                                <span class="primary">{primary}</span>
                                <span class="secondary pre">{content}</span>
                            </span>
                        </li>
                    )
                })}
                <li>
                    <button type="button" class="row-btn" onClick={() => onClose(id)}>
                        <Icon name="ExpandMore" class="flip" />
                        <span class="row-text"><span class="primary">상세정보 접기</span></span>
                    </button>
                </li>
            </ul>
        </li>
    )
}
