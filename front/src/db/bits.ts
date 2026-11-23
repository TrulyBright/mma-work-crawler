// 레코드 집합을 비트셋(Uint32Array)으로 다룬다. 레코드 i는 i>>>5번째 워드의 i&31번째 비트.

export const wordCount = (n: number) => (n + 31) >>> 5

export const full = (n: number) => {
    const out = new Uint32Array(wordCount(n)).fill(0xffffffff)
    if (n & 31) out[out.length - 1] = (1 << (n & 31)) - 1
    return out
}

export const has = (bits: Uint32Array, i: number) => (bits[i >>> 5] & (1 << (i & 31))) !== 0

export const set = (bits: Uint32Array, i: number) => {
    bits[i >>> 5] |= 1 << (i & 31)
}

export const orInto = (dst: Uint32Array, src: Uint32Array) => {
    for (let i = 0; i < dst.length; i++) dst[i] |= src[i]
}

export const andInto = (dst: Uint32Array, src: Uint32Array) => {
    for (let i = 0; i < dst.length; i++) dst[i] &= src[i]
}

export const andNotInto = (dst: Uint32Array, src: Uint32Array) => {
    for (let i = 0; i < dst.length; i++) dst[i] &= ~src[i]
}

const popcount32 = (x: number) => {
    x -= (x >>> 1) & 0x55555555
    x = (x & 0x33333333) + ((x >>> 2) & 0x33333333)
    return (Math.imul((x + (x >>> 4)) & 0x0f0f0f0f, 0x01010101) >>> 24)
}

export const count = (bits: Uint32Array) => {
    let c = 0
    for (let i = 0; i < bits.length; i++) c += popcount32(bits[i])
    return c
}

/** a & b의 원소 수. 중간 배열을 만들지 않는다. */
export const countAnd = (a: Uint32Array, b: Uint32Array) => {
    let c = 0
    for (let i = 0; i < a.length; i++) c += popcount32(a[i] & b[i])
    return c
}

export const forEach = (bits: Uint32Array, fn: (i: number) => void) => {
    for (let w = 0; w < bits.length; w++) {
        let x = bits[w]
        while (x !== 0) {
            const t = x & -x
            fn((w << 5) + 31 - Math.clz32(t))
            x ^= t
        }
    }
}
