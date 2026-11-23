import { useEffect, useState } from "preact/hooks"

const listeners = new Set<() => void>()

export const navigate = (path: string) => {
    if (path === location.pathname) return
    history.pushState(null, "", path)
    for (const fn of listeners) fn()
    window.scrollTo(0, 0)
}

addEventListener("popstate", () => {
    for (const fn of listeners) fn()
})

export const usePath = () => {
    const [path, setPath] = useState(location.pathname)
    useEffect(() => {
        const update = () => setPath(location.pathname)
        listeners.add(update)
        return () => void listeners.delete(update)
    }, [])
    return path
}

/** 새 탭 열기 등은 브라우저에 맡기고, 일반 클릭만 가로챈다. */
export const onLinkClick = (e: MouseEvent) => {
    const a = e.currentTarget as HTMLAnchorElement
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target) return
    e.preventDefault()
    navigate(a.pathname)
}
