// 검색 화면 하나를 맡는다. 빌드 때 미리 그린 HTML을 그대로 이어받고, 검색조건이 바뀌면 달라진 부분만 고친다.
import { set } from "../db/bits.ts"
import { TextIndex } from "../db/ngram.ts"
import type { Table } from "../db/table.ts"
import type { PageConfig } from "../pages/types.ts"
import { icon } from "../view/icons.ts"
import { evaluate, shownFacets } from "../view/model.ts"
import * as R from "../view/render.ts"
import { PAGE, type State, conditions, emptyState, fromSearch, moreSelected, toSearch } from "../view/state.ts"
import { element, elements, reconcile } from "./dom.ts"
import { items, searchTracker, track } from "./track.ts"

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

type Group = { name: string, inputs: HTMLInputElement[], counts: (HTMLElement | null)[] }
type Row = { item: HTMLElement, detail?: HTMLElement, favorite: boolean, open: boolean }

/** 미리 그린 화면에서 스크립트가 손댈 요소들 */
type Dom = {
    moreToggle: HTMLElement
    favorites: { yes: HTMLInputElement, no: HTMLInputElement }
    name: HTMLInputElement
    keyword: HTMLInputElement | null
    list: HTMLElement
    header: HTMLElement
    total: HTMLElement
    badge: HTMLElement
    sort: HTMLSelectElement
}

const need = <T extends Element>(root: ParentNode, selector: string) => {
    const el = root.querySelector<T>(selector)
    if (!el) throw new Error(`화면 구성이 올바르지 않습니다. (${selector})`)
    return el
}

const findDom = (el: HTMLElement): Dom => {
    const list = need<HTMLElement>(el, "ul.results")
    const header = need<HTMLElement>(list, ".subheader")
    return {
        moreToggle: need<HTMLElement>(el, '[data-action="more-filters"]').parentElement!,
        favorites: {
            yes: need<HTMLInputElement>(el, '[data-favorites="yes"]'),
            no: need<HTMLInputElement>(el, '[data-favorites="no"]'),
        },
        name: need<HTMLInputElement>(el, '[data-text="name"]'),
        keyword: el.querySelector<HTMLInputElement>('[data-text="keyword"]'),
        list,
        header,
        total: need<HTMLElement>(header, "[data-total]"),
        badge: need<HTMLElement>(header, ".badge-wrap"),
        sort: need<HTMLSelectElement>(header, "select"),
    }
}

export class SearchView {
    private state: State
    private limit = PAGE
    private open = new Set<number>()
    private moreOpen: boolean
    private favorites: Record<string, true>
    private active = false
    /** 주소의 검색조건을 막 적용했으면, 결과가 하나뿐일 때 바로 펼친다. */
    private justApplied: boolean
    private syncTimer: ReturnType<typeof setTimeout> | undefined
    private readonly dom: Dom
    private readonly groups = new Map<string, Group>()
    private moreNodes: HTMLElement[] = []
    private readonly rows = new Map<number, Row>()
    private last = { ids: [] as readonly number[], total: 0 }
    private emptyEl: HTMLElement | undefined
    private moreEl: HTMLElement | undefined
    private moreKey = ""
    private readonly footerEl: HTMLElement | undefined
    private waitingDetail = false
    private readonly index: { name?: TextIndex, keyword?: TextIndex, keys?: Map<string, number> } = {}
    private readonly memo: {
        name?: { q: string, mask: Uint32Array }
        keyword?: { q: string, mask: Uint32Array }
        favorites?: { of: Record<string, true>, no: boolean, mask: Uint32Array }
    } = {}

