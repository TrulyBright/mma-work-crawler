// 화면 조각을 HTML 문자열로 그린다. DOM을 쓰지 않아 빌드(Node)에서도 그대로 돈다.
// data-* 속성은 브라우저 스크립트가 요소를 찾을 때만 쓴다. 모양에는 영향이 없다.
import type { Table } from "../db/table.ts"
import type { PageConfig } from "../pages/types.ts"
import { esc, text } from "./html.ts"
import { type IconName, icon } from "./icons.ts"
import { type Favorites, PAGE, type State, conditions } from "./state.ts"

/** 받침이 있으면 "은", 없으면 "는" */
const 은는 = (word: string) => {
    const code = word.charCodeAt(word.length - 1) - 0xac00
    return code >= 0 && code <= 11171 && code % 28 !== 0 ? "은" : "는"
}

const navLink = (href: string, iconName: IconName, label: string, current: boolean) =>
    `<li><a class="nav-item" href="${href}"${current ? ' aria-current="page"' : ""}>${icon(iconName)}<span>${label}</span></a></li>`

/** 상단 바와 사이드바. 화면 모드 단추는 두 가지를 다 그려 두고 CSS로 하나만 보인다. */
export const shell = (path: string, main: string) =>
    `<header class="appbar"><button type="button" class="icon-btn menu-btn" aria-label="사이드바 열기" data-action="menu">${icon("Menu")}</button>`
    + `<a class="appbar-title" href="/openings">병역일터 공고검색</a></header>`
    + `<nav class="drawer" aria-label="링크 목록"><div class="toolbar-space"></div><hr><ul>`
    + navLink("/openings", "ManageSearch", "채용공고", path === "/openings")
    + navLink("/companies", "Business", "업체목록", path === "/companies")
    + `<li><button type="button" class="nav-item" data-action="theme">`
    + `${icon("DarkMode", { class: "light-only" })}${icon("LightMode", { class: "dark-only" })}`
    + `<span class="light-only">어두운 화면으로</span><span class="dark-only">밝은 화면으로</span></button></li>`
    + `<li><a class="nav-item" href="https://github.com/TrulyBright/mma-work-crawler">${icon("GitHub")}<span>GitHub</span></a></li>`
    + `</ul><hr></nav><div class="backdrop" hidden></div><main>${main}</main>`

export const loading = () => `<div class="loading"><span class="spinner"></span><p>불러오는 중입니다...</p></div>`

export const errorView = (message: string) =>
    `<div id="error-page"><h1>오류</h1><p>예상치 못한 오류가 발생했습니다.</p><p><i>${text(message)}</i></p></div>`

export const pageSlot = (path: string, content: string) => `<div data-page="${path}">${content}</div>`

// 검색조건

export const filterGroup = (config: PageConfig, name: string, values: readonly string[], chosen: ReadonlySet<number> | undefined, counts: Int32Array | undefined) => {
    let options = ""
    values.forEach((value, i) => {
        const on = chosen?.has(i) ?? false
        const zero = counts !== undefined && counts[i] === 0 && !on
        options += `<label${zero ? ' class="zero"' : ""}><input type="checkbox" data-i="${i}"${on ? " checked" : ""}><span>${text(value)}</span>`
            + `${counts ? `<span class="count">${counts[i]}</span>` : ""}</label>`
    })
    return `<li class="filter" data-facet="${esc(name)}"><fieldset><legend>${icon(config.icons[name])}<strong>${text(name)}</strong>`
        + `<small>${config.noun}가 없는 ${text(name)}${은는(name)} 나오지 않습니다.</small>`
        + `<span class="actions"><button type="button" class="text-btn" data-action="all">전체선택</button><button type="button" class="text-btn" data-action="none">전체해제</button></span>`
        + `</legend><div class="options">${options}</div></fieldset></li>`
}

const favoritesGroup = (noun: string, f: Favorites) =>
    `<li class="filter"><fieldset><legend>${icon("Star")}<strong>즐겨찾기</strong></legend><div class="options inline">`
    + `<label><input type="checkbox" data-favorites="yes"${f.yes ? " checked" : ""}><span>즐겨찾는 ${noun}</span></label>`
    + `<label><input type="checkbox" data-favorites="no"${f.no ? " checked" : ""}><span>즐겨찾지 않는 ${noun}</span></label>`
    + `</div></fieldset></li>`

