import { FormControl, FormLabel, Grid, FormControlLabel, Checkbox, ListItem } from "@mui/material"
import postposition from "cox-postposition"
import { Filter } from "./interfaces"
import React from "react"

export default (props: {entry: string, properties: (string | string[])[], filters: Filter[], setFilters: React.Dispatch<React.SetStateAction<Filter[]>>, icon: any}) => {
    const { entry, properties, filters, setFilters } = props
    const Icon = props.icon
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
    return (
        <ListItem>
            <FormControl component="fieldset" sx={{display: "flex", flexDirection: "row", alignItems: "start", width: 1}}>
                <FormLabel component="legend" sx={{display: "flex", justifyContent: "center", gap: 1}}><Icon /><strong>{entry}</strong> <small>공고가 없는 {postposition.put(entry, "는")} 나오지 않습니다.</small></FormLabel>
                <Grid container columns={{ xs: 1, sm: 2, md: 3 }} sx={{maxHeight: "30vh", overflow: "auto"}}>
                    {properties.map(property => (
                        <Grid item xs={1} sm={1} md={1}>
                            <FormControlLabel control={<Checkbox size="small" onChange={onCheck(entry, property)}/>} label={property instanceof Array ? property.join(" ") : property} />
                        </Grid>
                    ))}
                </Grid>
            </FormControl>
        </ListItem>
    )
}