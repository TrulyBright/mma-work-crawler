import { useCallback, useEffect, useMemo, useRef, useState } from "preact/hooks"
import { count, set } from "../db/bits"
import { load } from "../db/load"
import { TextIndex } from "../db/ngram"
import { facetCounts, type Query, type Selection, take } from "../db/query"
import type { DatasetName, Schema } from "../db/schema"
import type { Table } from "../db/table"
import { FilterGroup } from "./FilterGroup"
import { Icon, type IconName } from "./icons"
import { memo } from "./memo"
import { navigate, onLinkClick, useLocation } from "./router"
import { ErrorView, Loading } from "./Shell"

export type Chip = { label: string, color: "error" | "warning" | "success" }

export type PageConfig = {
    path: string
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
    /** 상세정보에서 이 필드 값을 사이트 안의 다른 화면으로 잇는다. */
    fieldLink?: (table: Table, id: number, field: string) => string | undefined
    /** 업체명 말고 더 찾을 글 */
    keyword?: { label: string, fields: readonly string[] }
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

export const SearchPage = ({ config, active }: { config: PageConfig, active: boolean }) => {
    const [table, setTable] = useState<Table>()
    const [error, setError] = useState<string>()
    useEffect(() => {
        load(config.dataset).then(setTable, (e: unknown) => setError(e instanceof Error ? e.message : String(e)))
    }, [config.dataset])
    if (error) return <ErrorView message={error} />
    if (!table) return <Loading />
    return <Search table={table} config={config} active={active} />
}

type Favorites = { yes: boolean, no: boolean }

type State = {
    selection: Selection
    name: string
    keyword: string
    favorites: Favorites
    sort: string
}

const emptyState = (schema: Schema): State => ({
    selection: new Map(),
    name: "",
    keyword: "",
    favorites: { yes: false, no: false },
    sort: schema.sorts[0],
})

/** 검색조건을 주소 쿼리로. 값 번호는 배포마다 바뀔 수 있어 값 이름을 쓴다. */
const toSearch = (table: Table, config: PageConfig, state: State) => {
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

const fromSearch = (table: Table, config: PageConfig, search: string): State => {
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

/** 값이 같으면 예전 배열을 그대로 써서, 바뀌지 않은 검색조건은 다시 그리지 않게 한다. */
const sameCounts = (a: Int32Array | undefined, b: Int32Array) => a !== undefined && a.length === b.length && a.every((x, i) => x === b[i])

const Search = ({ table, config, active }: { table: Table, config: PageConfig, active: boolean }) => {
    const { schema, noun } = config
    const location = useLocation()
    const [state, setState] = useState<State>(() =>
        active && location.search ? fromSearch(table, config, location.search) : emptyState(schema))
    const { selection, name, keyword, favorites: favoriteFilter, sort } = state
    const [favorites, setFavorites] = useState(() => readFavorites(config.favoritesStorage))
    const [limit, setLimit] = useState(PAGE)
    const [open, setOpen] = useState<ReadonlySet<number>>(new Set())
    const [moreOpen, setMoreOpen] = useState(() => schema.more.some((entry) => state.selection.has(entry)))
    const update = (patch: Partial<State>) => setState((prev) => ({ ...prev, ...patch }))

    // 다른 화면에서 링크로 오거나 뒤로 가기로 돌아오면 주소의 검색조건을 따르고,
    // 메뉴로 그냥 들어오면 지금 검색조건을 주소에 적는다.
    const applied = useRef(location.search)
    useEffect(() => {
        if (!active) return
        if (location.search && location.search !== toSearch(table, config, state)) {
            const next = fromSearch(table, config, location.search)
            setState(next)
            if (schema.more.some((entry) => next.selection.has(entry))) setMoreOpen(true)
            applied.current = location.search
        }
        // state는 일부러 뺐다. 주소가 바뀔 때만 따른다.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active, location.search, table, config])
    useEffect(() => {
        if (!active) return
        const timer = setTimeout(() => navigate(config.path + toSearch(table, config, state), { replace: true }), 250)
        return () => clearTimeout(timer)
    }, [active, table, config, state])

    const textIndex = useRef<{ name?: TextIndex, keyword?: TextIndex }>({})
    const nameMask = useMemo(() => {
        if (!name.trim()) return undefined
        textIndex.current.name ??= new TextIndex(table.text("업체명") ?? [])
        return textIndex.current.name.search(name)
    }, [table, name])
    const keywordMask = useMemo(() => {
        if (!config.keyword || !keyword.trim()) return undefined
        if (!textIndex.current.keyword) {
            const columns = config.keyword.fields.map((field) => table.text(field) ?? [])
            const joined = Array.from({ length: table.n }, (_, id) => columns.map((c) => c[id] ?? "").join("\u0001"))
            textIndex.current.keyword = new TextIndex(joined)
        }
        return textIndex.current.keyword.search(keyword)
    }, [table, config, keyword])

    const keyIndex = useRef<Map<string, number>>()
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
    const shownFacets = useMemo(() => (moreOpen ? [...schema.main, ...schema.more] : schema.main), [schema, moreOpen])
    const previousCounts = useRef(new Map<string, Int32Array>())
    const { result, counts } = useMemo(() => {
        const query: Query = {
            selection,
            matchAll,
            keepMissing: config.keepMissing,
            extra: [nameMask, keywordMask, favoriteMask].filter((m): m is Uint32Array => m !== undefined),
        }
        const out = facetCounts(table, query, shownFacets)
        for (const [entry, c] of out.counts) {
            const prev = previousCounts.current.get(entry)
            if (sameCounts(prev, c)) out.counts.set(entry, prev!)
            else previousCounts.current.set(entry, c)
        }
        return out
    }, [table, config, matchAll, shownFacets, selection, nameMask, keywordMask, favoriteMask])
    const total = useMemo(() => count(result), [result])
    const ids = useMemo(() => take(table, result, sort, limit), [table, result, sort, limit])

    useEffect(() => setLimit(PAGE), [selection, name, keyword, favoriteFilter])
    useEffect(() => writeFavorites(config.favoritesStorage, favorites), [config, favorites])
    // 링크로 들어와 결과가 하나뿐이면 바로 펼친다.
    useEffect(() => {
        if (applied.current && total === 1) setOpen(new Set(ids))
        applied.current = ""
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state])

    const onFilter = useCallback((entry: string, next: ReadonlySet<number>) => {
        setState((prev) => {
            const selection = new Map(prev.selection)
            if (next.size) selection.set(entry, next)
            else selection.delete(entry)
            return { ...prev, selection }
        })
    }, [])
    const reset = () => setState({ ...emptyState(schema), sort })
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

    const active_: string[] = []
    for (const [entry, chosen] of selection) {
        const values = table.facet(entry)?.values ?? []
        active_.push(`${entry}: ${[...chosen].map((i) => values[i]).join(", ")}`)
    }
    if (favoriteFilter.yes !== favoriteFilter.no) active_.push(`즐겨찾기: ${favoriteFilter.yes ? `즐겨찾는 ${noun}` : `즐겨찾지 않는 ${noun}`}`)
    if (name.trim()) active_.push(`업체명: ${name}`)
    if (config.keyword && keyword.trim()) active_.push(`${config.keyword.label}: ${keyword}`)

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
                counts={counts.get(entry)}
                onChange={onFilter}
            />
        )
    }

    const textField = (id: string, label: string, value: string, onInput: (value: string) => void) => (
        <div class="textfield">
            <input id={id} type="search" placeholder=" " value={value} onInput={(e) => onInput(e.currentTarget.value)} autocomplete="off" />
            <label for={id}>{label}</label>
        </div>
    )

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
                                    <input type="checkbox" checked={favoriteFilter.yes} onChange={(e) => update({ favorites: { ...favoriteFilter, yes: e.currentTarget.checked } })} />
                                    <span>즐겨찾는 {noun}</span>
                                </label>
                                <label>
                                    <input type="checkbox" checked={favoriteFilter.no} onChange={(e) => update({ favorites: { ...favoriteFilter, no: e.currentTarget.checked } })} />
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
                        {textField(`${config.dataset}-name`, "업체명", name, (v) => update({ name: v }))}
                        {config.keyword && textField(`${config.dataset}-keyword`, config.keyword.label, keyword, (v) => update({ keyword: v }))}
                    </li>
                </ul>
            </section>
            <ul class="list results">
                <li class="subheader sticky">
                    <span>
                        전체 {noun} <strong>{table.n}</strong>개 중{" "}
                        <span class="badge-wrap" title={active_.join("\n") || "선택된 조건이 없습니다."}>
                            <span class="contained-btn">조건</span>
                            {active_.length > 0 && <span class="badge">{active_.length}</span>}
                        </span>
                        에 맞는 <strong>{total}</strong>개를{" "}
                        <span class="sort">
                            <select value={sort} onChange={(e) => update({ sort: e.currentTarget.value })} aria-label="정렬">
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
    const loaded = table.detailLoaded
    useEffect(() => {
        if (loaded) return
        // 그린 뒤 effect가 돌기 전에 도착했을 수도 있다.
        if (table.detailLoaded) rerender((x) => x + 1)
        else return table.onDetail(() => rerender((x) => x + 1))
    }, [table, loaded])
    if (!loaded) return <li class="detail"><Loading /></li>
    const link = config.link(table, id)
    const format = config.format ?? ((_: string, value: string) => value)
    const value = (name: string, i: number) => {
        const text = format(name, table.field(name, id)!)
        const href = config.fieldLink?.(table, id, name)
        return (
            <>
                {i > 0 && " / "}
                {href ? <a class="internal" href={href} onClick={onLinkClick}>{text}</a> : text}
            </>
        )
    }
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
                        : present.map(value)
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
