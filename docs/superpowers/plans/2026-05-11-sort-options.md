# Sort Options Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 마감일 임박순 and 최신등록/수정순 sort options to the job listings page, with 등록순 as the new default, selectable via a dropdown menu on the sort label.

**Architecture:** Single-file change in `front/src/routes/Openings.tsx`. A new `sortOrder` state drives sorting in the existing `visibleOpenings` useMemo. The current hardcoded sort label becomes a MUI Button that opens a Menu with three options.

**Tech Stack:** React 18, TypeScript, MUI v5 (`@mui/material`, `@mui/icons-material`), Vite

---

### Task 1: Update imports and types

**Files:**
- Modify: `front/src/routes/Openings.tsx:1-18`

- [ ] **Step 1: Add `Menu` and `MenuItem` to the MUI import on line 1**

Replace line 1:
```tsx
import { ListItemText, ListItemButton, List, ListSubheader, Paper, Collapse, ListItem, ListItemIcon, TextField, IconButton, Checkbox, FormControl, FormControlLabel, FormLabel, Tooltip, Button, CircularProgress, Badge, Chip, Stack, Typography } from "@mui/material"
```
With:
```tsx
import { ListItemText, ListItemButton, List, ListSubheader, Paper, Collapse, ListItem, ListItemIcon, TextField, IconButton, Checkbox, FormControl, FormControlLabel, FormLabel, Tooltip, Button, CircularProgress, Badge, Chip, Stack, Typography, Menu, MenuItem } from "@mui/material"
```

- [ ] **Step 2: Add `ArrowDropDown` to the icons import on line 5**

Replace line 5:
```tsx
import { AttachMoney, Badge as BadgeIcon, Bedtime, Business, Campaign, ChangeCircle, DateRange, EditCalendar, Engineering, EventBusy, EventNote, ExpandLess, ExpandMore, Factory, Filter9Plus, FormatListBulleted, FormatListNumbered, GroupAdd, Handyman, HistoryEdu, Home, LocalDining, Looks5, MoveDown, Notes, OpenInNew, People, Phone, Pin, Place, Publish, Restaurant, Schedule, School, SearchOff, Star, StarBorder, Translate } from "@mui/icons-material"
```
With:
```tsx
import { ArrowDropDown, AttachMoney, Badge as BadgeIcon, Bedtime, Business, Campaign, ChangeCircle, DateRange, EditCalendar, Engineering, EventBusy, EventNote, ExpandLess, ExpandMore, Factory, Filter9Plus, FormatListBulleted, FormatListNumbered, GroupAdd, Handyman, HistoryEdu, Home, LocalDining, Looks5, MoveDown, Notes, OpenInNew, People, Phone, Pin, Place, Publish, Restaurant, Schedule, School, SearchOff, Star, StarBorder, Translate } from "@mui/icons-material"
```

- [ ] **Step 3: Add `최종변동일` to the `Opening` type (lines 10-18)**

Replace the `Opening` type:
```tsx
type Opening = {
    공고번호: string
    공고제목: string
    업체명: string
    업종: string
    급여?: string
    마감일?: string
    [key: string]: unknown
}
```
With:
```tsx
type SortOrder = "등록순" | "연봉순" | "마감일순"

type Opening = {
    공고번호: string
    공고제목: string
    업체명: string
    업종: string
    급여?: string
    마감일?: string
    최종변동일?: string
    [key: string]: unknown
}
```

- [ ] **Step 4: Verify TypeScript compiles with no errors**

Run from `front/`:
```bash
pnpm exec tsc --noEmit
```
Expected: no output (zero errors)

---

### Task 2: Add sort state and update sort logic

**Files:**
- Modify: `front/src/routes/Openings.tsx` — component state and `visibleOpenings` useMemo

- [ ] **Step 1: Add `sortOrder` and `sortAnchor` state to the component**

Find the block of `React.useState` calls near the top of the `Openings` component function (around line 165–185). Add these two lines alongside the existing state declarations:
```tsx
const [sortOrder, setSortOrder] = React.useState<SortOrder>("등록순")
const [sortAnchor, setSortAnchor] = React.useState<HTMLElement | null>(null)
```

- [ ] **Step 2: Replace the hardcoded sort in `visibleOpenings` useMemo**