    constructor(private readonly el: HTMLElement, private readonly config: PageConfig, private readonly table: Table, search: string) {
        const { schema } = config
        this.favorites = readFavorites(config.favoritesStorage)
        const prerendered = el.querySelector("section.paper") !== null
        // 스크립트가 늦게 도착하는 사이에 고른 검색조건도 이어받는다.
        this.state = search ? fromSearch(table, config, search) : prerendered ? this.readDom(el) : emptyState(schema)
        this.moreOpen = moreSelected(schema, this.state)
        this.justApplied = search !== ""
        if (!prerendered) {
            const { counts, total, ids } = this.compute()
            el.innerHTML = R.searchPage({
                table, config, state: this.state, counts, total, ids,
                limit: this.limit, open: this.open, moreOpen: this.moreOpen, favorites: this.favorites,
                now: new Date(), updatedAt: R.formatUpdatedAt(table.updatedAt),
            })
        }
        this.dom = findDom(el)
        for (const li of el.querySelectorAll<HTMLElement>("li[data-facet]")) this.register(li)
        if (this.moreOpen && !prerendered) {
            const toggle = this.dom.moreToggle
            for (let node = toggle.nextElementSibling; node && !node.classList.contains("name-search"); node = node.nextElementSibling) this.moreNodes.push(node as HTMLElement)
        }
        this.footerEl = this.dom.list.querySelector<HTMLElement>(":scope > .footer") ?? undefined
        this.emptyEl = this.dom.list.querySelector<HTMLElement>(":scope > .empty") ?? undefined
        this.moreEl = this.dom.list.querySelector('[data-action="more"]')?.parentElement ?? undefined
        this.adoptRows(prerendered)
        this.bind()
        this.update()
    }

    /** 화면에 보일 때. 주소에 다른 검색조건이 있으면 그것을 따른다. */
    activate(search: string) {
        this.active = true
        if (search && search !== toSearch(this.table, this.config, this.state)) {
            this.state = fromSearch(this.table, this.config, search)
            if (moreSelected(this.config.schema, this.state)) this.moreOpen = true
            this.limit = PAGE
            this.justApplied = true
            this.update()
        }
        this.scheduleSync()
    }

    deactivate() {
        this.active = false
        clearTimeout(this.syncTimer)
    }

    // 상태

    private readDom(el: HTMLElement): State {
        const state = emptyState(this.config.schema)
        const selection = new Map<string, Set<number>>()
        for (const li of el.querySelectorAll<HTMLElement>("li[data-facet]")) {
            const chosen = new Set<number>()
            for (const input of li.querySelectorAll<HTMLInputElement>("input[data-i]")) if (input.checked) chosen.add(Number(input.dataset.i))
            if (chosen.size) selection.set(li.dataset.facet!, chosen)
        }
        const value = (selector: string) => el.querySelector<HTMLInputElement>(selector)?.value ?? ""
        const sort = el.querySelector<HTMLSelectElement>("ul.results select")?.value ?? ""
        return {
            selection,
            name: value('[data-text="name"]'),
            keyword: this.config.keyword ? value('[data-text="keyword"]') : "",
            favorites: {
                yes: el.querySelector<HTMLInputElement>('[data-favorites="yes"]')?.checked ?? false,
                no: el.querySelector<HTMLInputElement>('[data-favorites="no"]')?.checked ?? false,
            },
            sort: this.config.schema.sorts.includes(sort) ? sort : state.sort,
        }
    }

    private setState(patch: Partial<State>, resetLimit: boolean) {
        this.state = { ...this.state, ...patch }
        if (resetLimit) this.limit = PAGE
        this.update()
        this.scheduleSync()
    }

    private setFacet(name: string, next: ReadonlySet<number>) {
        const selection = new Map(this.state.selection)
        if (next.size) selection.set(name, next)
        else selection.delete(name)
        this.setState({ selection }, true)
    }

    /** 검색조건을 주소에 적는다. 기록은 남기지 않는다. */
    private scheduleSync() {
        clearTimeout(this.syncTimer)
        if (!this.active) return
        this.syncTimer = setTimeout(() => {
            if (!this.active) return
            const url = this.config.path + toSearch(this.table, this.config, this.state)
            if (url !== location.pathname + location.search) history.replaceState(null, "", url)
        }, 250)
    }

    // 검색

    private nameMask() {
        const q = this.state.name
        if (!q.trim()) return undefined
        if (this.memo.name?.q !== q) {
            this.index.name ??= new TextIndex(this.table.text("업체명") ?? [])
            this.memo.name = { q, mask: this.index.name.search(q) }
        }
        return this.memo.name.mask
    }

    private keywordMask() {
        const { keyword } = this.config
        const q = this.state.keyword
        if (!keyword || !q.trim()) return undefined
        if (this.memo.keyword?.q !== q) {
            if (!this.index.keyword) {
                const columns = keyword.fields.map((field) => this.table.text(field) ?? [])
                const joined = Array.from({ length: this.table.n }, (_, id) => columns.map((c) => c[id] ?? "").join("\u0001"))
                this.index.keyword = new TextIndex(joined)
            }
            this.memo.keyword = { q, mask: this.index.keyword.search(q) }
        }
        return this.memo.keyword.mask
    }

