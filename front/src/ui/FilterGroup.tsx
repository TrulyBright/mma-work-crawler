import { Icon, type IconName } from "./icons"
import { memo } from "./memo"

/** 받침이 있으면 "은", 없으면 "는" */
const 은는 = (word: string) => {
    const code = word.charCodeAt(word.length - 1) - 0xac00
    return code >= 0 && code <= 11171 && code % 28 !== 0 ? "은" : "는"
}

type Props = {
    name: string
    icon: IconName
    noun: string
    values: string[]
    chosen: ReadonlySet<number> | undefined
    onChange: (name: string, next: ReadonlySet<number>) => void
}

export const FilterGroup = memo(({ name, icon, noun, values, chosen, onChange }: Props) => {
    const toggle = (e: Event) => {
        const input = e.target as HTMLInputElement
        const i = Number(input.dataset.i)
        const next = new Set(chosen)
        if (input.checked) next.add(i)
        else next.delete(i)
        onChange(name, next)
    }
    return (
        <li class="filter">
            <fieldset>
                <legend>
                    <Icon name={icon} />
                    <strong>{name}</strong>
                    <small>{noun}가 없는 {name}{은는(name)} 나오지 않습니다.</small>
                    <span class="actions">
                        <button type="button" class="text-btn" onClick={() => onChange(name, new Set(values.keys()))}>전체선택</button>
                        <button type="button" class="text-btn" onClick={() => onChange(name, new Set())}>전체해제</button>
                    </span>
                </legend>
                <div class="options" onChange={toggle}>
                    {values.map((value, i) => (
                        <label key={value}>
                            <input type="checkbox" data-i={i} checked={chosen?.has(i) ?? false} />
                            <span>{value}</span>
                        </label>
                    ))}
                </div>
            </fieldset>
        </li>
    )
})
