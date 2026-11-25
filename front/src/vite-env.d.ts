/// <reference types="vite/client" />

declare module "virtual:mma-data" {
    type Files = { core: string, detail: string, coreRaw: string, detailRaw: string }
    const urls: Record<import("./db/schema").DatasetName, Files>
    export default urls
}

interface Window {
    /** 부트 스크립트가 미리 받기 시작한 데이터. 키는 데이터셋 이름(목록)과 "이름:detail"(상세정보). */
    __mma?: Partial<Record<string, Promise<ArrayBuffer>>>
    /** index.html의 GA4 태그. 개발 중에는 dataLayer에 쌓이기만 한다. */
    gtag?: (...args: unknown[]) => void
}