    private favoriteMask() {
        const { yes, no } = this.state.favorites
        if (yes === no) return undefined
        const memo = this.memo.favorites
        if (memo?.of === this.favorites && memo.no === no) return memo.mask
        if (!this.index.keys) {
            this.index.keys = new Map()
            for (let id = 0; id < this.table.n; id++) this.index.keys.set(this.config.favoriteKey(this.table, id), id)
        }
        const mask = new Uint32Array(this.table.W)
        for (const key in this.favorites) {
            const id = this.index.keys.get(key)
            if (id !== undefined) set(mask, id)
        }
        if (no) for (let i = 0; i < mask.length; i++) mask[i] = ~mask[i]
        this.memo.favorites = { of: this.favorites, no, mask }
        return mask
    }

    private compute() {
        const extra = [this.nameMask(), this.keywordMask(), this.favoriteMask()].filter((m): m is Uint32Array => m !== undefined)
        const shown = shownFacets(this.config, this.moreOpen)
        const out = evaluate(this.table, this.config, this.state, extra, shown, this.limit)
        if (this.justApplied) {
            if (out.total === 1) this.open = new Set(out.ids)
            this.justApplied = false
        }
        return { ...out, shown }
    }

    // 화면 고치기

    private update() {
        const { counts, total, ids, shown } = this.compute()
        this.patchPanel(shown, counts)
        this.patchHeader(total)
        this.last = { ids, total }
        this.patchRows()
    }

    private register(li: HTMLElement) {
        const inputs = Array.from(li.querySelectorAll<HTMLInputElement>("input[data-i]"))
        this.groups.set(li.dataset.facet!, {
            name: li.dataset.facet!,
            inputs,
            counts: inputs.map((input) => input.parentElement!.querySelector<HTMLElement>(".count")),
        })
    }

    private patchPanel(shown: readonly string[], counts: ReadonlyMap<string, Int32Array>) {
        const { config, table, state, dom } = this
        if (this.moreOpen && this.moreNodes.length === 0) {
            const html = config.schema.more.map((name) => R.filterGroup(config, name, table.facet(name)?.values ?? [], state.selection.get(name), counts.get(name))).join("")
            this.moreNodes = elements(html + R.lessToggle())
            dom.moreToggle.after(...this.moreNodes)
            for (const node of this.moreNodes) if (node.dataset.facet) this.register(node)
        } else if (!this.moreOpen && this.moreNodes.length > 0) {
            for (const node of this.moreNodes) {
                node.remove()
                if (node.dataset.facet) this.groups.delete(node.dataset.facet)
            }
            this.moreNodes = []
        }
        const toggle = dom.moreToggle.firstElementChild!
        toggle.setAttribute("aria-expanded", String(this.moreOpen))
        toggle.firstElementChild!.classList.toggle("flip", this.moreOpen)

        for (const name of shown) {
            const group = this.groups.get(name)
            if (!group) continue
            const chosen = state.selection.get(name)
            const c = counts.get(name)
            group.inputs.forEach((input, i) => {
                const on = chosen?.has(i) ?? false
                if (input.checked !== on) input.checked = on
                const span = group.counts[i]
                if (c && span) {
                    const value = String(c[i])
                    if (span.textContent !== value) span.textContent = value
                }
                const label = input.parentElement!
                const zero = c !== undefined && c[i] === 0 && !on
                if (zero !== (label.className === "zero")) {
                    if (zero) label.className = "zero"
                    else label.removeAttribute("class")
                }
            })
        }
        if (dom.favorites.yes.checked !== state.favorites.yes) dom.favorites.yes.checked = state.favorites.yes
        if (dom.favorites.no.checked !== state.favorites.no) dom.favorites.no.checked = state.favorites.no
        if (dom.name.value !== state.name) dom.name.value = state.name
        if (dom.keyword && dom.keyword.value !== state.keyword) dom.keyword.value = state.keyword
    }

    private patchHeader(total: number) {
        const { dom } = this
        const value = String(total)
        if (dom.total.textContent !== value) dom.total.textContent = value
        const list = conditions(this.table, this.config, this.state)
        const title = list.join("\n") || "선택된 조건이 없습니다."
        if (dom.badge.title !== title) dom.badge.title = title
        let badge = dom.badge.querySelector<HTMLElement>(".badge")
        if (list.length > 0) {
            if (!badge) {
                badge = document.createElement("span")
                badge.className = "badge"
                dom.badge.append(badge)
            }
            if (badge.textContent !== String(list.length)) badge.textContent = String(list.length)
        } else badge?.remove()
        if (dom.sort.value !== this.state.sort) dom.sort.value = this.state.sort
    }

