import { useEffect, useState } from "preact/hooks"

const listeners = new Set<() => void>()
const notify = () => {
    for (const fn of listeners) fn()
}

/** replace는 기록을 남기지 않고 주소만 바꾼다(검색조건을 주소에 반영할 때). */
export const navigate = (url: string, { replace = false } = {}) => {
    if (url === location.pathname + location.search) return
    const samePath = new URL(url, location.href).pathname === location.pathname
    if (replace) history.replaceState(null, "", url)
    else history.pushState(null, "", url)
    notify()
    if (!replace && !samePath) window.scrollTo(0, 0)
}

addEventListener("popstate", notify)

export const useLocation = () => {
    const read = () => ({ path: location.pathname, search: location.search })
    const [loc, setLoc] = useState(read)
    useEffect(() => {
        const update = () => setLoc((prev) => {
            const next = read()
            return prev.path === next.path && prev.search === next.search ? prev : next
        })
        listeners.add(update)
        return () => void listeners.delete(update)
    }, [])
    return loc
}

/** 경로가 바뀔 때만 다시 그린다. 쿼리만 바뀌는 경우(검색조건)는 무시한다. */
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
    navigate(a.pathname + a.search)
}
