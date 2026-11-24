import { render } from "preact"
import { useEffect, useMemo, useState } from "preact/hooks"
import { companies } from "./pages/companies"
import { openings } from "./pages/openings"
import "./ui/app.css"
import { usePath } from "./ui/router"
import { SearchPage } from "./ui/SearchPage"
import { ErrorView, Shell } from "./ui/Shell"

const pages = { "/openings": openings, "/companies": companies }
type PagePath = keyof typeof pages

const isPage = (path: string): path is PagePath => path in pages

if (location.pathname === "/") history.replaceState(null, "", "/openings")

const App = () => {
    const path = usePath()
    // 한 번 연 화면은 숨겨 두기만 해서, 다시 돌아오면 검색조건이 그대로 남는다.
    const [visited, setVisited] = useState<PagePath[]>([])
    const shown = useMemo(() => (isPage(path) && !visited.includes(path) ? [...visited, path] : visited), [path, visited])
    useEffect(() => {
        if (shown !== visited) setVisited(shown)
    }, [shown, visited])
    return (
        <Shell path={path}>
            {shown.map((p) => (
                <div key={p} hidden={p !== path}>
                    <SearchPage config={pages[p]} active={p === path} />
                </div>
            ))}
            {!isPage(path) && <ErrorView message="Not Found" />}
        </Shell>
    )
}

render(<App />, document.getElementById("root")!)
