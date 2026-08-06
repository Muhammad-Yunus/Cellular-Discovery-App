## Summary of Changes

### App Store (app/stores/scanStore.ts)
1. Added `sortColumn` and `sortDirection` state properties to track current sorting column and direction
2. Created `getSortParam()` method to generate proper sort query string for backend (`-column` for desc, `column` for asc)
3. Updated `toggleSort(column)` method to accept a specific column parameter and properly toggle direction when clicking same column
4. Modified `fetchScans()` to use `getSortParam()` instead of old `sortParam`

### History Page (app/pages/history.vue)
1. Made columns **Operator**, **MCC**, **MNC**, **RAT**, and **Scan Time** sortable
2. Each column header is now a clickable button with sort direction icon
3. Icons show chevron-up (asc) or chevron-down (desc) when the column is sorted; otherwise shows arrow-up-down (neutral)
4. Used `resolveComponent('UIcon')` to safely render icons in render function (`h()`)

All changes compile successfully and build without errors.