export const moreToggle = (open: boolean, hint: string) =>
    `<li><button type="button" class="row-btn" aria-expanded="${open}" data-action="more-filters">${icon("ExpandMore", { class: open ? "flip" : undefined })}`
    + `<span class="row-text"><span class="primary">상세검색</span><span class="secondary hint">${text(hint)}</span></span></button></li>`

export const lessToggle = () =>
    `<li><button type="button" class="row-btn" data-action="less-filters">${icon("ExpandMore", { class: "flip" })}<span class="row-text"><span class="primary">상세검색 접기</span></span></button></li>`

const textField = (id: string, role: "name" | "keyword", label: string, value: string) =>
    `<div class="textfield"><input id="${id}" type="search" placeholder=" "${value ? ` value="${esc(value)}"` : ""} autocomplete="off" data-text="${role}"><label for="${id}">${text(label)}</label></div>`

// 결과 목록

export const badge = (list: readonly string[]) =>
    `<span class="badge-wrap" title="${esc(list.join("\n") || "선택된 조건이 없습니다.")}"><span class="contained-btn">조건</span>${list.length > 0 ? `<span class="badge">${list.length}</span>` : ""}</span>`

export const chip = (c: { label: string, color: string } | undefined) => (c ? `<span class="chip ${c.color}">${text(c.label)}</span>` : "")

export const row = (table: Table, config: PageConfig, id: number, open: boolean, favorite: boolean, now: Date) => {
    const item = config.item(table, id, now)
    return `<li class="item" data-id="${id}"><button type="button" class="icon-btn" aria-label="${favorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}" data-action="favorite">${icon(favorite ? "Star" : "StarBorder", { small: true })}</button>`
        + `<button type="button" class="row-btn" aria-expanded="${open}" data-action="toggle"><span class="row-text"><span class="primary">${text(item.primary)}</span><span class="secondary">${text(item.secondary)}</span></span>`
        + `${chip(item.chip)}${icon("ExpandMore", { class: open ? "flip" : undefined })}</button></li>`
}

export const detailLoading = (id: number) => `<li class="detail" data-detail="${id}">${loading()}</li>`

export const detail = (table: Table, config: PageConfig, id: number) => {
    const link = config.link(table, id)
    const format = config.format ?? ((_: string, value: string) => value)
    const value = (name: string, i: number) => {
        const shown = text(format(name, table.field(name, id)!))
        const href = config.fieldLink?.(table, id, name)
        return `${i > 0 ? " / " : ""}${href ? `<a class="internal" href="${esc(href)}">${shown}</a>` : shown}`
    }
    let fields = ""
    for (const names of config.detailRows) {
        const present = names.filter((name) => table.field(name, id) !== undefined)
        if (present.length === 0) continue
        const iconName = config.icons[present[0]]
        const content = link && link.row === names[0]
            ? `<a href="${esc(link.href)}" target="_blank" rel="noreferrer">${text(link.text)}${icon("OpenInNew", { small: true })}</a>`
            : present.map(value).join("")
        fields += `<li class="field">${iconName ? icon(iconName) : '<span class="icon"></span>'}<span class="row-text"><span class="primary">${text(present.join(" / "))}</span><span class="secondary pre">${content}</span></span></li>`
    }
    return `<li class="detail" data-detail="${id}"><ul>${fields}<li><button type="button" class="row-btn" data-action="toggle">${icon("ExpandMore", { class: "flip" })}<span class="row-text"><span class="primary">상세정보 접기</span></span></button></li></ul></li>`
}

export const empty = (noun: string) => `<li class="empty">${icon("SearchOff")}<p>조건에 맞는 ${noun}가 없습니다. 검색 조건을 조정해 주세요.</p></li>`

export const moreRow = (noun: string, limit: number, total: number) =>
    `<li><button type="button" class="row-btn" data-action="more">${icon("ExpandMore")}<span class="row-text"><span class="primary">${noun} ${Math.min(total - limit, PAGE)}개 더보기 (${limit} / ${total})</span></span></button></li>`

export const footer = (updatedAt: string) => `<li class="footer">최종갱신: ${text(updatedAt)}</li>`

/**
 * 최종갱신 시각. 브라우저에서는 그 브라우저의 ko-KR 모양을 쓴다.
 * 빌드에서는 한국 시간으로, 브라우저가 쓰는 "2026. 11. 26. 오전 12:07:51" 모양을 직접 만든다(Node의 ICU 버전에 따라 ko-KR 모양이 다르다).
 */
