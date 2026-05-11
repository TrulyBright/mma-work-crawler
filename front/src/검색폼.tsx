import { FormControl, FormLabel, Grid, FormControlLabel, Checkbox, ListItem, Button, Stack } from "@mui/material"
import postposition from "cox-postposition"
import { Filter } from "./interfaces"
import React from "react"

const 검색폼 = (props: {entry: string, properties: (string | string[])[], filters: Filter[], setFilters: React.Dispatch<React.SetStateAction<Filter[]>>, icon: React.ElementType}) => {
    const { entry, properties, filters, setFilters } = props
    const Icon = props.icon
    const valueKey = (value: string | string[]) => value instanceof Array ? value.join("||") : value
    const valueEquals = (a: boolean | string | string[], b: string | string[]) => {
        if (typeof a === "boolean") return false
        if (a instanceof Array && b instanceof Array) return a.join("||") === b.join("||")
        return a === b
    }
    const entryFilter = filters.find((filter) => filter.entry === entry)
    const isChecked = (property: string | string[]) => Boolean(entryFilter?.values.some((v) => valueEquals(v, property)))
    const setAll = (checked: boolean) => {
        setFilters((prev) => {
            const withoutEntry = prev.filter((filter) => filter.entry !== entry)
            if (!checked) return withoutEntry
            return [...withoutEntry, { entry, values: [...properties] }]
        })
    }
    const onCheck = (entry: string, value: string | string[]) => (event: React.ChangeEvent<HTMLInputElement>) => {
        setFilters((prev) => {
            if (event.target.checked) {
                const existing = prev.find((filter) => filter.entry === entry)
                if (existing) {
                    const alreadyIncluded = existing.values.some((v) => valueEquals(v, value))
                    if (alreadyIncluded) return prev
                    return prev.map((filter) => filter.entry === entry ? {...filter, values: [...filter.values, value]} : filter)
                }
                return [...prev, {entry, values: [value]}]
            }
            return prev.map((filter) =>
                filter.entry === entry
                    ? {...filter, values: filter.values.filter((v) => !valueEquals(v, value))}
                    : filter
            )
        })
    }
    return (
        <ListItem>
            <FormControl component="fieldset" sx={{display: "flex", flexDirection: "row", alignItems: "start", width: 1}}>
                <FormLabel component="legend" sx={{display: "flex", justifyContent: "center", gap: 1}}>
                    <Icon />
                    <strong>{entry}</strong>
                    <small>공고가 없는 {postposition.put(entry, "는")} 나오지 않습니다.</small>
                    <Stack direction="row" spacing={0.5}>
                        <Button size="small" onClick={() => setAll(true)}>전체선택</Button>
                        <Button size="small" onClick={() => setAll(false)}>전체해제</Button>
                    </Stack>
                </FormLabel>
                <Grid container columns={{ xs: 1, sm: 2, md: 3 }} sx={{maxHeight: "30vh", overflow: "auto"}}>
                    {properties.map(property => (
                        <Grid item xs={1} sm={1} md={1} key={valueKey(property)}>
                            <FormControlLabel control={<Checkbox size="small" checked={isChecked(property)} onChange={onCheck(entry, property)}/>} label={property instanceof Array ? property.join(" ") : property} />
                        </Grid>
                    ))}
                </Grid>
            </FormControl>
        </ListItem>
    )
}

export default 검색폼
