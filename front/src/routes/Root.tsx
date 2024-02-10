import { AppBar, Box, Button, IconButton, Toolbar, Typography } from "@mui/material"
import MenuIcon from "@mui/icons-material/Menu"

export default () => {
    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static">
                <Toolbar>
                    <IconButton size="large" edge="start" color="inherit" sx={{ mr: 2 }}>
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        병역일터 공고검색/업체검색
                    </Typography>
                    <Button color="inherit" href="/openings">채용공고</Button>
                    <Button color="inherit" href="/companies">업체목록</Button>
                </Toolbar>
            </AppBar>
        </Box>
    )
}