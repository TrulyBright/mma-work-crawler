// 이름 부분일치 검색용 바이그램 역색인.
// 전송하면 이름 자체보다 커서(업체 기준 gzip 68KB 이상, 이름은 43KB) 첫 검색 때 브라우저에서 만든다.
// 이름 끝에 \0을 붙여 모든 글자가 어떤 바이그램의 첫 글자가 되게 했다. 한 글자 검색은 키 범위 하나로 끝난다.
import { set, wordCount } from "./bits"

const normalize = (s: string) => s.replace(/㈜/g, "(주)").replace(/\s+/g, "").toLowerCase()
const REGEX_META = /[\\^$.*+?()[\]{}|]/

export class NameIndex {
    private readonly keys: Uint32Array
    private readonly starts: Uint32Array
    private readonly ids: Uint16Array
    private readonly normalized: string[]
    private readonly W: number

    constructor(private readonly names: string[]) {
        this.W = wordCount(names.length)
        this.normalized = names.map(normalize)
        let total = 0
        for (const s of this.normalized) total += s.length
        // (바이그램 << 16 | 레코드 번호)를 float64 하나에 담아 한 번에 정렬한다. 최대 2^48이라 정확하다.
        const pairs = new Float64Array(total)
        let p = 0
        this.normalized.forEach((s, id) => {
            for (let i = 0; i < s.length; i++) {
                const next = i + 1 < s.length ? s.charCodeAt(i + 1) : 0
                pairs[p++] = (((s.charCodeAt(i) << 16) | next) >>> 0) * 65536 + id
            }
        })
        pairs.sort()
        const keys: number[] = []
        const starts: number[] = []
        const ids = new Uint16Array(p)
        let m = 0
        let previous = -1
        for (let i = 0; i < p; i++) {
            const pair = pairs[i]
            if (pair === previous) continue
            previous = pair
            const key = Math.floor(pair / 65536)
            if (keys[keys.length - 1] !== key) {
                keys.push(key)
                starts.push(m)
            }
            ids[m++] = pair - key * 65536
        }
        starts.push(m)
        this.keys = Uint32Array.from(keys)
        this.starts = Uint32Array.from(starts)
        this.ids = ids.slice(0, m)
    }

    /** keys에서 key 이상인 첫 위치 */
    private lowerBound(key: number) {
        let lo = 0
        let hi = this.keys.length
        while (lo < hi) {
            const mid = (lo + hi) >>> 1
            if (this.keys[mid] < key) lo = mid + 1
            else hi = mid
        }
        return lo
    }

    private postings(key: number) {
        const i = this.lowerBound(key)
        if (this.keys[i] !== key) return this.ids.subarray(0, 0)
        return this.ids.subarray(this.starts[i], this.starts[i + 1])
    }

    search(query: string): Uint32Array {
        const out = new Uint32Array(this.W)
        const q = normalize(query)
        if (q.length === 1) {
            const c = q.charCodeAt(0)
            const from = this.starts[this.lowerBound(c * 65536)]
            const to = this.starts[this.lowerBound((c + 1) * 65536)]
            for (let i = from; i < to; i++) set(out, this.ids[i])
        } else if (q.length > 1) {
            const lists: Uint16Array[] = []
            const seen = new Set<number>()
            for (let i = 0; i + 1 < q.length; i++) {
                const key = ((q.charCodeAt(i) << 16) | q.charCodeAt(i + 1)) >>> 0
                if (seen.has(key)) continue
                seen.add(key)
                lists.push(this.postings(key))
            }
            lists.sort((a, b) => a.length - b.length)
            let candidates: ArrayLike<number> = lists[0]
            for (let k = 1; k < lists.length && candidates.length; k++) candidates = intersect(candidates, lists[k])
            for (let i = 0; i < candidates.length; i++) {
                const id = candidates[i]
                if (this.normalized[id].includes(q)) set(out, id)
            }
        }
        // 정규식으로 검색하던 기능도 남겨 둔다. 메타문자가 있을 때만 이름을 훑는다.
        const re = REGEX_META.test(query) ? toRegExp(query) : undefined
        if (re) this.names.forEach((name, id) => {
            if (re.test(name)) set(out, id)
        })
        return out
    }
}

const toRegExp = (source: string) => {
    try {
        return new RegExp(source)
    } catch {
        return undefined
    }
}

const intersect = (a: ArrayLike<number>, b: ArrayLike<number>) => {
    const out: number[] = []
    let i = 0
    let j = 0
    while (i < a.length && j < b.length) {
        if (a[i] < b[j]) i++
        else if (a[i] > b[j]) j++
        else {
            out.push(a[i])
            i++
            j++
        }
    }
    return out
}
