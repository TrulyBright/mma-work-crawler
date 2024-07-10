import { ListItemText, ListItemButton, List, ListSubheader, Paper, Collapse, ListItem, ListItemIcon, TextField, IconButton, Checkbox, FormControl, FormControlLabel, FormLabel, Tooltip, Button, CircularProgress } from "@mui/material"
import 채용공고목록 from "../../data/채용공고목록.json"
import 속성풀 from "../../data/속성풀.json"
import 최종갱신 from "../../data/최종갱신.json"
import { AttachMoney, Badge, Bedtime, Business, Campaign, ChangeCircle, DateRange, EditCalendar, Engineering, EventBusy, EventNote, ExpandLess, ExpandMore, Factory, Filter9Plus, FormatListBulleted, FormatListNumbered, GroupAdd, Handyman, HistoryEdu, Home, LocalDining, Looks5, MoveDown, Notes, OpenInNew, People, Phone, Pin, Place, Publish, Restaurant, Schedule, School, Star, StarBorder, Translate } from "@mui/icons-material"
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
    "주소",
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

const 단일공고단일필터검사 = (채용공고: Object, filter: Filter, 즐겨찾기: {[key: number]: boolean}) => {
    if (filter.values.length === 0) return true
    if (filter.entry === "즐겨찾기")
        // @ts-expect-error
        return filter.values.includes(즐겨찾기[채용공고.공고번호] || false)
    // @ts-expect-error
    const 공고값 = 채용공고[filter.entry]
    if (공고값 === undefined) return true
    if (공고값 instanceof Array) {
        if (filter.entry === "주소")
            return (filter.values as string[][]).some((v: string[]) => v.every(vv => 공고값.includes(vv)))
        return filter.values.every((v) => 공고값.includes(v)) // 복리후생.
    }
    if (filter.entry === "업체명")
        return new RegExp(filter.values[0] as string).test(공고값)
    return filter.values.includes(공고값)
}

const 단일공고다중필터검사 = (채용공고: Object, filters: Filter[], 즐겨찾기: {[key: number]: boolean}) => {
    return filters.every((filter) => 단일공고단일필터검사(채용공고, filter, 즐겨찾기))
}

const 복수공고다중필터검사 = (채용공고목록: Object[], filters: Filter[], 즐겨찾기: {[key: number]: boolean}) => {
    return 채용공고목록.filter((채용공고) => 단일공고다중필터검사(채용공고, filters, 즐겨찾기))
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
    홈페이지주소: Home,
    즐겨찾기: Star,
} as const

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
    ["복리후생"],
    ["현역배정인원", "현역편입인원"],
    ["보충역배정인원", "보충역편입인원"],
    ["비고"],
    ["수습기간"],
    ["접수방법"],
    ["홈페이지주소"]
] as const

const min = (a: number, b: number) => a < b ? a : b

export default () => {
    const [expanded, setExpanded] = React.useState(false)
    const [filters, setFilters] = React.useState<Filter[]>([])
    const [즐겨찾기, set즐겨찾기] = React.useState({} as {[key: number]: boolean})
    const [expandOpening, setExpandOpening] = React.useState({} as {[key: number]: boolean})
    const [listSize, setListSize] = React.useState(50)
    React.useEffect(() => {
        const items = JSON.parse(localStorage.getItem("즐겨찾기") || "{}")
        set즐겨찾기(items)
    }, [])
    // BUG: Strict모드에서 dev server 사용 시 새로고침할 때마다 즐겨찾기가 초기화되는 문제가 있음.
    React.useEffect(() => {
        localStorage.setItem("즐겨찾기", JSON.stringify(즐겨찾기))
    }, [즐겨찾기])
    const [rendered, setRendered] = React.useState((<>
        <CircularProgress />
        <p>불러오는 중입니다...</p>
    </>))
    React.useEffect(() => {
        openings(
            expanded, setExpanded,
            filters, setFilters,
            즐겨찾기, set즐겨찾기,
            expandOpening, setExpandOpening,
            listSize, setListSize
        ).then(setRendered)
    }, [expanded, filters, 즐겨찾기, expandOpening, listSize])

    return rendered
}

