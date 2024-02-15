import { FormControlLabel, FormGroup, Grid, Checkbox, Typography, FormControl, FormLabel, Card, CardContent, CardHeader, Stack, CardActions, Box, Button, Collapse } from "@mui/material"
import 채용공고목록 from "../../data/채용공고목록.json"
import 속성풀 from "../../data/속성풀.json"
import { ExpandMore } from "@mui/icons-material"
import React from "react"

const 주요검색순서 = [
    "역종",
    "요원",
    "업종",
    "급여",
    "전직자 채용가능"
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

const gridcheckboxesByEntries = (entries: string[]) => {
    return entries.map((entry) => (
        <FormControl key={entry} component="fieldset" sx={{display: "flex", flexDirection: "row", alignItems: "start", width: 1}}>
            <FormLabel component="legend"><strong>{entry}</strong></FormLabel>
            <Grid container columns={{ xs: 1, sm: 2, md: 3 }} sx={{maxHeight: "50vh", overflow: "auto"}}>
                {속성풀[entry].map((속성) => (
                    <Grid item xs={1} sm={1} md={1} key={속성}>
                        <FormControlLabel key={속성} control={<Checkbox size="small" />} label={속성} />
                    </Grid>
                ))}
            </Grid>
        </FormControl>
    ))
}

export default () => {
    const [expanded, setExpanded] = React.useState(false)
    return (
        <>
        <Card>
            <CardHeader title="검색조건" />
            <CardContent>
                {gridcheckboxesByEntries(주요검색순서)}
            </CardContent>
            <CardActions sx={{display: "flex", justifyContent: "center"}}>
                <Button sx={{display: "flex", flexDirection: "column", alignItems: "center"}} onClick={() => setExpanded(!expanded)}>
                    상세검색 펼치기
                    <ExpandMore sx={{transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "all 0.3s linear"}} />
                </Button>
            </CardActions>
            <Collapse in={expanded} timeout="auto" unmountOnExit>
                <CardContent>
                    {gridcheckboxesByEntries(상세검색순서)}
                </CardContent>
                <CardActions sx={{display: "flex", justifyContent: "center"}}>
                    <Button sx={{display: "flex", flexDirection: "column", alignItems: "center"}} onClick={() => setExpanded(!expanded)}>
                        상세검색 접기
                        <ExpandMore sx={{transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "all 0.3s linear"}} />
                    </Button>
                </CardActions>
            </Collapse>
        </Card>
        <Typography variant="h6" gutterBottom>공고가 {채용공고목록.length}개 있습니다.</Typography>
        {/* <Stack spacing={2}>
            {채용공고목록.map((채용공고, i) => (
                <Card key={i}>
                    <CardHeader title={채용공고.공고제목} subheader={채용공고.업종} />
                    <CardContent>
                        <Typography variant="body2" gutterBottom>업체명: {채용공고.업체명}</Typography>
                        <Typography variant="body2" gutterBottom>근무지: {채용공고.근무지시도}</Typography>
                        <Typography variant="body2" gutterBottom>급여: {채용공고.급여}</Typography>
                        <Typography variant="body2" gutterBottom>복리후생: {채용공고.복리후생}</Typography>
                    </CardContent>
                </Card>
            ))}
        </Stack> */}
        </>
    )
}