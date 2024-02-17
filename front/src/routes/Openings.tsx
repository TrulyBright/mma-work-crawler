import { FormControlLabel, FormGroup, Grid, Checkbox, Typography, FormControl, FormLabel, Card, CardContent, CardHeader, Stack, CardActions, Box, Button, Collapse, ListItem, Radio, RadioGroup, ListItemText } from "@mui/material"
import 채용공고목록 from "../../data/채용공고목록.json"
import 속성풀 from "../../data/속성풀.json"
import { ExpandMore, Star } from "@mui/icons-material"
import React from "react"
import postposition from "cox-postposition"
import { FixedSizeList, ListChildComponentProps } from "react-window"
import AutoSizer from "react-virtualized-auto-sizer"

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

interface Filter {
    entry: string
    values: (string | string[])[]
}

const gridcheckboxesByEntries = (entries: string[], filters: Filter[], setFilters: React.Dispatch<React.SetStateAction<Filter[]>>) => {
    const onCheck = (entry: string, value: string | string[]) => (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            if (filters.some((filter) => filter.entry === entry)) {
                setFilters(filters.map((filter) => filter.entry === entry ? {...filter, values: [...filter.values, value]} : filter))
            } else {
                setFilters([...filters, {entry, values: [value]}])
            }
        } else {
            setFilters(filters.map((filter) => filter.entry === entry ? {...filter, values: filter.values.filter((v) => v !== value)} : filter))
        }
    }
    return entries.map((entry) => (
        <FormControl key={entry} component="fieldset" sx={{display: "flex", flexDirection: "row", alignItems: "start", width: 1}}>
            <FormLabel component="legend"><strong>{entry}</strong> <small>공고가 없는 {postposition.put(entry, "는")} 나오지 않습니다.</small></FormLabel>
            <Grid container columns={{ xs: 1, sm: 2, md: 3 }} sx={{maxHeight: "30vh", overflow: "auto"}}>
                {속성풀[entry].map((속성) => (
                    <Grid item xs={1} sm={1} md={1} key={속성}>
                        <FormControlLabel key={속성} control={<Checkbox size="small" onChange={onCheck(entry, 속성)}/>} label={속성 instanceof Array ? 속성.join(" ") : 속성} />
                    </Grid>
                ))}
            </Grid>
        </FormControl>
    ))
}

const 단일공고단일필터검사 = (채용공고: Object, filter: Filter) => {
    const 공고값 = 채용공고[filter.entry]
    if (공고값 === undefined) return true
    if (filter.values.length === 0) return true
    if (공고값 instanceof Array) {
        if (filter.values[0] instanceof Array) // 주소인 경우로, 하나라도 포함되면 됨.
            return (filter.values as string[][]).some((v: string[]) => v.every(vv => 공고값.includes(vv)))
        return filter.values.every((v) => 공고값.includes(v)) // 복리후생인 경우로, 다 포함되어야 함.
    }
    return filter.values.includes(공고값)
}

const 단일공고다중필터검사 = (채용공고: Object, filters: Filter[]) => {
    return filters.every((filter) => 단일공고단일필터검사(채용공고, filter))
}

const 복수공고단일필터검사 = (채용공고목록: Object[], filter: Filter) => {
    return 채용공고목록.filter((채용공고) => 단일공고단일필터검사(채용공고, filter))
}

const 복수공고다중필터검사 = (채용공고목록: Object[], filters: Filter[]) => {
    return 채용공고목록.filter((채용공고) => 단일공고다중필터검사(채용공고, filters))
}

const 공고 = (채용공고: Object) => (
    <ListItem key={채용공고.공고번호}>
        <ListItemText primary={채용공고.공고제목} secondary={채용공고.업체명} />
    </ListItem>
)

export default () => {
    const [expanded, setExpanded] = React.useState(false)
    const [filters, setFilters] = React.useState<Filter[]>([])
    const visibleOpenings = React.useMemo(
        () => 복수공고다중필터검사(채용공고목록, filters),
        [filters]
    )
    return (
        <>
        <Card>
            <CardHeader title="검색조건" />
            <CardContent>
                {gridcheckboxesByEntries(주요검색순서, filters, setFilters)}
            </CardContent>
            <CardActions sx={{display: "flex", justifyContent: "center"}}>
                <Button sx={{display: "flex", flexDirection: "column", alignItems: "center"}} onClick={() => setExpanded(!expanded)}>
                    상세검색 펼치기
                    <ExpandMore sx={{transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "all 0.3s linear"}} />
                </Button>
            </CardActions>
            <Collapse in={expanded} timeout="auto" unmountOnExit>
                <CardContent>
                    {gridcheckboxesByEntries(상세검색순서, filters, setFilters)}
                </CardContent>
                <CardActions sx={{display: "flex", justifyContent: "center"}}>
                    <Button sx={{display: "flex", flexDirection: "column", alignItems: "center"}} onClick={() => setExpanded(!expanded)}>
                        상세검색 접기
                        <ExpandMore sx={{transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "all 0.3s linear"}} />
                    </Button>
                </CardActions>
            </Collapse>
        </Card>
        <Typography>전체 공고 {채용공고목록.length}개 중 {visibleOpenings.length}개가 조건에 맞습니다.</Typography>
        <AutoSizer>
            {({ height, width }) => (
                <FixedSizeList height={height} width={width} itemCount={visibleOpenings.length} itemSize={50}>
                    {(props: ListChildComponentProps) => 공고(visibleOpenings[props.index])}
                </FixedSizeList>
            )}
        </AutoSizer>
        </>
    )
}