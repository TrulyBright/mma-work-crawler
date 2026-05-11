import { ListItemText, ListItemButton, List, ListSubheader, Paper, Collapse, ListItem, ListItemIcon, TextField, IconButton, Checkbox, FormControl, FormControlLabel, FormLabel, Tooltip, Button, CircularProgress, Badge, Chip, Stack, Typography } from "@mui/material"
const 채용공고목록promise = import("../../data/채용공고목록.json")
const 속성풀promise = import("../../data/속성풀.json")
const 최종갱신promise = import("../../data/최종갱신.json")
import { AttachMoney, Badge as BadgeIcon, Bedtime, Business, Campaign, ChangeCircle, DateRange, EditCalendar, Engineering, EventBusy, EventNote, ExpandLess, ExpandMore, Factory, Filter9Plus, FormatListBulleted, FormatListNumbered, GroupAdd, Handyman, HistoryEdu, Home, LocalDining, Looks5, MoveDown, Notes, OpenInNew, People, Phone, Pin, Place, Publish, Restaurant, Schedule, School, SearchOff, Star, StarBorder, Translate } from "@mui/icons-material"
import React from "react"
import { Filter } from "../interfaces"
import 검색폼 from "../검색폼"

type Opening = {
    공고번호: string
    공고제목: string
    업체명: string
    업종: string
    급여?: string
    마감일?: string
    [key: string]: unknown
}

type PropertyPool = Record<string, (string | string[])[]>

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

const 단일공고단일필터검사 = (채용공고: Opening, filter: Filter, 즐겨찾기: {[key: string]: boolean}) => {
    if (filter.values.length === 0) return true
    if (filter.entry === "즐겨찾기")
        return filter.values.includes(즐겨찾기[채용공고.공고번호] || false)
    const 공고값 = 채용공고[filter.entry]
    if (공고값 === undefined) return true
    if (공고값 instanceof Array) {
        if (filter.entry === "주소")
            return (filter.values as string[][]).some((v: string[]) => v.every((vv) => 공고값.includes(vv)))
        return filter.values.every((v) => 공고값.includes(v))
    }
    if (filter.entry === "업체명") {
        const query = String(filter.values[0] ?? "")
        try {
            return new RegExp(query).test(String(공고값))
        } catch {
            return String(공고값).includes(query)
        }
    }
    return filter.values.includes(공고값 as string)
}

const 단일공고다중필터검사 = (채용공고: Opening, filters: Filter[], 즐겨찾기: {[key: string]: boolean}) => {
    return filters.every((filter) => 단일공고단일필터검사(채용공고, filter, 즐겨찾기))
}

const 복수공고다중필터검사 = (채용공고목록: Opening[], filters: Filter[], 즐겨찾기: {[key: string]: boolean}) => {
    return 채용공고목록.filter((채용공고) => 단일공고다중필터검사(채용공고, filters, 즐겨찾기))
}

const 급여최대값파싱 = (급여?: string) => {
    if (!급여) return -1
    const numeric = Array.from(급여.matchAll(/\d[\d,]*/g), (m) => Number(m[0].replaceAll(",", "")))
    if (numeric.length === 0) return -1
    return Math.max(...numeric)
}

