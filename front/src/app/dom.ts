const template = document.createElement("template")

/** HTML 문자열을 요소 목록으로 */
export const elements = (html: string): HTMLElement[] => {
    template.innerHTML = html
    return Array.from(template.content.children) as HTMLElement[]
}

export const element = (html: string) => elements(html)[0]

/** list의 자식을 want 순서로 맞춘다. 이미 있는 요소는 옮기기만 해서 상태(펼침, 포커스 등)를 지킨다. */
export const reconcile = (list: Element, want: readonly Node[]) => {
    const keep = new Set(want)
    let cursor = list.firstChild
    const skip = () => {
        while (cursor && !keep.has(cursor)) {
            const next: ChildNode | null = cursor.nextSibling
            cursor.remove()
            cursor = next
        }
    }
    for (const node of want) {
        skip()
        if (cursor === node) cursor = cursor.nextSibling
        else list.insertBefore(node, cursor)
    }
    skip()
}
