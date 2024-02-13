import { AppBar, Box, Button, IconButton, Link, Toolbar, Typography } from "@mui/material"
import MenuIcon from "@mui/icons-material/Menu"

export default () => {
    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static">
                <Toolbar>
                    <Link color="inherit" variant="h6" sx={{ flexGrow: 1 }} href="/" underline="none">
                        병역일터 공고검색/업체검색
                    </Link>
                    <Button color="inherit" href="/openings">채용공고</Button>
                    <Button color="inherit" href="/companies">업체목록</Button>
                </Toolbar>
            </AppBar>
        </Box>
    )
}