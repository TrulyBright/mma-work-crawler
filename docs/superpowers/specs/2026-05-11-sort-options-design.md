# Sort Options Design

**Date:** 2026-05-11  
**Status:** Approved

## Summary

Add two new sort options (마감일 임박순, 최신등록/수정순) to the job listings page, and change the default sort from 연봉순 to 등록순. The sort is selected via a dropdown menu that opens when the user clicks the current sort label in the list header.

## Sort Options

| Label | Field | Direction | Tie-breaking |
|-------|-------|-----------|--------------|
| 등록순 (default) | `최종변동일` (YYYYMMDD string) | Descending — most recently modified first | None needed; field is always present |
| 연봉순 | `급여최대값파싱(opening.급여)` | Descending — highest salary first | Already implemented; -1 for missing |
| 마감일순 | `마감일` (YYYYMMDD string) | Ascending — soonest deadline first | Entries with no `마감일` sorted to the end |

## State

```ts
type SortOrder = "등록순" | "연봉순" | "마감일순"
const [sortOrder, setSortOrder] = React.useState<SortOrder>("등록순")
```

## Data Model Change

Add `최종변동일` to the `Opening` type:

```ts
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

## Sorting Logic

Replace the hardcoded `.sort()` in `visibleOpenings` useMemo:

```ts
const sortFn = (a: Opening, b: Opening): number => {
    if (sortOrder === "연봉순") {
        return 급여최대값파싱(b.급여) - 급여최대값파싱(a.급여)
    }
    if (sortOrder === "마감일순") {
        const da = a.마감일 ?? "99999999"
        const db = b.마감일 ?? "99999999"
        return da < db ? -1 : da > db ? 1 : 0
    }
    // 등록순: 최종변동일 descending
    const da = a.최종변동일 ?? "00000000"
    const db = b.최종변동일 ?? "00000000"
    return db < da ? -1 : db > da ? 1 : 0
}
```

## UI

### Header change

Replace:
```tsx
에 맞는 <strong>{visibleOpenings.length}</strong>개를 <strong>연봉순</strong>으로 정렬합니다.
```

With:
```tsx
에 맞는 <strong>{visibleOpenings.length}</strong>개를{" "}
<Button size="small" onClick={(e) => setSortAnchor(e.currentTarget)} endIcon={<ArrowDropDown />}>
    {sortOrder}
</Button>
으로 정렬합니다.
<Menu anchorEl={sortAnchor} open={Boolean(sortAnchor)} onClose={() => setSortAnchor(null)}>
    {(["등록순", "연봉순", "마감일순"] as SortOrder[]).map((opt) => (
        <MenuItem key={opt} selected={sortOrder === opt} onClick={() => { setSortOrder(opt); setSortAnchor(null) }}>
            {opt}
        </MenuItem>
    ))}
</Menu>
```

### New state for menu anchor

```ts
const [sortAnchor, setSortAnchor] = React.useState<HTMLElement | null>(null)
```

### New imports needed

- `ArrowDropDown` from `@mui/icons-material`
- `Menu`, `MenuItem` from `@mui/material` (already imported: MenuItem may need adding)

## Files Changed

- `front/src/routes/Openings.tsx` — only file modified

## Out of Scope

- Persisting sort preference to localStorage
- Adding sort to Companies tab
- URL-based sort state
