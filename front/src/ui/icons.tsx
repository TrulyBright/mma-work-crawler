import { type IconName, iconPaths } from "./icon-paths"

export type { IconName }

export const Icon = ({ name, small, class: className }: { name: IconName, small?: boolean, class?: string }) => {
    const paths: string | readonly string[] = iconPaths[name]
    return (
        <svg class={`icon${small ? " small" : ""}${className ? " " + className : ""}`} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            {typeof paths === "string" ? <path d={paths} /> : paths.map((d) => <path key={d} d={d} />)}
        </svg>
    )
}
