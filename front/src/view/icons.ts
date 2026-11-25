import { type IconName, iconPaths } from "./icon-paths.ts"

export type { IconName }

export const icon = (name: IconName, { small = false, class: extra }: { small?: boolean, class?: string } = {}) => {
    const paths: string | readonly string[] = iconPaths[name]
    const d = typeof paths === "string" ? [paths] : paths
    return `<svg class="icon${small ? " small" : ""}${extra ? " " + extra : ""}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${d.map((p) => `<path d="${p}"></path>`).join("")}</svg>`
}
