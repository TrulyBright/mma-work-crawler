import { FormControlLabel, FormGroup, Grid, Checkbox, Typography, FormControl, FormLabel, Card, CardContent, CardHeader, Stack } from "@mui/material"
import 채용공고목록 from "../../data/채용공고목록.json"
import 속성풀 from "../../data/속성풀.json"

const 풀 = {}

Object.entries(속성풀).forEach(([속성명, 후보]) => {
    if (속성명 === "복리후생") 풀[속성명] = 후보
    else {
        풀[속성명] = {}
        Object.entries(후보).forEach(([코드, 국문명]) => {
            풀[속성명][Number(코드)] = 국문명
        })
    }
})

export default () => {
    return (
        <>
        <Card>
            <CardHeader title="채용공고검색조건" />
            <CardContent>
                <FormControl component="fieldset">
                    <FormLabel component="legend">역종</FormLabel>
                    <FormGroup row>
                        {Object.entries(풀.역종).map(([코드, 역종]) => (
                            <FormControlLabel key={코드} control={<Checkbox size="small" />} label={역종} />
                        ))}
                    </FormGroup>
                </FormControl>
                <FormControl component="fieldset">
                    <FormLabel component="legend">요원</FormLabel>
                    <FormGroup row>
                        {Object.entries(풀.요원).map(([코드, 요원]) => (
                            <FormControlLabel key={코드} control={<Checkbox size="small" />} label={요원} />
                        ))}
                    </FormGroup>
                </FormControl>
                <FormControl component="fieldset">
                    <FormLabel component="legend">업종</FormLabel>
                    <Grid container columns={{xs: 4, sm: 8, md: 12}} sx={{maxHeight: "50vh", overflow: "auto"}}>
                        {Object.entries(풀.업종).map(([코드, 업종]) => (
                            <Grid item xs={2} sm={4} md={4} key={코드}>
                                <FormControlLabel key={코드} control={<Checkbox size="small" />} label={업종} />
                            </Grid>
                        ))}
                    </Grid>
                </FormControl>
                <FormControl component="fieldset">
                    <FormLabel component="legend">전공</FormLabel>
                    <FormGroup row>
                        {Object.entries(풀.전공).map(([코드, 전공]) => (
                            <FormControlLabel key={코드} control={<Checkbox size="small" />} label={전공} />
                        ))}
                    </FormGroup>
                </FormControl>
                <FormControl component="fieldset">
                    <FormLabel component="legend">급여</FormLabel>
                    <Grid container columns={{xs: 4, sm: 8, md: 12}} sx={{maxHeight: "50vh", overflow: "auto"}}>
                        {Object.entries(풀.급여).map(([코드, 급여]) => (
                            <Grid item xs={2} sm={4} md={4} key={코드}>
                                <FormControlLabel key={코드} control={<Checkbox size="small" />} label={급여} />
                            </Grid>
                        ))}
                    </Grid>
                </FormControl>
                <FormControl component="fieldset">
                    <FormLabel component="legend">복리후생</FormLabel>
                    <Grid container columns={{xs: 4, sm: 8, md: 12}} sx={{maxHeight: "50vh", overflow: "auto"}}>
                        {Object.entries(풀.복리후생).map(([코드, 복지]) => (
                            <Grid item xs={2} sm={4} md={4} key={코드}>
                                <FormControlLabel key={코드} control={<Checkbox size="small" />} label={복지} />
                            </Grid>
                        ))}
                    </Grid>
                </FormControl>
            </CardContent>
        </Card>
        <Typography variant="h6" gutterBottom>공고가 {채용공고목록.length}개 있습니다.</Typography>
        <Stack spacing={2}>
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
        </Stack>
        </>
    )
}