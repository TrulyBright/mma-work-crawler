import type { ComponentChildren } from "preact"
import { useState } from "preact/hooks"
import { Icon, type IconName } from "./icons"
import { onLinkClick } from "./router"

const readMode = () => (document.documentElement.dataset.theme === "dark" ? "dark" : "light")

const NavLink = ({ href, icon, label, current, onClick }: { href: string, icon: IconName, label: string, current: boolean, onClick: () => void }) => (
    <li>
        <a
            class="nav-item"
            href={href}
            aria-current={current ? "page" : undefined}
            onClick={(e) => {
                onClick()
                onLinkClick(e)
            }}
        >
            <Icon name={icon} />
            <span>{label}</span>
        </a>
    </li>
)

export const Shell = ({ path, children }: { path: string, children: ComponentChildren }) => {
    const [open, setOpen] = useState(false)
    const [mode, setMode] = useState(readMode)
    const close = () => setOpen(false)
    const toggleMode = () => {
        const next = mode === "dark" ? "light" : "dark"
        document.documentElement.dataset.theme = next
        try {
            localStorage.setItem("colorMode", next)
        } catch {
            // 저장하지 못해도 화면은 바꾼다.
        }
        setMode(next)
    }
    return (
        <>
            <header class="appbar">
                <button type="button" class="icon-btn menu-btn" aria-label="사이드바 열기" onClick={() => setOpen(!open)}>
                    <Icon name="Menu" />
                </button>
                <a class="appbar-title" href="/openings" onClick={onLinkClick}>병역일터 공고검색</a>
            </header>
            <nav class={open ? "drawer open" : "drawer"} aria-label="링크 목록">
                <div class="toolbar-space" />
                <hr />
                <ul>
                    <NavLink href="/openings" icon="ManageSearch" label="채용공고" current={path === "/openings"} onClick={close} />
                    <NavLink href="/companies" icon="Business" label="업체목록" current={path === "/companies"} onClick={close} />
                    <li>
                        <button type="button" class="nav-item" onClick={toggleMode}>
                            <Icon name={mode === "dark" ? "LightMode" : "DarkMode"} />
                            <span>{mode === "dark" ? "밝은 화면으로" : "어두운 화면으로"}</span>
                        </button>
                    </li>
                    <li>
                        <a class="nav-item" href="https://github.com/TrulyBright/mma-work-crawler">
                            <Icon name="GitHub" />
                            <span>GitHub</span>
                        </a>
                    </li>
                </ul>
                <hr />
            </nav>
            {open && <div class="backdrop" onClick={close} />}
            <main>{children}</main>
        </>
    )
}

export const Loading = () => (
    <div class="loading">
        <span class="spinner" />
        <p>불러오는 중입니다...</p>
    </div>
)

export const ErrorView = ({ message }: { message: string }) => (
    <div id="error-page">
        <h1>오류</h1>
        <p>예상치 못한 오류가 발생했습니다.</p>
        <p><i>{message}</i></p>
    </div>
)
