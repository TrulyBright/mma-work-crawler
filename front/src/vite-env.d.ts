/// <reference types="vite/client" />

declare module "virtual:mma-data" {
    type Files = { core: string, detail: string, coreRaw: string, detailRaw: string }
    const urls: Record<import("./db/schema").DatasetName, Files>
    export default urls
}

interface Window {
    __mma?: Partial<Record<import("./db/schema").DatasetName, Promise<ArrayBuffer>>>
}
