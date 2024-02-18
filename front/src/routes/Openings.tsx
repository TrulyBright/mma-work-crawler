import { ListItemText, ListItemButton, List, ListSubheader, Paper, Collapse, ListItem, Typography, ListItemIcon, Icon } from "@mui/material"
import 채용공고목록 from "../../data/채용공고목록.json"
import 속성풀 from "../../data/속성풀.json"
import { AttachMoney, Badge, Bedtime, Business, Campaign, ChangeCircle, DateRange, EditCalendar, Engineering, EventBusy, EventNote, ExpandLess, ExpandMore, Factory, Filter9Plus, FormatListBulleted, FormatListNumbered, GroupAdd, Handyman, HistoryEdu, Home, LocalDining, Looks5, MoveDown, Notes, OpenInNew, People, Phone, Pin, Place, Publish, Restaurant, Schedule, School, Science, Translate, WorkHistory } from "@mui/icons-material"
import React from "react"
import { Filter } from "../interfaces"
import 검색폼 from "../검색폼"
import { Link } from "react-router-dom"

const 주요검색순서 = [
    "역종",
    "요원",
    "업종",
    "급여",
    "전직자 채용가능",
    "주소"
]

const 상세검색순서 = [
    "최종학력",
    "전공",
    "경력구분",
    "경력년수",
    "외국어",
    "외국어구사능력",
    "자격증",
    "수습기간",
    "근무형태",
    "출퇴근시간",
    "교대근무",
    "특근·잔업",
    "복리후생",
    "식사(비)지급",
    "퇴직금지급",
]

const 단일공고단일필터검사 = (채용공고: Object, filter: Filter) => {
    const 공고값 = 채용공고[filter.entry]
    if (공고값 === undefined) return true
    if (filter.values.length === 0) return true
    if (공고값 instanceof Array) {
        if (filter.entry === "주소")
            return (filter.values as string[][]).some((v: string[]) => v.every(vv => 공고값.includes(vv)))
        return filter.values.every((v) => 공고값.includes(v)) // 복리후생.
    }
    return filter.values.includes(공고값)
}

const 단일공고다중필터검사 = (채용공고: Object, filters: Filter[]) => {
    return filters.every((filter) => 단일공고단일필터검사(채용공고, filter))
}

const 복수공고다중필터검사 = (채용공고목록: Object[], filters: Filter[]) => {
    return 채용공고목록.filter((채용공고) => 단일공고다중필터검사(채용공고, filters))
}

const iconByFilter = {
    공고제목: Campaign,
    복리후생: Restaurant,
    공고등록일: EditCalendar,
    최종변동일: EventNote,
    최종학력: School,
    담당자명: Badge,
    담당업무: FormatListBulleted,
    담당자연락처: Phone,
    대표연락처: Phone,
    업체명: Business,
    업종: Factory,
    근무형태: Looks5,
    경력구분: Filter9Plus,
    급여: AttachMoney,
    홈페이지: Home,
    접수방법: Publish,
    마감일: EventBusy,
    모집인원: GroupAdd,
    사업자등록번호: Pin,
    역종: FormatListNumbered,
    요원: Engineering,
    현역편입인원: People,
    출퇴근시간: Schedule,
    "전직자 채용가능": MoveDown,
    특근·잔업: Bedtime,
    현역배정인원: People,
    퇴직금지급: AttachMoney,
    교대근무: ChangeCircle,
    수습기간: DateRange,
    주소: Place,
    자격증: Handyman,
    "식사(비)지급": LocalDining,
    보충역편입인원: People,
    보충역배정인원: People,
    비고: Notes,
    경력년수: Filter9Plus,
    전공: HistoryEdu,
    외국어: Translate,
    외국어구사능력: FormatListNumbered,
    홈페이지주소: Home
}

const detailOrder = [
    ["공고제목", "공고번호"],
    ["공고등록일", "최종변동일", "마감일"],
    ["업체명", "사업자등록번호", "업종"],
    ["역종", "요원", "모집인원", "전직자채용가능"],
    ["주소"],
    ["담당업무"],
    ["담당자연락처", "대표연락처"],
    ["최종학력", "전공"],
    ["경력구분", "경력년수"],
    ["자격증"],
    ["외국어", "외국어구사능력"],
    ["출퇴근시간", "교대근무", "특근·잔업"],
    ["급여", "식사(비)지급", "퇴직금지급"],
    ["현역배정인원", "현역편입인원"],
    ["보충역배정인원", "보충역편입인원"],
    ["비고"],
    ["수습기간"],
    ["접수방법"],
    ["홈페이지주소"]
]