    /** 미리 그린 행을 이어받는다. 마감일 표시는 빌드한 날이 아니라 오늘 기준으로 다시 맞춘다. */
    private adoptRows(prerendered: boolean) {
        const now = new Date()
        for (const item of this.dom.list.querySelectorAll<HTMLElement>(":scope > li.item")) {
            const id = Number(item.dataset.id)
            const toggle = item.querySelector('[data-action="toggle"]')!
            const row: Row = {
                item,
                favorite: item.querySelector('[data-action="favorite"]')!.getAttribute("aria-label") === "즐겨찾기 해제",
                open: toggle.getAttribute("aria-expanded") === "true",
            }
            const next = item.nextElementSibling as HTMLElement | null
            if (next?.dataset.detail === String(id)) row.detail = next
            this.rows.set(id, row)
            if (!prerendered) continue
            const fresh = R.chip(this.config.item(this.table, id, now).chip)
            const current = toggle.querySelector(".chip")
            if ((current?.outerHTML ?? "") !== fresh) {
                current?.remove()
                if (fresh) toggle.lastElementChild!.before(element(fresh))
            }
        }
        if (prerendered && this.footerEl) {
            const local = element(R.footer(R.formatUpdatedAt(this.table.updatedAt)))
            if (local.textContent !== this.footerEl.textContent) this.footerEl.textContent = local.textContent
        }
    }

    private rowFor(id: number): Row {
        let row = this.rows.get(id)
        if (!row) {
            const favorite = this.favorites[this.config.favoriteKey(this.table, id)] === true
            row = { item: element(R.row(this.table, this.config, id, false, favorite, new Date())), favorite, open: false }
            this.rows.set(id, row)
        }
        return row
    }

    private syncRow(id: number, row: Row) {
        const favorite = this.favorites[this.config.favoriteKey(this.table, id)] === true
        if (row.favorite !== favorite) {
            const button = row.item.firstElementChild!
            button.setAttribute("aria-label", favorite ? "즐겨찾기 해제" : "즐겨찾기 추가")
            button.innerHTML = icon(favorite ? "Star" : "StarBorder", { small: true })
            row.favorite = favorite
        }
        const open = this.open.has(id)
        if (row.open !== open) {
            const toggle = row.item.lastElementChild!
            toggle.setAttribute("aria-expanded", String(open))
            toggle.lastElementChild!.classList.toggle("flip", open)
            row.open = open
        }
        if (open && !row.detail) {
            row.detail = element(this.table.detailLoaded ? R.detail(this.table, this.config, id) : R.detailLoading(id))
            if (!this.table.detailLoaded) this.waitDetail()
        } else if (!open) row.detail = undefined
    }

    private waitDetail() {
        if (this.waitingDetail) return
        this.waitingDetail = true
        this.table.onDetail(() => {
            for (const [id, row] of this.rows) {
                if (!row.detail?.querySelector(".loading")) continue
                const fresh = element(R.detail(this.table, this.config, id))
                row.detail.replaceWith(fresh)
                row.detail = fresh
            }
        })
    }

    private patchRows() {
        const { ids, total } = this.last
        const { noun } = this.config
        const want: Node[] = [this.dom.header]
        if (total === 0) want.push((this.emptyEl ??= element(R.empty(noun))))
        const shown = new Set(ids)
        for (const id of ids) {
            const row = this.rowFor(id)
            this.syncRow(id, row)
            want.push(row.item)
            if (row.detail) want.push(row.detail)
        }
        if (this.limit < total) {
            const key = `${this.limit}/${total}`
            if (!this.moreEl || this.moreKey !== key) {
                const fresh = element(R.moreRow(noun, this.limit, total))
                this.moreEl?.replaceWith(fresh)
                this.moreEl = fresh
                this.moreKey = key
            }
            want.push(this.moreEl)
        }
        if (this.footerEl) want.push(this.footerEl)
        reconcile(this.dom.list, want)
        for (const id of this.rows.keys()) if (!shown.has(id)) this.rows.delete(id)
    }

    // 이벤트

