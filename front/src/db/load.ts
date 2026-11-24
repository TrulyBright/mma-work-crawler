import urls from "virtual:mma-data"
import { Container } from "./container"
import type { DatasetName } from "./schema"
import { Table } from "./table"

const canGunzip = typeof DecompressionStream !== "undefined"

const gunzip = async (buffer: ArrayBuffer) => {
    const head = new Uint8Array(buffer, 0, 2)
    // 서버가 이미 풀어서 보냈으면 그대로 쓴다.
    if (head[0] !== 0x1f || head[1] !== 0x8b) return buffer
    return new Response(new Blob([buffer]).stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer()
}

/** 배포 직후 예전 index.html이 지워진 파일을 찾는 경우. 한 번만 새로고침한다. */
const reloadOnce = () => {
    try {
        if (sessionStorage.getItem("mma-reloaded")) return
        sessionStorage.setItem("mma-reloaded", "1")
        location.reload()
    } catch {
        // 저장소를 못 쓰면 새로고침하지 않는다.
    }
}

const fetchBuffer = async (url: string) => {
    const res = await fetch(url)
    if (!res.ok) {
        if (res.status === 404) reloadOnce()
        throw new Error(`데이터를 받지 못했습니다. (${res.status})`)
    }
    return res.arrayBuffer()
}

const download = async (name: DatasetName, part: "core" | "detail") => {
    const files = urls[name]
    if (!canGunzip) return fetchBuffer(part === "core" ? files.coreRaw : files.detailRaw)
    const early = part === "core" ? window.__mma?.[name] : undefined
    if (early) delete window.__mma![name]
    const buffer = early ? await early.catch(() => fetchBuffer(files.core)) : await fetchBuffer(files[part])
    return gunzip(buffer)
}

const idle = (fn: () => void) => ("requestIdleCallback" in window ? requestIdleCallback(fn, { timeout: 1000 }) : setTimeout(fn, 200))

const loadDetail = (name: DatasetName, table: Table, attempt = 1) => {
    download(name, "detail").then(
        (buffer) => table.attach(new Container(buffer)),
        () => {
            if (attempt < 4) setTimeout(() => loadDetail(name, table, attempt + 1), 1000 * attempt)
        },
    )
}

const tables = new Map<DatasetName, Promise<Table>>()

export const load = (name: DatasetName): Promise<Table> => {
    let table = tables.get(name)
    if (!table) {
        table = download(name, "core").then((buffer) => {
            const t = new Table(new Container(buffer))
            idle(() => loadDetail(name, t))
            return t
        })
        table.catch(() => tables.delete(name))
        tables.set(name, table)
    }
    return table
}