export default () => {
    const [expanded, setExpanded] = React.useState(false)
    const [filters, setFilters] = React.useState<Filter[]>([])
    const visibleOpenings = React.useMemo(
        () => 복수공고다중필터검사(채용공고목록, filters),
        [filters]
    )
    const resultSummary = () => (
        <ListSubheader>
            전체 공고 <strong>{채용공고목록.length}</strong>개 중 <strong>{visibleOpenings.length}</strong>개가 조건에 맞습니다.
        </ListSubheader>
    )
    return (
        <>
        <Paper>
        <List subheader={<ListSubheader>검색조건</ListSubheader>}>
            {주요검색순서.map((entry) => (
                <검색폼 entry={entry} properties={속성풀[entry]} filters={filters} setFilters={setFilters} icon={iconByFilter[entry]} />
            ))}
            <ListItemButton onClick={() => setExpanded(!expanded)}>
                <ExpandMore sx={{
                    transform: expanded ? 'rotate(-180deg)' : 'rotate(0)',
                    transition: '0.2s',
                }} />
                <ListItemText primary="상세검색" secondary={상세검색순서.join(", ")} secondaryTypographyProps={{
                    noWrap: true,
                    fontSize: 12,
                    lineHeight: '16px',
                }} />
            </ListItemButton>
            <Collapse in={expanded}>
                {상세검색순서.map((entry) => (
                    <검색폼 entry={entry} properties={속성풀[entry]} filters={filters} setFilters={setFilters} icon={iconByFilter[entry]} />
                ))}
                <ListItemButton onClick={() => setExpanded(!expanded)}>
                    <ExpandLess />
                    <ListItemText primary="상세검색 접기" />
                </ListItemButton>
            </Collapse>
        </List>
        </Paper>
        <List subheader={resultSummary()} sx={{mt: 1}}>
            {visibleOpenings.slice(0, 20).map(공고 => {
                const [open, setOpen] = React.useState(false)
                return (
                    <>
                        <ListItemButton onClick={() => setOpen(!open)}>
                            <ListItemText primary={공고.공고제목} secondary={공고.업체명 + "·" + 공고.업종}/>
                            <ExpandMore sx={{
                                transform: open ? 'rotate(-180deg)' : 'rotate(0)',
                                transition: '0.2s',
                            }} />
                        </ListItemButton>
                        <Collapse in={open} unmountOnExit>
                            <List disablePadding dense sx={{pl: 4}}>
                                {detailOrder.map(entryList => {
                                    const availableEntry = entryList.filter(entry => 공고.hasOwnProperty(entry))
                                    if (availableEntry.length === 0) return;
                                    const IconForThisEntry = iconByFilter[availableEntry[0]]
                                    const availableValue = availableEntry.map(entry => 공고[entry])
                                    const text = availableValue.join(" / ")
                                    const content = availableEntry.includes("공고번호") ? (
                                        <Link
                                            to={`https://work.mma.go.kr/caisBYIS/search/cygonggogeomsaekView.do?cygonggo_no=${공고.공고번호}`}
                                            style={{textDecoration: "none", display: "flex", alignItems: "center"}}
                                            target="_blank"
                                        >
                                            {공고.공고제목}<OpenInNew fontSize="inherit" />
                                        </Link>
                                    ) : text
                                    return (
                                        <ListItem>
                                            <ListItemIcon>{IconForThisEntry === undefined ? <Icon /> : <IconForThisEntry />}</ListItemIcon>
                                            <ListItemText primary={availableEntry.join(" / ")} secondary={content} secondaryTypographyProps={{whiteSpace: "pre-line"}}/>
                                        </ListItem>
                                    )
                                })}
                                <ListItemButton onClick={() => setOpen(!open)}>
                                    <ExpandLess />
                                    <ListItemText primary="상세정보 접기" />
                                </ListItemButton>
                            </List>
                        </Collapse>
                    </>
                )
            })}
        </List>
        </>
    )
}