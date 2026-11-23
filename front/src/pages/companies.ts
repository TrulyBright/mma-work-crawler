import { 병역지정업체 } from "../db/schema"
import type { Table } from "../db/table"
import type { PageConfig } from "../ui/SearchPage"

const 업체코드 = (table: Table, id: number) => table.num("업체코드")![id]

const 인원 = new Set(병역지정업체.detailNum)

export const companies: PageConfig = {
    dataset: "companies",
    schema: 병역지정업체,
    noun: "업체",
    moreHint: 병역지정업체.more.join(", "),
    keepMissing: false,
    favoritesStorage: "즐겨찾는업체",
    favoriteKey: (table, id) => String(업체코드(table, id) || `${table.text("업체명")![id]}|${table.field("요원", id)}`),
    item: (table, id) => ({
        primary: table.text("업체명")![id],
        secondary: [table.field("요원", id), table.field("업종", id), table.facetValues("주소", id)[0]].filter(Boolean).join("·"),
        chip: table.field("채용유무", id) ? { label: table.field("채용유무", id)!, color: "success" } : undefined,
    }),
    link: (table, id) => {
        const code = 업체코드(table, id)
        if (!code) return undefined
        return {
            row: "업체명",
            href: `https://work.mma.go.kr/caisBYIS/search/byjjecgeomsaekView.do?byjjeopche_cd=${code}`,
            text: table.text("업체명")![id],
        }
    },
    format: (name, value) => (인원.has(name) ? `${value}명` : value),
    icons: {
        업체명: "Business",
        요원: "Engineering",
        업종: "Factory",
        기업규모: "Apartment",
        주소: "Place",
        채용유무: "Campaign",
        지방청: "AccountBalance",
        선정년도: "CalendarMonth",
        연구분야: "Science",
        주생산품목: "Inventory2",
        전화번호: "Phone",
        팩스번호: "Fax",
        현역배정인원: "People",
        보충역배정인원: "People",
    },
    detailRows: [
        ["업체명"],
        ["요원", "업종", "기업규모"],
        ["선정년도", "지방청", "채용유무"],
        ["주소"],
        ["전화번호", "팩스번호"],
        ["주생산품목"],
        ["연구분야"],
        ["현역배정인원", "현역편입인원", "현역복무인원"],
        ["보충역배정인원", "보충역편입인원", "보충역복무인원"],
    ],
}