export const formatUpdatedAt = (ms: number, kst = false) => {
    if (!kst) return new Date(ms).toLocaleString("ko-KR")
    const options: Intl.DateTimeFormatOptions = { timeZone: "Asia/Seoul", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit", hourCycle: "h23" }
    const part = Object.fromEntries(new Intl.DateTimeFormat("en-US", options).formatToParts(ms).map((p) => [p.type, p.value]))
    const hour = Number(part.hour)
    return `${part.year}. ${part.month}. ${part.day}. ${hour < 12 ? "오전" : "오후"} ${hour % 12 || 12}:${part.minute}:${part.second}`
}

/** 한 화면의 처음 모습. 빌드 때 이걸 HTML로 굳혀 두고, 브라우저는 여기서부터 바뀐 부분만 고친다. */
export type PageModel = {
    table: Table
    config: PageConfig
    state: State
    counts: ReadonlyMap<string, Int32Array>
    total: number
    ids: readonly number[]
    limit: number
    open: ReadonlySet<number>
    moreOpen: boolean
    favorites: Readonly<Record<string, true>>
    now: Date
    updatedAt: string
}

export const searchPage = (m: PageModel) => {
    const { table, config, state, counts } = m
    const { schema, noun } = config
    const group = (name: string) => filterGroup(config, name, table.facet(name)?.values ?? [], state.selection.get(name), counts.get(name))
    const panel = `<section class="paper"><ul class="list"><li class="subheader"><span>검색조건</span><button type="button" class="text-btn" data-action="reset">전체 초기화</button></li>`
        + schema.main.map(group).join("")
        + favoritesGroup(noun, state.favorites)
        + moreToggle(m.moreOpen, config.moreHint)
        + (m.moreOpen ? schema.more.map(group).join("") + lessToggle() : "")
        + `<li class="name-search">${textField(`${config.dataset}-name`, "name", "업체명", state.name)}`
        + `${config.keyword ? textField(`${config.dataset}-keyword`, "keyword", config.keyword.label, state.keyword) : ""}</li>`
        + `</ul></section>`
    const sorts = schema.sorts.map((s) => `<option value="${esc(s)}"${s === state.sort ? " selected" : ""}>${text(s)}</option>`).join("")
    const header = `<li class="subheader sticky"><span>전체 ${noun} <strong>${table.n}</strong>개 중 ${badge(conditions(table, config, state))}에 맞는 <strong data-total>${m.total}</strong>개를 `
        + `<span class="sort"><select aria-label="정렬">${sorts}</select>${icon("ArrowDropDown")}</span>으로 정렬합니다.</span>`
        + `<button type="button" class="text-btn" data-action="collapse">모두 접기</button></li>`
    const rows = m.ids.map((id) => {
        const open = m.open.has(id)
        const favorite = m.favorites[config.favoriteKey(table, id)] === true
        return row(table, config, id, open, favorite, m.now) + (open ? (table.detailLoaded ? detail(table, config, id) : detailLoading(id)) : "")
    }).join("")
    const list = `<ul class="list results">${header}${m.total === 0 ? empty(noun) : ""}${rows}`
        + `${m.limit < m.total ? moreRow(noun, m.limit, m.total) : ""}${table.updatedAt > 0 ? footer(m.updatedAt) : ""}</ul>`
    return panel + list
}

/**
 * 공고·업체 하나만 있는 페이지(/openings/<공고번호>/, /companies/<업체코드>/). 목록에서 펼친 모습과 같다.
 * 즐겨찾기와 펼치기는 data-* 값으로 브라우저 스크립트가 붙인다(목록 데이터를 받지 않는다).
 */
export const itemPage = (table: Table, config: PageConfig, id: number, now: Date, updatedAt: string) =>
    `<div data-item="${config.dataset}" data-key="${esc(config.favoriteKey(table, id))}" data-storage="${esc(config.favoritesStorage)}" data-updated="${table.updatedAt}" data-analytics="${esc(JSON.stringify(config.analytics(table, id)))}">`
    + `<ul class="list results">${row(table, config, id, true, false, now)}${detail(table, config, id)}${table.updatedAt > 0 ? footer(updatedAt) : ""}</ul></div>`
