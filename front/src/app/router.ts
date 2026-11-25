// 채용공고와 업체목록 사이는 페이지를 새로 받지 않고 오간다.
// 한 번 연 화면은 숨겨 두기만 해서, 다시 돌아오면 검색조건이 그대로 남는다.
import { load } from "../db/load.ts"
import { isPage, pages, type PagePath } from "../pages/index.ts"
import * as R from "../view/render.ts"
import { element } from "./dom.ts"
import { SearchView } from "./search-view.ts"
import { track } from "./track.ts"

type Slot = { el: HTMLElement, view?: SearchView, started: boolean }

/** 예전 주소와 .html 주소를 화면 주소로 */
const canonical = (path: string) => {
    if (path === "/" || path === "/index.html") return "/openings"
    if (path.endsWith(".html") && isPage(path.slice(0, -5))) return path.slice(0, -5)
    return path
}

export const startRouter = () => {
    const main = document.querySelector("main")
    if (!main) return
    const reveal = () => document.documentElement.classList.remove("pending")
    const slots = new Map<PagePath, Slot>()
    for (const el of main.querySelectorAll<HTMLElement>(":scope > [data-page]")) {
        const path = el.dataset.page ?? ""
        if (isPage(path)) slots.set(path, { el, started: false })
    }
    let notFound = main.querySelector<HTMLElement>(":scope > #error-page") ?? undefined

    const fixed = canonical(location.pathname)
    if (fixed !== location.pathname) history.replaceState(null, "", fixed + location.search + location.hash)

    const start = (path: PagePath, slot: Slot) => {
        slot.started = true
        const config = pages[path]
        load(config.dataset)
            .then((table) => {
                const here = location.pathname === path
                slot.view = new SearchView(slot.el, config, table, here ? location.search : "")
                if (here) slot.view.activate(location.search)
            })
            .catch((e: unknown) => {
                const message = e instanceof Error ? e.message : String(e)
                slot.el.innerHTML = R.errorView(message)
                track("exception", { description: `${config.dataset}: ${message}`, fatal: true })
            })
            .finally(reveal)
    }

    const show = () => {
        const path = location.pathname
        for (const [p, slot] of slots) {
            if (p === path) continue
            slot.el.hidden = true
            slot.view?.deactivate()
        }
        for (const a of document.querySelectorAll<HTMLAnchorElement>(".drawer a.nav-item")) {
            if (a.origin === location.origin && a.pathname === path) a.setAttribute("aria-current", "page")
            else a.removeAttribute("aria-current")
        }
        if (!isPage(path)) {
            if (!notFound) main.append((notFound = element(R.errorView("Not Found"))))
            notFound.hidden = false
            reveal()
            return
        }
        if (notFound) notFound.hidden = true
        let slot = slots.get(path)
        if (!slot) {
            slot = { el: element(R.pageSlot(path, R.loading())), started: false }
            main.append(slot.el)
            slots.set(path, slot)
        }
        slot.el.hidden = false
        if (slot.view) {
            slot.view.activate(location.search)
            reveal()
        } else if (!slot.started) start(path, slot)
    }

    // 방문 통계의 페이지뷰는 화면이 바뀔 때만 남긴다. 검색조건 때문에 주소만 바뀌는 것은 세지 않는다.
    // (GA 웹 스트림의 '브라우저 방문 기록 이벤트 기반 페이지 변경'은 꺼 둔다.)
    let counted = location.pathname
    const pageView = () => {
        if (location.pathname === counted) return
        counted = location.pathname
        track("page_view", { page_location: location.href, page_title: document.title })
    }

    const navigate = (url: string) => {
        if (url === location.pathname + location.search) return
        const samePath = new URL(url, location.href).pathname === location.pathname
        history.pushState(null, "", url)
        show()
        pageView()
        if (!samePath) window.scrollTo(0, 0)
    }

    // 새 탭 열기 등은 브라우저에 맡기고, 사이트 안 화면으로 가는 일반 클릭만 가로챈다.
    document.addEventListener("click", (e) => {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
        const a = (e.target as Element).closest("a")
        if (!a || a.target || a.origin !== location.origin || !isPage(a.pathname)) return
        e.preventDefault()
        navigate(a.pathname + a.search)
    })
    addEventListener("popstate", () => {
        show()
        pageView()
    })
    show()
}
