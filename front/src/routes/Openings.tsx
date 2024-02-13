import { FormControlLabel, FormGroup, Checkbox, Divider, Box, Typography, FormControl, FormLabel } from "@mui/material";

export default () => {
    return (
        <>
        <Typography variant="h6" gutterBottom>채용공고 검색</Typography>
        <FormControl component="fieldset" variant="standard">
            <FormLabel component="legend">역종</FormLabel>
            <FormGroup>
                <FormControlLabel control={<Checkbox />} label="현역"/>
                <FormControlLabel control={<Checkbox />} label="보충역"/>
            </FormGroup>
        </FormControl>
        <FormControl component="fieldset" variant="standard">
            <FormLabel component="legend">고용형태</FormLabel>
            <FormGroup>
                <FormControlLabel control={<Checkbox />} label="산업기능요원"/>
                <FormControlLabel control={<Checkbox />} label="전문연구요원"/>
                <FormControlLabel control={<Checkbox />} label="승선근무예비역"/>
            </FormGroup>
        </FormControl>
        </>
    )
}