// 이름 붙은 배열 여러 개를 하나의 바이너리로 묶는 포맷. 빌드(Node)와 브라우저가 함께 쓴다.
//
// [헤더] magic u32 | 레코드 수 u32 | 갱신시각 f64 | 섹션 수 u32
//        섹션마다: 이름 길이 u16 | 종류 u8 | 0 u8 | 오프셋 u32 | 바이트 길이 u32 | 이름(UTF-8)
// [본문] 섹션 데이터. 모두 8바이트 정렬이라 브라우저에서 복사 없이 TypedArray로 본다.
// 문자열 섹션: 개수 u32 + "\0"으로 이은 UTF-8.

export const Kind = { Strings: 0, U8: 1, U16: 2, U32: 3 } as const
export type Kind = typeof Kind[keyof typeof Kind]

const MAGIC = 0x31414d4d // "MMA1"

export type Section =
    | { name: string, kind: typeof Kind.Strings, data: string[] }
    | { name: string, kind: typeof Kind.U8, data: Uint8Array }
    | { name: string, kind: typeof Kind.U16, data: Uint16Array }
    | { name: string, kind: typeof Kind.U32, data: Uint32Array }

const align8 = (n: number) => (n + 7) & ~7

export const writeContainer = (n: number, updatedAt: number, sections: Section[]): Uint8Array => {
    const encoder = new TextEncoder()
    const names = sections.map((s) => encoder.encode(s.name))
    const bodies = sections.map((s) => {
        if (s.kind !== Kind.Strings)
            return new Uint8Array(s.data.buffer, s.data.byteOffset, s.data.byteLength)
        const text = encoder.encode(s.data.join("\0"))
        const body = new Uint8Array(4 + text.length)
        new DataView(body.buffer).setUint32(0, s.data.length, true)
        body.set(text, 4)
        return body
    })
    let offset = align8(20 + names.reduce((sum, name) => sum + 12 + name.length, 0))
    const offsets = bodies.map((body) => {
        const at = offset
        offset = align8(offset + body.length)
        return at
    })
    const out = new Uint8Array(offset)
    const view = new DataView(out.buffer)
    view.setUint32(0, MAGIC, true)
    view.setUint32(4, n, true)
    view.setFloat64(8, updatedAt, true)
    view.setUint32(16, sections.length, true)
    let p = 20
    sections.forEach((s, i) => {
        view.setUint16(p, names[i].length, true)
        view.setUint8(p + 2, s.kind)
        view.setUint32(p + 4, offsets[i], true)
        view.setUint32(p + 8, bodies[i].length, true)
        out.set(names[i], p + 12)
        p += 12 + names[i].length
        out.set(bodies[i], offsets[i])
    })
    return out
}

type Entry = { kind: Kind, offset: number, length: number }

export class Container {
    readonly n: number
    readonly updatedAt: number
    private readonly entries = new Map<string, Entry>()

    constructor(private readonly buffer: ArrayBuffer) {
        const view = new DataView(buffer)
        if (view.getUint32(0, true) !== MAGIC) throw new Error("데이터 형식이 올바르지 않습니다.")
        this.n = view.getUint32(4, true)
        this.updatedAt = view.getFloat64(8, true)
        const count = view.getUint32(16, true)
        const decoder = new TextDecoder()
        let p = 20
        for (let i = 0; i < count; i++) {
            const nameLength = view.getUint16(p, true)
            const name = decoder.decode(new Uint8Array(buffer, p + 12, nameLength))
            this.entries.set(name, {
                kind: view.getUint8(p + 2) as Kind,
                offset: view.getUint32(p + 4, true),
                length: view.getUint32(p + 8, true),
            })
            p += 12 + nameLength
        }
    }

    has(name: string) {
        return this.entries.has(name)
    }

    strings(name: string): string[] | undefined {
        const e = this.entries.get(name)
        if (!e || e.kind !== Kind.Strings) return undefined
        const count = new DataView(this.buffer, e.offset, 4).getUint32(0, true)
        if (count === 0) return []
        return new TextDecoder().decode(new Uint8Array(this.buffer, e.offset + 4, e.length - 4)).split("\0")
    }

    array(name: string): Uint8Array | Uint16Array | Uint32Array | undefined {
        const e = this.entries.get(name)
        if (!e) return undefined
        switch (e.kind) {
            case Kind.U8: return new Uint8Array(this.buffer, e.offset, e.length)
            case Kind.U16: return new Uint16Array(this.buffer, e.offset, e.length >>> 1)
            case Kind.U32: return new Uint32Array(this.buffer, e.offset, e.length >>> 2)
            default: return undefined
        }
    }
}
