# FEATURE: Floating Sidebar
**Epic:** #6
**Depends on:** #5 Map Integration
**Status:** Pending

## User Story
Sebagai user, saya ingin melihat sidebar semi-transparent di sisi kiri peta yang menampilkan history scan, sehingga saya bisa mencari, memfilter, dan memilih hasil scan untuk dilihat detailnya.

## Acceptance Criteria
- [ ] Sidebar adalah floating semi-transparent overlay di sisi kiri map (280-320px width)
- [ ] Background semi-transparent (rgba(0,0,0,0.7-0.85)) sehingga map terlihat di belakangnya
- [ ] Z-index: di atas map layer, di bawah navbar
- [ ] Max-height: fills remaining viewport below navbar (overflow-y scroll)
- [ ] Menampilkan Scan History (scrollable list)
- [ ] SearchBox untuk mencari scan (debounce input)
- [ ] FilterPanel untuk filter scan (by RAT, operator, dll.)
- [ ] Sort control (by time, operator)
- [ ] New Scan Button ("Get LTE Signal")
- [ ] Setiap scan card menampilkan: Operator, MCC/MNC, RAT, Scan Time
- [ ] Click scan card: highlight marker on map, center map, open info di bottom panel
- [ ] Empty state: "No Scan History" jika tidak ada data
- [ ] Loading state: skeleton/spinner saat fetch
- [ ] Responsive: bisa di-toggle (collapse)
- [ ] Unit test sidebar components

## Tasks
- [ ] Buat `components/Sidebar.vue`:
  - Floating positioning (absolute/fixed left)
  - Semi-transparent background
  - Scrollable history list
  - Toggle close button
  - Props: scans, loading, selectedId
  - Events: select-scan, toggle
- [ ] Buat `components/HistoryList.vue`:
  - Receive scans array as prop
  - Render HistoryCard for each scan
  - Empty state handling
  - Loading state handling
- [ ] Buat `components/HistoryCard.vue`:
  - Display: Operator, MCC/MNC, RAT, Scan Time
  - Selected state styling
  - Click handler emit select
  - Hover effect
- [ ] Buat `components/SearchBox.vue`:
  - Input field with search icon
  - Debounce (300ms) emit search term
  - Clear button
- [ ] Buat `components/FilterPanel.vue`:
  - Filter by RAT (dropdown/chips): LTE, NR, GSM, UMTS, ALL
  - Filter by operator (text match)
  - Reset filter button
- [ ] Integrasi dengan scanStore untuk data source
- [ ] Toggle sidebar via uiStore
- [ ] Responsive: collapse to icon on smaller screens
- [ ] Unit test: Sidebar toggle, HistoryCard click, SearchBox debounce

## Components Touched
- components/Sidebar.vue
- components/HistoryList.vue
- components/HistoryCard.vue
- components/SearchBox.vue
- components/FilterPanel.vue

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
- Positioning: `fixed left-4 top-20` (below navbar) with `w-[300px]` dan `max-h-[calc(100vh-5rem)]`
- Background: `bg-black/70 backdrop-blur-sm`
- Z-index stack: navbar (50) > sidebar (40) > bottom panel (30) > map (10)
- SearchBox debounce: gunakan `useDebounceFn` dari @vueuse/core atau implementasi manual
- Filter RAT: dropdown dengan options ALL, LTE, NR, GSM, UMTS, CDMA
- Sort: dropdown sort by time desc/asc, operator A-Z
- New Scan Button: prominent, icon + "Get LTE Signal" text, disabled saat loading
- Clicking scan card: scrollIntoView untuk highlight di list + flyTo di map
