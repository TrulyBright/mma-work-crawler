import urls from "virtual:mma-data"
import { Container } from "./container.ts"
import type { DatasetName } from "./schema.ts"
import { Table } from "./table.ts"

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

const fetchBuffer = async (url: string, priority: RequestPriority) => {
    const res = await fetch(url, { priority })
    if (!res.ok) {
        if (res.status === 404) reloadOnce()
        throw new Error(`데이터를 받지 못했습니다. (${res.status})`)
    }
    return res.arrayBuffer()
}

const download = async (name: DatasetName, part: "core" | "detail") => {
    const files = urls[name]
    // 상세정보는 목록보다 늦게 받아도 되므로 낮은 우선순위로 받는다.
    const priority = part === "core" ? "high" : "low"
    if (!canGunzip) return fetchBuffer(part === "core" ? files.coreRaw : files.detailRaw, priority)
    // index.html의 부트 스크립트가 먼저 받기 시작한 것이 있으면 그것을 쓴다.
    const key = part === "core" ? name : `${name}:detail`
    const early = window.__mma?.[key]
    if (early) delete window.__mma![key]
    const buffer = early ? await early.catch(() => fetchBuffer(files[part], priority)) : await fetchBuffer(files[part], priority)
    return gunzip(buffer)
}

/** 상세정보. 실패하면 1초, 2초, 3초 뒤에 다시 받는다. */
const loadDetail = (name: DatasetName, table: Table, attempt = 1) => {
    download(name, "detail").then(
        (buffer) => table.attach(new Container(buffer)),
        () => {
            if (attempt < 4) setTimeout(() => loadDetail(name, table, attempt + 1), 1000 * attempt)
        },
    )
}

const tables = new Map<DatasetName, Promise<Table>>()

/**
 * 목록 데이터를 받는다. 상세정보도 곧바로 같이 받기 시작한다(목록을 받은 뒤에 받으면, 링크로 들어와
 * 바로 펼쳐지는 행이 목록 + 상세정보 시간만큼 "불러오는 중"으로 남는다).
 * 같은 데이터셋은 한 번만 받으므로, 링크에 마우스를 올렸을 때 미리 불러 둬도 된다.
 */
export const load = (name: DatasetName): Promise<Table> => {
    let table = tables.get(name)
    if (!table) {
        const detail = download(name, "detail")
        // 목록보다 먼저 실패해도 경고를 남기지 않는다. 실패하면 목록을 받은 뒤 다시 받는다.
        detail.catch(() => {})
        table = download(name, "core").then((buffer) => {
            const t = new Table(new Container(buffer))
            detail.then(
                (d) => t.attach(new Container(d)),
                () => loadDetail(name, t, 2),
            )
            return t
        })
        table.catch(() => tables.delete(name))
        tables.set(name, table)
    }
    return table
}