const openings = async (
    expanded: boolean, setExpanded: React.Dispatch<React.SetStateAction<boolean>>,
    filters: Filter[], setFilters: React.Dispatch<React.SetStateAction<Filter[]>>,
    즐겨찾기: {[key: number]: boolean}, set즐겨찾기: React.Dispatch<React.SetStateAction<{[key: number]: boolean}>>,
    expandOpening: {[key: number]: boolean}, setExpandOpening: React.Dispatch<React.SetStateAction<{[key: number]: boolean}>>,
    listSize: number, setListSize: React.Dispatch<React.SetStateAction<number>>,
) => {
    const visibleOpenings = 복수공고다중필터검사(채용공고목록, filters, 즐겨찾기)
    const 즐찾변경 = (공고번호: number) => {
        set즐겨찾기((prev) => {
            const new즐겨찾기 = {...prev}
            if (new즐겨찾기[공고번호]) delete new즐겨찾기[공고번호]
            else new즐겨찾기[공고번호] = true
            return new즐겨찾기
        })
    }
    const resultSummary = () => (
        <ListSubheader>
            전체 공고 <strong>{채용공고목록.length}</strong>개 중 <Tooltip title={filters.filter(f => f.values.length !== 0).map(f => `${f.entry}: ${f.values.map(v => f.entry === "주소" ? (v as string[]).join(' ') : v).join(', ')}`).join('\n') || "선택된 조건이 없습니다."}><Button variant="contained" sx={{py: 0, px: 1, minWidth: 0}}>조건</Button></Tooltip>에 맞는 <strong>{visibleOpenings.length}</strong>개를 <strong>연봉순</strong>으로 정렬합니다.
        </ListSubheader>
    )
    const eachLoadingUnit = 50
    return (
        <>
        <Paper>
        <List subheader={<ListSubheader>검색조건</ListSubheader>} disablePadding>
            {주요검색순서.map((entry) => (
                // @ts-expect-error
                <검색폼 entry={entry} properties={속성풀[entry]} filters={filters} setFilters={setFilters} icon={iconByFilter[entry]} />
            ))}
            <ListItem>
                <FormControl component="fieldset" sx={{display: "flex", flexDirection: "row", alignItems: "start", width: 1}}>
                    <FormLabel component="legend" sx={{display: "flex", justifyContent: "center", gap: 1}}><Star /><strong>즐겨찾기</strong></FormLabel>
                    {[true, false].map(v => (<FormControlLabel control={<Checkbox size="small" onChange={(e) => {
                        const checked = e.target.checked
                        setFilters((prev) => {
                            const f = prev.find(filter => filter.entry === "즐겨찾기")
                            if (f) {
                                if (checked) f.values.push(v)
                                else f.values = f.values.filter(existing => existing !== v)
                                return [...prev.filter(filter => filter.entry !== "즐겨찾기"), f]
                            } else return [...prev, {entry: "즐겨찾기", values: [v]}]
                        })
                    }} />} label={v ? "즐겨찾는 공고" : "즐겨찾지 않는 공고"} />))}
                </FormControl>
            </ListItem>
            <ListItemButton onClick={() => setExpanded(!expanded)}>
                <ExpandMore sx={{
                    transform: expanded ? 'rotate(-180deg)' : 'rotate(0)',
                    transition: '0.2s',
                }} />
                <ListItemText primary="상세검색" secondary={"최종학력, 교대근무, 자격증, ..."} secondaryTypographyProps={{
                    fontSize: 12,
                    lineHeight: '16px',
                }} />
            </ListItemButton>
            <Collapse in={expanded}>
                {상세검색순서.map((entry) => (
                    // @ts-expect-error
                    <검색폼 entry={entry} properties={속성풀[entry]} filters={filters} setFilters={setFilters} icon={iconByFilter[entry]} />
                ))}
                <ListItemButton onClick={() => setExpanded(!expanded)}>
                    <ExpandLess />
                    <ListItemText primary="상세검색 접기" />
                </ListItemButton>
            </Collapse>
            <ListItem>
                <TextField label="업체명" fullWidth size="small" onChange={(e) => {
                    const value = e.target.value
                    setFilters((prev) => {
                        const newFilters = prev.filter(filter => filter.entry !== "업체명")
                        if (value === "") return newFilters
                        newFilters.push({entry: "업체명", values: [value]})
                        return newFilters
                    })
                }}/>
            </ListItem>
        </List>
        </Paper>
        <List subheader={resultSummary()} sx={{mt: 1}}>
            {visibleOpenings.slice(0, listSize).map(공고 => {
                return (
                    <>
                        <ListItem disablePadding dense>
                            {/*@ts-expect-error*/}
                            <IconButton onClick={() => 즐찾변경(공고.공고번호)}>
                                {/*@ts-expect-error*/}
                                {즐겨찾기[공고.공고번호] ? <Star fontSize="small"/> : <StarBorder fontSize="small"/>}
                            </IconButton>
                            <ListItemButton onClick={() =>
                                // @ts-expect-error
                                setExpandOpening((prev) => ({...prev, [공고.공고번호]: !prev[공고.공고번호]}))
                            }>
                                {/*@ts-expect-error*/}
                                <ListItemText primary={공고.공고제목} secondary={공고.업체명 + "·" + 공고.업종}/>
                                <ExpandMore sx={{
                                    // @ts-expect-error
                                    transform: expandOpening[공고.공고번호] ? 'rotate(-180deg)' : 'rotate(0)',
                                    transition: '0.2s',
                                }} />
                            </ListItemButton>
                        </ListItem>
                        {/*@ts-expect-error*/}
                        <Collapse in={expandOpening[공고.공고번호]} unmountOnExit>
                            <List disablePadding dense sx={{pl: 4}}>
                                {detailOrder.map(entryList => {
                                    const availableEntry = entryList.filter(entry => 공고.hasOwnProperty(entry))
                                    if (availableEntry.length === 0) return;
                                    const primary = availableEntry.join(" / ")
                                    // @ts-expect-error
                                    const Icon = iconByFilter[availableEntry[0]]
                                    // @ts-expect-error
                                    const availableValue = availableEntry.map(entry => 공고[entry])
                                    const text = availableValue.map(v => ["주소", "복리후생"].includes(primary) ? v.join(primary === "주소" ? " " : ", ") : v).join(" / ")
                                    const content = availableEntry.includes("공고번호") ? (
                                        <Link
                                            // @ts-expect-error
                                            to={`https://work.mma.go.kr/caisBYIS/search/cygonggogeomsaekView.do?cygonggo_no=${공고.공고번호}`}
                                            style={{textDecoration: "none", display: "flex", alignItems: "center"}}
                                            target="_blank"
                                        >
                                            {/*@ts-expect-error*/}
                                            {공고.공고제목}<OpenInNew fontSize="inherit" />
                                        </Link>
                                    ) : text
                                    return (
                                        <ListItem disablePadding>
                                            {Icon !== undefined && <ListItemIcon><Icon /></ListItemIcon>}
                                            <ListItemText inset={Icon === undefined} primary={primary} secondary={content} secondaryTypographyProps={{whiteSpace: "pre-line"}}/>
                                        </ListItem>
                                    )
                                })}
                                {/*@ts-expect-error*/}
                                <ListItemButton onClick={() => setExpandOpening((prev) => ({...prev, [공고.공고번호]: !prev[공고.공고번호]}))}>
                                    <ExpandLess />
                                    <ListItemText primary="상세정보 접기" />
                                </ListItemButton>
                            </List>
                        </Collapse>
                    </>
                )
            })}
            {listSize < visibleOpenings.length && <ListItemButton onClick={() => setListSize((prev) => prev + eachLoadingUnit)}>
                <ExpandMore />
                <ListItemText primary={`공고 ${min(visibleOpenings.length - listSize, eachLoadingUnit)}개 더보기 (${listSize} / ${visibleOpenings.length})`}/>
            </ListItemButton>}
            <ListItem>
                <ListItemText secondary={`최종갱신: ${new Date(최종갱신).toLocaleString('ko-KR')}`}/>
            </ListItem>
        </List>
        </>
    )
}