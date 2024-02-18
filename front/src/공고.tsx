import { KeyboardArrowDown } from "@mui/icons-material"
import { ListItemButton, ListItemText } from "@mui/material"
import React from "react"

export default (props: {채용공고: Object}) => {
    const {채용공고} = props
    const [open, setOpen] = React.useState(false)
    return (
        <>
        <ListItemButton  key={채용공고.공고번호} onClick={() => setOpen(!open)}>
            <ListItemText primary={채용공고.공고제목} secondary={채용공고.업체명} />
            <KeyboardArrowDown sx={{transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "all 0.3s linear"}} />
        </ListItemButton>
        {open
            && Object.entries(채용공고).map(([key, value]) => (
            <ListItemButton>
                <ListItemText primary={key} secondary={value} />
            </ListItemButton>
        ))}
        </>
    )
}