const 마감일상태 = (마감일?: string) => {
    if (!마감일 || !/^\d{8}$/.test(마감일)) return null
    const year = Number(마감일.slice(0, 4))
    const month = Number(마감일.slice(4, 6)) - 1
    const day = Number(마감일.slice(6, 8))
    const deadline = new Date(year, month, day)
    deadline.setHours(0, 0, 0, 0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const diffDays = Math.floor((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays < 0) return { label: "마감", color: "error" as const }
    if (diffDays <= 7) return { label: `D-${diffDays}`, color: "warning" as const }
    return null
}

const iconByFilter = {
    공고제목: Campaign,
    복리후생: Restaurant,
    공고등록일: EditCalendar,
    최종변동일: EventNote,
    최종학력: School,
    담당자명: BadgeIcon,
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

const eachLoadingUnit = 50

export default () => {
    const [expanded, setExpanded] = React.useState(false)
    const [filters, setFilters] = React.useState<Filter[]>([])
    const [즐겨찾기, set즐겨찾기] = React.useState({} as {[key: string]: boolean})
    const [expandOpening, setExpandOpening] = React.useState({} as {[key: string]: boolean})
    const [listSize, setListSize] = React.useState(eachLoadingUnit)
    const [채용공고목록, set채용공고목록] = React.useState<Opening[] | null>(null)
    const [속성풀, set속성풀] = React.useState<PropertyPool | null>(null)
    const [최종갱신, set최종갱신] = React.useState<string>("")

    React.useEffect(() => {
        const items = JSON.parse(localStorage.getItem("즐겨찾기") || "{}")
        set즐겨찾기(items)
        Promise.all([채용공고목록promise, 속성풀promise, 최종갱신promise]).then(([목록, 풀, 갱신]) => {
            set채용공고목록(목록.default as Opening[])
            set속성풀(풀.default as PropertyPool)
            set최종갱신(갱신.default as string)
        })
    }, [])

    React.useEffect(() => {
        localStorage.setItem("즐겨찾기", JSON.stringify(즐겨찾기))
    }, [즐겨찾기])

    React.useEffect(() => {
        setListSize(eachLoadingUnit)
    }, [filters])

    const activeFilters = React.useMemo(() => filters.filter((f) => f.values.length !== 0), [filters])
    const visibleOpenings = React.useMemo(() => {
        if (!채용공고목록) return []
        return 복수공고다중필터검사(채용공고목록, filters, 즐겨찾기).sort((a, b) => 급여최대값파싱(b.급여) - 급여최대값파싱(a.급여))
    }, [채용공고목록, filters, 즐겨찾기])

    const 즐찾변경 = (공고번호: string) => {
        set즐겨찾기((prev) => {
            const new즐겨찾기 = {...prev}
            if (new즐겨찾기[공고번호]) delete new즐겨찾기[공고번호]
            else new즐겨찾기[공고번호] = true
            return new즐겨찾기
        })
    }

    if (!채용공고목록 || !속성풀) {
        return (
            <>
                <CircularProgress />
                <p>불러오는 중입니다...</p>
            </>
        )
    }

    return (
        <>
            <Paper>
                <List
                    subheader={
                        <ListSubheader sx={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>
                            <span>검색조건</span>
                            <Button size="small" onClick={() => setFilters([])}>전체 초기화</Button>
                        </ListSubheader>
                    }
                    disablePadding
                >
                    {주요검색순서.map((entry) => (
                        <검색폼 key={entry} entry={entry} properties={속성풀[entry] || []} filters={filters} setFilters={setFilters} icon={iconByFilter[entry as keyof typeof iconByFilter]} />
                    ))}
                    <ListItem>
                        <FormControl component="fieldset" sx={{display: "flex", flexDirection: "row", alignItems: "start", width: 1}}>
                            <FormLabel component="legend" sx={{display: "flex", justifyContent: "center", gap: 1}}><Star /><strong>즐겨찾기</strong></FormLabel>
                            {[true, false].map((v) => (
                                <FormControlLabel
                                    key={String(v)}
                                    control={
                                        <Checkbox
                                            size="small"
                                            onChange={(e) => {
                                                const checked = e.target.checked
                                                setFilters((prev) => {
                                                    const f = prev.find((filter) => filter.entry === "즐겨찾기")
                                                    if (f) {
                                                        if (checked) f.values.push(v)
                                                        else f.values = f.values.filter((existing) => existing !== v)
                                                        return [...prev.filter((filter) => filter.entry !== "즐겨찾기"), f]
                                                    }
                                                    return [...prev, {entry: "즐겨찾기", values: [v]}]
                                                })
                                            }}
                                        />
                                    }
                                    label={v ? "즐겨찾는 공고" : "즐겨찾지 않는 공고"}
                                />
                            ))}
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
                            <검색폼 key={entry} entry={entry} properties={속성풀[entry] || []} filters={filters} setFilters={setFilters} icon={iconByFilter[entry as keyof typeof iconByFilter]} />
                        ))}
                        <ListItemButton onClick={() => setExpanded(!expanded)}>
                            <ExpandLess />
                            <ListItemText primary="상세검색 접기" />
                        </ListItemButton>
                    </Collapse>
                    <ListItem>
                        <TextField
                            label="업체명"
                            fullWidth
                            size="small"
                            onChange={(e) => {
                                const value = e.target.value
                                setFilters((prev) => {
                                    const newFilters = prev.filter((filter) => filter.entry !== "업체명")
                                    if (value === "") return newFilters
                                    newFilters.push({entry: "업체명", values: [value]})
                                    return newFilters
                                })
                            }}
                        />
                    </ListItem>
                </List>
            </Paper>
            <List
                subheader={
                    <ListSubheader sx={{position: "sticky", top: 0, zIndex: 2, bgcolor: "background.paper"}}>
                        전체 공고 <strong>{채용공고목록.length}</strong>개 중{" "}
                        <Tooltip title={activeFilters.map((f) => `${f.entry}: ${f.values.map((v) => f.entry === "주소" ? (v as string[]).join(" ") : v).join(", ")}`).join("\n") || "선택된 조건이 없습니다."}>
                            <Badge color="primary" badgeContent={activeFilters.length}>
                                <Button variant="contained" sx={{py: 0, px: 1, minWidth: 0}}>조건</Button>
                            </Badge>
                        </Tooltip>
                        에 맞는 <strong>{visibleOpenings.length}</strong>개를 <strong>연봉순</strong>으로 정렬합니다.
                        <Button size="small" sx={{ml: 1}} onClick={() => setExpandOpening({})}>모두 접기</Button>
                    </ListSubheader>
                }
                sx={{mt: 1}}
            >
                {visibleOpenings.length === 0 && (
                    <ListItem sx={{display: "block", py: 4}}>
                        <Stack alignItems="center" spacing={1}>
                            <SearchOff color="disabled" />
                            <Typography color="text.secondary">조건에 맞는 공고가 없습니다. 검색 조건을 조정해 주세요.</Typography>
                        </Stack>
                    </ListItem>
                )}
                {visibleOpenings.slice(0, listSize).map((공고) => {
                    const deadline = 마감일상태(공고.마감일)
                    return (
                        <React.Fragment key={공고.공고번호}>
                            <ListItem disablePadding dense>
                                <IconButton aria-label={즐겨찾기[공고.공고번호] ? "즐겨찾기 해제" : "즐겨찾기 추가"} onClick={() => 즐찾변경(공고.공고번호)}>
                                    {즐겨찾기[공고.공고번호] ? <Star fontSize="small"/> : <StarBorder fontSize="small"/>}
                                </IconButton>
                                <ListItemButton onClick={() => setExpandOpening((prev) => ({...prev, [공고.공고번호]: !prev[공고.공고번호]}))}>
                                    <ListItemText primary={공고.공고제목} secondary={`${공고.업체명}·${공고.업종}·${공고.급여 ?? "급여정보없음"}`} />
                                    {deadline && <Chip size="small" label={deadline.label} color={deadline.color} sx={{mr: 1}} />}
                                    <ExpandMore sx={{
                                        transform: expandOpening[공고.공고번호] ? 'rotate(-180deg)' : 'rotate(0)',
                                        transition: '0.2s',
                                    }} />
                                </ListItemButton>
                            </ListItem>
                            <Collapse in={expandOpening[공고.공고번호]} unmountOnExit>
                                <List disablePadding dense sx={{pl: 4}}>
                                    {detailOrder.map((entryList) => {
                                        const availableEntry = entryList.filter((entry) => Object.prototype.hasOwnProperty.call(공고, entry))
                                        if (availableEntry.length === 0) return null
                                        const primary = availableEntry.join(" / ")
                                        const Icon = iconByFilter[availableEntry[0] as keyof typeof iconByFilter]
                                        const availableValue = availableEntry.map((entry) => 공고[entry])
                                        const text = availableValue.map((v) => ["주소", "복리후생"].includes(primary) && v instanceof Array ? v.join(primary === "주소" ? " " : ", ") : String(v)).join(" / ")
                                        const content = availableEntry.includes("공고번호") ? (
                                            <a
                                                href={`https://work.mma.go.kr/caisBYIS/search/cygonggogeomsaekView.do?cygonggo_no=${공고.공고번호}`}
                                                style={{textDecoration: "none", display: "flex", alignItems: "center"}}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                {공고.공고제목}<OpenInNew fontSize="inherit" />
                                            </a>
                                        ) : text
                                        return (
                                            <ListItem disablePadding key={primary}>
                                                {Icon !== undefined && <ListItemIcon><Icon /></ListItemIcon>}
                                                <ListItemText inset={Icon === undefined} primary={primary} secondary={content} secondaryTypographyProps={{whiteSpace: "pre-line"}}/>
                                            </ListItem>
                                        )
                                    })}
                                    <ListItemButton onClick={() => setExpandOpening((prev) => ({...prev, [공고.공고번호]: !prev[공고.공고번호]}))}>
                                        <ExpandLess />
                                        <ListItemText primary="상세정보 접기" />
                                    </ListItemButton>
                                </List>
                            </Collapse>
                        </React.Fragment>
                    )
                })}
                {listSize < visibleOpenings.length && (
                    <ListItemButton onClick={() => setListSize((prev) => prev + eachLoadingUnit)}>
                        <ExpandMore />
                        <ListItemText primary={`공고 ${Math.min(visibleOpenings.length - listSize, eachLoadingUnit)}개 더보기 (${listSize} / ${visibleOpenings.length})`}/>
                    </ListItemButton>
                )}
                <ListItem>
                    <ListItemText secondary={`최종갱신: ${new Date(최종갱신).toLocaleString('ko-KR')}`}/>
                </ListItem>
            </List>
        </>
    )
}
