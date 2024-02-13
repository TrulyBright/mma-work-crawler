import React from "react"
import { AppBar, Box, CssBaseline, Divider, Drawer, IconButton, Link, List, ListItem, ListItemButton, ListItemIcon, ListItemText, ThemeProvider, Toolbar, createMuiTheme, createTheme, useTheme } from "@mui/material"
import { Business, DarkMode, GitHub, LightMode, ManageSearch, Menu } from '@mui/icons-material'
import { Link as RouterLink } from "react-router-dom"

const drawerWidth = 240
const ColorModeContext = React.createContext({ toggleColorMode: () => {} })

const Root = () => {
    const theme = useTheme()
    const colorMode = React.useContext(ColorModeContext)
    const [mobileOpen, setMobileOpen] = React.useState(false)
    const [isClosing, setIsClosing] = React.useState(false)

    const handleDrawerClose = () => {
        setIsClosing(true)
        setMobileOpen(false)
    }
    const handleDrawerTransitionEnd = () => {
        setIsClosing(false)
    }
    const handleDrawerToggle = () => {
        if (!isClosing) setMobileOpen(!mobileOpen)
    }

    const drawer = (
        <div>
            <Toolbar />
            <Divider />
            <List>
            <ListItem disablePadding component={RouterLink} to="/openings" sx={{color: "inherit"}}>
                    <ListItemButton>
                        <ListItemIcon><ManageSearch /></ListItemIcon>
                        <ListItemText primary="채용공고" />
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding component={RouterLink} to="/companies" sx={{color: "inherit"}}>
                    <ListItemButton>
                        <ListItemIcon><Business /></ListItemIcon>
                        <ListItemText primary="업체목록" />
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding sx={{color: "inherit"}} onClick={colorMode.toggleColorMode}>
                    <ListItemButton>
                        <ListItemIcon>{theme.palette.mode === "dark" ? <LightMode /> : <DarkMode />}</ListItemIcon>
                        <ListItemText primary={theme.palette.mode === "dark" ? "밝은 화면으로" : "어두운 화면으로"} />
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding component="a" href="https://github.com/TrulyBright/mma-work-crawler" sx={{color: "inherit"}}>
                    <ListItemButton>
                        <ListItemIcon><GitHub /></ListItemIcon>
                        <ListItemText primary="GitHub" />
                    </ListItemButton>
                </ListItem>
            </List>
            <Divider />
        </div>
    )

    const layout = (
        <Box sx={{display: "flex"}}>
            <CssBaseline />
            <AppBar position="fixed" sx={{
                zIndex: (theme) => theme.zIndex.drawer + 1,
            }}
            >
                <Toolbar>
                    <IconButton color="inherit" aria-label="사이드바 열기" edge="start" onClick={handleDrawerToggle} sx={{mr: 2, display: {sm: "none"}}}>
                        <Menu />
                    </IconButton>
                    <Link variant="h6" color="inherit" underline="none" href="/" noWrap>병역일터 공고검색/업체검색</Link>
                </Toolbar>
            </AppBar>
            <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }} aria-label="링크 목록">
                <Drawer
                variant="temporary"
                open={mobileOpen}
                onTransitionEnd={handleDrawerTransitionEnd}
                onClose={handleDrawerClose}
                ModalProps={{
                    keepMounted: true, // 모바일용
                }}
                sx={{
                    display: { xs: 'block', sm: 'none' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                }}
                >
                {drawer}
                </Drawer>
                <Drawer
                variant="permanent"
                sx={{
                    display: { xs: 'none', sm: 'block' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                }}
                open
                >
                {drawer}
                </Drawer>
            </Box>
        </Box>
    )
    
    return layout
}

export default () => {
    const [mode, setMode] = React.useState<"light" | "dark">('light')
    const colorMode = React.useMemo(
        () => ({
            toggleColorMode: () => {
                setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'))
            },
        }),
        [],
    )
    const theme = React.useMemo(
        () =>
            createTheme({
                palette: {
                    mode,
                }
            }),
        [mode],
    )
    return (
        <ColorModeContext.Provider value={colorMode}>
            <ThemeProvider theme={theme}>
                <Root />
            </ThemeProvider>
        </ColorModeContext.Provider>
    )
}