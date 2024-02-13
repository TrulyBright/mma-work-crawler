import { FormControlLabel, FormGroup, Checkbox, Divider, Box, Typography, FormControl, FormLabel, Grid, Card, CardContent } from "@mui/material"
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
        <Typography variant="h6" gutterBottom>채용공고 검색</Typography>
        <Card>
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
                    <FormGroup row>
                        {Object.entries(풀.급여).map(([코드, 급여]) => (
                            <FormControlLabel key={코드} control={<Checkbox size="small" />} label={급여} />
                        ))}
                    </FormGroup>
                </FormControl>
                <FormControl component="fieldset">
                    <FormLabel component="legend">복리후생</FormLabel>
                    <FormGroup row>
                        {풀.복리후생.map(복지 => (
                            <FormControlLabel key={복지} control={<Checkbox size="small" />} label={복지}/>
                        ))}
                    </FormGroup>
                </FormControl>
            </CardContent>
        </Card>
        </>
    )
}