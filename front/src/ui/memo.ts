import { Component, type ComponentType, h } from "preact"

/** props가 얕은 비교로 같으면 다시 그리지 않는다. preact/compat 없이 쓰려고 만들었다. */
export const memo = <P extends object>(Inner: ComponentType<P>) =>
    class Memo extends Component<P> {
        shouldComponentUpdate(next: P) {
            const prev = this.props as Record<string, unknown>
            const now = next as Record<string, unknown>
            for (const key in now) if (now[key] !== prev[key]) return true
            for (const key in prev) if (!(key in now)) return true
            return false
        }
        render() {
            return h(Inner, this.props)
        }
    }
