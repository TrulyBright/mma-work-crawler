import { 채용공고 } from "../db/schema.ts"
import type { Table } from "../db/table.ts"
import type { Chip, PageConfig } from "./types.ts"

const 마감일상태 = (마감일: string | undefined, now: Date): Chip | undefined => {
    if (!마감일 || !/^\d{8}$/.test(마감일)) return undefined
    const deadline = Date.UTC(Number(마감일.slice(0, 4)), Number(마감일.slice(4, 6)) - 1, Number(마감일.slice(6, 8)))
    const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    const diffDays = Math.floor((deadline - today) / (1000 * 60 * 60 * 24))
    if (diffDays < 0) return { label: "마감", color: "error" }
    if (diffDays <= 7) return { label: `D-${diffDays}`, color: "warning" }
    return undefined
}

const 공고번호 = (table: Table, id: number) => table.text("공고번호")![id]

export const openings: PageConfig = {
    path: "/openings",
    dataset: "openings",
    schema: 채용공고,
    noun: "공고",
    moreHint: "최종학력, 교대근무, 자격증, ...",
    keepMissing: true,
    favoritesStorage: "즐겨찾기",
    favoriteKey: 공고번호,
    item: (table, id, now) => ({
        primary: table.text("공고제목")![id],
        secondary: `${table.text("업체명")![id]}·${table.field("업종", id)}·${table.field("급여", id) ?? "급여 정보 없음"}`,
        chip: 마감일상태(table.field("마감일", id), now),
    }),
    keyword: { label: "공고제목·담당업무", fields: ["공고제목", "담당업무"] },
    analytics: (table, id) => ({
        item_id: 공고번호(table, id),
        item_name: table.text("공고제목")![id],
        item_brand: table.text("업체명")![id],
        item_category: table.field("업종", id),
        item_category2: table.field("요원", id),
        item_category3: table.field("역종", id),
        item_category4: table.facetValues("주소", id)[0],
        item_variant: table.field("급여", id),
    }),
    fieldLink: (table, id, field) =>
        field === "업체명" && table.flag("업체목록", id) ? `/companies?업체명=${encodeURIComponent(table.text("업체명")![id])}` : undefined,
    link: (table, id) => ({
        row: "공고제목",
        href: `https://work.mma.go.kr/caisBYIS/search/cygonggogeomsaekView.do?cygonggo_no=${공고번호(table, id)}`,
        text: table.text("공고제목")![id],
    }),
    icons: {
        공고제목: "Campaign",
        복리후생: "Restaurant",
        공고등록일: "EditCalendar",
        최종변동일: "EventNote",
        최종학력: "School",
        담당자명: "Badge",
        담당업무: "FormatListBulleted",
        담당자연락처: "Phone",
        대표연락처: "Phone",
        업체명: "Business",
        업종: "Factory",
        근무형태: "Looks5",
        경력구분: "Filter9Plus",
        급여: "AttachMoney",
        홈페이지: "Home",
        접수방법: "Publish",
        마감일: "EventBusy",
        모집인원: "GroupAdd",
        사업자등록번호: "Pin",
        역종: "FormatListNumbered",
        요원: "Engineering",
        현역편입인원: "People",
        출퇴근시간: "Schedule",
        "전직자 채용가능": "MoveDown",
        "특근·잔업": "Bedtime",
        현역배정인원: "People",
        퇴직금지급: "AttachMoney",
        교대근무: "ChangeCircle",
        수습기간: "DateRange",
        주소: "Place",
        자격증: "Handyman",
        "식사(비)지급": "LocalDining",
        보충역편입인원: "People",
        보충역배정인원: "People",
        비고: "Notes",
        경력년수: "Filter9Plus",
        전공: "HistoryEdu",
        외국어: "Translate",
        외국어구사능력: "FormatListNumbered",
        홈페이지주소: "Home",
        즐겨찾기: "Star",
    },
    detailRows: [
        ["공고제목", "공고번호"],
        ["공고등록일", "최종변동일", "마감일"],
        ["업체명", "사업자등록번호", "업종"],
        ["역종", "요원", "모집인원", "전직자 채용가능"],
        ["주소"],
        ["담당업무"],
        ["담당자연락처", "대표연락처"],
        ["최종학력", "전공"],
        ["경력구분", "경력년수"],
        ["자격증"],
        ["외국어", "외국어구사능력"],
        ["출퇴근시간", "교대근무", "특근·잔업"],
        ["급여", "식사(비)지급", "퇴직금지급"],
        ["복리후생"],
        ["현역배정인원", "현역편입인원"],
        ["보충역배정인원", "보충역편입인원"],
        ["비고"],
        ["수습기간"],
        ["접수방법"],
        ["홈페이지주소"],
    ],
}
