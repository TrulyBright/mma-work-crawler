// 공고·업체 하나만 있는 페이지. 목록 데이터는 받지 않고, 미리 그린 HTML에 즐겨찾기와 펼치기만 붙인다.
// 즐겨찾기는 목록 화면과 같은 저장소를 써서 양쪽에서 똑같이 보인다.
import { icon } from "../view/icons.ts"
import * as R from "../view/render.ts"
import { element } from "./dom.ts"
import { track } from "./track.ts"

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

export const startItem = (el: HTMLElement) => {
    const { item: dataset = "", key = "", storage = "" } = el.dataset
    let analytics: Record<string, string> = {}
    try {
        analytics = JSON.parse(el.dataset.analytics ?? "{}")
    } catch {
        // 통계 정보가 없어도 화면은 그대로 둔다.
    }
    const items = [{ item_list_id: dataset, ...analytics }]
    const star = el.querySelector<HTMLElement>('li.item [data-action="favorite"]')
    const toggle = el.querySelector<HTMLElement>('li.item [data-action="toggle"]')
    const detail = el.querySelector<HTMLElement>("li.detail")

    const paintStar = (on: boolean) => {
        if (!star) return
        star.setAttribute("aria-label", on ? "즐겨찾기 해제" : "즐겨찾기 추가")
        star.innerHTML = icon(on ? "Star" : "StarBorder", { small: true })
    }
    if (readFavorites(storage)[key]) paintStar(true)
    // 최종갱신은 목록 화면처럼 이 브라우저의 시각 표기로 맞춘다.
    const footer = el.querySelector(".footer")
    const updated = Number(el.dataset.updated)
    if (footer && updated > 0) footer.textContent = element(R.footer(R.formatUpdatedAt(updated))).textContent

    el.addEventListener("click", (e) => {
        const target = e.target as Element
        if (target.closest('.detail a[target="_blank"]')) track("select_item", { item_list_id: dataset, items })
        const button = target.closest<HTMLElement>("button[data-action]")
        if (!button) return
        if (button.dataset.action === "favorite") {
            const favorites = { ...readFavorites(storage) }
            const adding = !favorites[key]
            if (adding) favorites[key] = true
            else delete favorites[key]
            writeFavorites(storage, favorites)
            paintStar(adding)
            track(adding ? "add_to_wishlist" : "remove_from_wishlist", { item_list_id: dataset, items })
        } else if (button.dataset.action === "toggle" && detail && toggle) {
            const open = detail.hidden !== false
            detail.hidden = !open
            toggle.setAttribute("aria-expanded", String(open))
            toggle.lastElementChild?.classList.toggle("flip", open)
        }
    })
    track("view_item", { item_list_id: dataset, items })
}
