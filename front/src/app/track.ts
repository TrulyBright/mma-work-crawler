// 방문 통계(GA4)에 사용자 행동을 남긴다. 실제로 보내는 것은 운영 주소에서만이다(index.html).
// GA4 추천 이벤트와 기본 매개변수만 써서, 맞춤 측정기준을 등록하지 않아도 보고서에서 바로 볼 수 있다.
//   select_content  검색조건·정렬·즐겨찾기 거르기·화면 모드 고르기 (content_type: 무엇을, content_id: 어떤 값)
//   search          업체명·공고제목·담당업무 입력 (search_term), 입력을 멈추고 1.5초 뒤 한 번
//   view_item       상세정보 펼치기
//   add_to_wishlist 즐겨찾기 추가
//   select_item     병역일터 원문 열기
//   page_view       채용공고 ↔ 업체목록 화면 이동
//   exception       데이터를 받지 못함
import type { Table } from "../db/table.ts"
import type { PageConfig } from "../pages/types.ts"

type Param = string | number | boolean | undefined | Record<string, string | number | undefined>[]

export const track = (event: string, params: Record<string, Param> = {}) => {
    try {
        window.gtag?.("event", event, params)
    } catch {
        // 통계를 보내지 못해도 화면은 그대로 둔다.
    }
}

/** 공고·업체를 GA4 상품(item) 형식으로. 상품 이름·브랜드·카테고리 보고서로 어떤 공고를 많이 보는지 알 수 있다. */
export const items = (table: Table, config: PageConfig, id: number) => [{ item_list_id: config.dataset, ...config.analytics(table, id) }]

/** 입력을 멈춘 뒤에 한 번만 보낸다. 같은 말을 연달아 보내지 않는다. */
export const searchTracker = (field: string) => {
    let timer: ReturnType<typeof setTimeout> | undefined
    let last = ""
    return (value: string) => {
        clearTimeout(timer)
        const term = value.trim()
        if (!term) return
        timer = setTimeout(() => {
            if (term === last) return
            last = term
            track("search", { search_term: term, search_field: field })
        }, 1500)
    }
}