Find this block (around lines 198–204):
```tsx
const visibleOpenings = React.useMemo(() => {
    if (!채용공고목록) return []
    return 복수공고다중필터검사(채용공고목록, filters, 즐겨찾기)
        .map((opening) => ({ opening, salaryScore: 급여최대값파싱(opening.급여) }))
        .sort((a, b) => b.salaryScore - a.salaryScore)
        .map(({ opening }) => opening)
}, [채용공고목록, filters, 즐겨찾기])
```

Replace with:
```tsx
const visibleOpenings = React.useMemo(() => {
    if (!채용공고목록) return []
    const filtered = 복수공고다중필터검사(채용공고목록, filters, 즐겨찾기)
    if (sortOrder === "연봉순") {
        return filtered
            .map((opening) => ({ opening, salaryScore: 급여최대값파싱(opening.급여) }))
            .sort((a, b) => b.salaryScore - a.salaryScore)
            .map(({ opening }) => opening)
    }
    if (sortOrder === "마감일순") {
        return [...filtered].sort((a, b) => {
            const da = a.마감일 ?? "99999999"
            const db = b.마감일 ?? "99999999"
            return da < db ? -1 : da > db ? 1 : 0
        })
    }
    // 등록순: 최종변동일 내림차순
    return [...filtered].sort((a, b) => {
        const da = a.최종변동일 ?? "00000000"
        const db = b.최종변동일 ?? "00000000"
        return db < da ? -1 : db > da ? 1 : 0
    })
}, [채용공고목록, filters, 즐겨찾기, sortOrder])
```

Note: `sortOrder` is added to the dependency array.

- [ ] **Step 3: Verify TypeScript compiles with no errors**

Run from `front/`:
```bash
pnpm exec tsc --noEmit
```
Expected: no output

---

### Task 3: Replace the hardcoded sort label with an interactive Button + Menu

**Files:**
- Modify: `front/src/routes/Openings.tsx` — list subheader JSX (around line 313)

- [ ] **Step 1: Replace the static sort label**

Find this line (around line 313):
```tsx
에 맞는 <strong>{visibleOpenings.length}</strong>개를 <strong>연봉순</strong>으로 정렬합니다.
```

Replace with:
```tsx
에 맞는 <strong>{visibleOpenings.length}</strong>개를{" "}
<Button
    size="small"
    onClick={(e) => setSortAnchor(e.currentTarget)}
    endIcon={<ArrowDropDown />}
    sx={{px: 0.5, py: 0, minWidth: 0, fontWeight: "bold"}}
>
    {sortOrder}
</Button>
<Menu anchorEl={sortAnchor} open={Boolean(sortAnchor)} onClose={() => setSortAnchor(null)}>
    {(["등록순", "연봉순", "마감일순"] as SortOrder[]).map((opt) => (
        <MenuItem
            key={opt}
            selected={sortOrder === opt}
            onClick={() => { setSortOrder(opt); setSortAnchor(null) }}
        >
            {opt}
        </MenuItem>
    ))}
</Menu>
으로 정렬합니다.
```

- [ ] **Step 2: Verify TypeScript compiles with no errors**

Run from `front/`:
```bash
pnpm exec tsc --noEmit
```
Expected: no output

- [ ] **Step 3: Verify the build succeeds**

Run from `front/`:
```bash
pnpm run build
```
Expected: `✓ built in ...` with no errors or warnings

- [ ] **Step 4: Manually test in the dev server**

Run from `front/`:
```bash
pnpm run dev
```
Open the app and verify:
1. The default sort label shows "등록순" in the header
2. Clicking it opens a dropdown with 등록순 / 연봉순 / 마감일순
3. Selecting 연봉순 re-sorts listings by highest salary first (no `급여` entries go to bottom)
4. Selecting 마감일순 re-sorts by soonest deadline first (no `마감일` entries go to bottom)
5. Selecting 등록순 re-sorts by `최종변동일` descending

- [ ] **Step 5: Commit**

```bash
git add front/src/routes/Openings.tsx docs/superpowers/specs/2026-05-11-sort-options-design.md docs/superpowers/plans/2026-05-11-sort-options.md
git commit -m "feat(front): add 마감일순 and 등록순 sort options"
```
