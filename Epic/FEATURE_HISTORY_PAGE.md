# FEATURE: Scan Result / History Page
**Epic:** #13
**Depends on:** #2 Types & Services, #3 Stores & Composables
**Status:** Pending

## User Story
Sebagai user, saya ingin melihat semua hasil scan dalam halaman terpisah dengan pagination dan search, sehingga saya bisa menelusuri history scan dengan mudah.

## Acceptance Criteria
- [ ] `pages/history.vue` (alias `/history`) menampilkan list semua scan
- [ ] Pagination: 20 items per page, Previous/Next buttons, page numbers
- [ ] Search input: filter by operator, MCC, MNC
- [ ] Setiap scan item menampilkan: Operator, MCC/MNC, RAT, Scan Time, GPS position
- [ ] Click scan item: navigasi ke halaman utama (/) dengan scan terpilih
- [ ] Empty state: "No Scan History" jika tidak ada data
- [ ] Loading state: skeleton rows saat fetch
- [ ] Error state: "Failed to load scan history. Retry?" dengan retry button
- [ ] Sort: by scan time (default desc), operator
- [ ] Responsive: table view di desktop, card view di tablet
- [ ] Unit test: pagination, search, sorting, empty/error states

## Tasks
- [ ] Update `services/scan.service.ts`: tambah parameter limit, offset, search di getScans()
- [ ] Update `stores/scanStore.ts`: tambah pagination state + actions (setPage, setLimit, setSearch, nextPage, prevPage)
- [ ] Update `composables/useScan.ts`: expose pagination methods
- [ ] Buat `pages/history.vue`:
  - Load scan list on mount dengan pagination params
  - Table/list view of scans
  - Search input at top (debounce)
  - Pagination controls at bottom
  - Click navigate to home with scan ID via query param
  - Empty state, loading state, error state
- [ ] Buat pagination component (custom atau Nuxt UI UPagination)
- [ ] Search: debounce 300ms, reset page ke 1 saat search berubah
- [ ] Handle URL query params untuk search + page (bookmarkable)
- [ ] Responsive: table → card layout on smaller screens
- [ ] Unit test: pagination flow, search, scan item click navigation

## Components Touched
- pages/history.vue
- services/scan.service.ts (update)
- stores/scanStore.ts (update)
- composables/useScan.ts (update)

## Definition of Done (from AGENT.md)
- [ ] implementation finished
- [ ] typed
- [ ] documented
- [ ] reusable
- [ ] responsive
- [ ] follows folder structure
- [ ] follows technology constraints
- [ ] follows component architecture
- [ ] passes lint
- [ ] passes unit tests
- [ ] contains no duplicated logic
- [ ] code reviewed

## Technical Notes
- Endpoint: `GET /scans?limit=20&offset=0&search=xxx`
- Pagination store: `currentPage`, `limit` (default 20), `totalItems`, `offset`, `searchTerm`
- computed: `totalPages = Math.ceil(totalItems / limit)`
- Navigate to home with scan ID: `navigateTo({ path: '/', query: { scan: scanId } })`
- Home page check query param on mount, jika ada `scan`, selectScan(scanId)
- Debounce search: `useDebounceFn` dari @vueuse/core atau `watch` dengan 300ms setTimeout
- Pastikan tidak ada race condition: request sebelumnya di-cancel jika params berubah
- Table: Nuxt UI UTable atau custom table component
