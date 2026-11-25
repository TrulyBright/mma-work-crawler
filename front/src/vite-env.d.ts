/// <reference types="vite/client" />

declare module "virtual:mma-data" {
    type Files = { core: string, detail: string, coreRaw: string, detailRaw: string }
    const urls: Record<import("./db/schema").DatasetName, Files>
    export default urls
}

interface Window {
    __mma?: Partial<Record<import("./db/schema").DatasetName, Promise<ArrayBuffer>>>
    /** index.html의 GA4 태그. 개발 중에는 dataLayer에 쌓이기만 한다. */
    gtag?: (...args: unknown[]) => void
}