    private bind() {
        const { el, config, table } = this
        // 방문 통계에는 사람이 직접 한 행동만 남긴다(주소에서 검색조건을 적용하는 것은 빼고).
        const choose = (type: string, value: string) => track("select_content", { content_type: type, content_id: value, item_list_id: config.dataset })
        const searched = {
            name: searchTracker("업체명"),
            keyword: searchTracker(config.keyword?.label ?? ""),
        }
        el.addEventListener("change", (e) => {
            const t = e.target
            if (t instanceof HTMLInputElement && t.type === "checkbox") {
                if (t.dataset.i !== undefined) {
                    const name = t.closest<HTMLElement>("[data-facet]")?.dataset.facet
                    if (!name) return
                    const i = Number(t.dataset.i)
                    const next = new Set(this.state.selection.get(name))
                    if (t.checked) next.add(i)
                    else next.delete(i)
                    if (t.checked) choose(name, table.facet(name)?.values[i] ?? "")
                    this.setFacet(name, next)
                } else if (t.dataset.favorites === "yes" || t.dataset.favorites === "no") {
                    if (t.checked) choose("즐겨찾기", `${t.dataset.favorites === "yes" ? "즐겨찾는" : "즐겨찾지 않는"} ${config.noun}`)
                    this.setState({ favorites: { ...this.state.favorites, [t.dataset.favorites]: t.checked } }, true)
                }
            } else if (t instanceof HTMLSelectElement) {
                choose("정렬", t.value)
                this.setState({ sort: t.value }, false)
            }
        })
        el.addEventListener("input", (e) => {
            const t = e.target
            if (!(t instanceof HTMLInputElement) || !t.dataset.text) return
            const field = t.dataset.text === "name" ? "name" : "keyword"
            searched[field](t.value)
            this.setState(field === "name" ? { name: t.value } : { keyword: t.value }, true)
        })
        el.addEventListener("click", (e) => {
            // 병역일터 원문으로 나가는 링크
            const original = (e.target as Element).closest<HTMLAnchorElement>('.detail a[target="_blank"]')
            const detail = original?.closest<HTMLElement>("[data-detail]")
            if (original && detail && el.contains(detail)) track("select_item", { item_list_id: config.dataset, items: items(table, config, Number(detail.dataset.detail)) })
            const button = (e.target as Element).closest<HTMLElement>("button[data-action]")
            if (!button || !el.contains(button)) return
            const id = () => Number(button.closest<HTMLElement>("[data-id]")?.dataset.id ?? button.closest<HTMLElement>("[data-detail]")?.dataset.detail)
            const facet = () => button.closest<HTMLElement>("[data-facet]")!.dataset.facet!
            switch (button.dataset.action) {
                case "reset":
                    choose("전체 초기화", "전체 초기화")
                    return this.setState({ ...emptyState(config.schema), sort: this.state.sort }, true)
                case "all":
                    choose(facet(), "전체선택")
                    return this.setFacet(facet(), new Set(table.facet(facet())?.values.keys() ?? []))
                case "none":
                    choose(facet(), "전체해제")
                    return this.setFacet(facet(), new Set())
                case "more-filters":
                    this.moreOpen = !this.moreOpen
                    choose("상세검색", this.moreOpen ? "상세검색" : "상세검색 접기")
                    return this.update()
                case "less-filters":
                    this.moreOpen = false
                    choose("상세검색", "상세검색 접기")
                    return this.update()
                case "favorite":
                    return this.toggleFavorite(id())
                case "toggle": {
                    const target = id()
                    if (!this.open.delete(target)) {
                        this.open.add(target)
                        track("view_item", { item_list_id: config.dataset, items: items(table, config, target) })
                    }
                    return this.patchRows()
                }
                case "collapse":
                    this.open = new Set()
                    return this.patchRows()
                case "more":
                    this.limit += PAGE
                    choose("더보기", String(this.limit))
                    return this.update()
            }
        })
    }

    private toggleFavorite(id: number) {
        const key = this.config.favoriteKey(this.table, id)
        const next = { ...this.favorites }
        const adding = !next[key]
        if (adding) next[key] = true
        else delete next[key]
        track(adding ? "add_to_wishlist" : "remove_from_wishlist", { item_list_id: this.config.dataset, items: items(this.table, this.config, id) })
        this.favorites = next
        writeFavorites(this.config.favoritesStorage, next)
        // 즐겨찾기로 거르고 있을 때만 결과가 바뀐다.
        if (this.state.favorites.yes !== this.state.favorites.no) this.update()
        else this.patchRows()
    }
}
