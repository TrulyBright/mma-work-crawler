// 사이드바와 화면 모드. 화면 모드는 index.html의 첫 스크립트가 그리기 전에 맞춰 둔다.
import { track } from "./track.ts"

export const startShell = () => {
    const drawer = document.querySelector<HTMLElement>(".drawer")
    const backdrop = document.querySelector<HTMLElement>(".backdrop")
    if (!drawer || !backdrop) return
    const setOpen = (open: boolean) => {
        drawer.classList.toggle("open", open)
        backdrop.hidden = !open
    }
    document.querySelector('[data-action="menu"]')?.addEventListener("click", () => setOpen(!drawer.classList.contains("open")))
    backdrop.addEventListener("click", () => setOpen(false))
    drawer.addEventListener("click", (e) => {
        if ((e.target as Element).closest('a.nav-item[href^="/"]')) setOpen(false)
    })
    document.querySelector('[data-action="theme"]')?.addEventListener("click", () => {
        const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark"
        document.documentElement.dataset.theme = next
        track("select_content", { content_type: "화면 모드", content_id: next })
        try {
            localStorage.setItem("colorMode", next)
        } catch {
            // 저장하지 못해도 화면은 바꾼다.
        }
    })
}
