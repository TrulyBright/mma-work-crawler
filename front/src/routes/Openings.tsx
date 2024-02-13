import { FormControlLabel, FormGroup, Checkbox, Divider, Box, Typography, FormControl, FormLabel } from "@mui/material"
import 속성풀 from "../../data/속성풀.json"

export default () => {
    const 순서 = ["역종", "요원", "업종", "급여"]
    return (
        <>
        <Typography variant="h6" gutterBottom>채용공고 검색</Typography>
        {순서.map((속성) => (
            <FormControl component="fieldset" key={속성}>
                <FormLabel component="legend">{속성}</FormLabel>
                <FormGroup>
                    {Object.entries(속성풀[속성]).map(([코드, 국문명]) => {
                        return (
                            <FormControlLabel key={코드} control={<Checkbox />} label={국문명 as String} />
                        )
                    })}
                </FormGroup>
                <Divider />
            </FormControl>
        ))}
        </>
    )
}