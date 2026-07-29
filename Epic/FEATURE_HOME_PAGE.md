# FEATURE: Home Page (index.vue)
**Epic:** #11
**Depends on:** #6 Sidebar, #7 Bottom Panel, #8 Scan Workflow, #9 WebSocket, #10 Health Check
**Status:** Pending

## User Story
Sebagai user, saya ingin melihat halaman utama dashboard yang mengintegrasikan map, sidebar, bottom panel, dan semua fungsionalitas scan dalam satu tampilan terpadu.

## Acceptance Criteria
- [ ] `pages/index.vue` merender layout default dengan map sebagai background utama
- [ ] Sidebar floating di atas map (kiri)
- [ ] Bottom panel floating di atas map (bawah)
- [ ] Map menampilkan semua marker dari scan history
- [ ] Klik scan card di sidebar → map flyTo marker + highlight + bottom panel update
- [ ] "Get LTE Signal" button di sidebar trigger scan workflow
- [ ] Loading overlay muncul saat scan berlangsung
- [ ] Toast notification untuk events
- [ ] WebSocket GPS update map marker secara real-time
- [ ] Scan WebSocket update sidebar dan panel otomatis
- [ ] Health check periodic berjalan di background
- [ ] Empty state map: "No Scan Available" jika belum ada scan
- [ ] Halaman fully responsive (desktop/laptop/tablet)
- [ ] Unit test untuk integrasi komponen di halaman utama

## Tasks
- [ ] Update `pages/index.vue`:
  - Layout: MapView full area + Sidebar (floating left) + BottomPanel (floating bottom)
  - Init composables: useMap, useScan, useGPS, useSettings, useSystem on mount
  - Pass scan data dari scanStore ke MapView sebagai markers
  - Handle sidebar select → map flyTo + bottom panel update
  - Handle WebSocket GPS → update map marker position
  - Handle WebSocket scan_complete → refresh data
  - Display LoadingOverlay saat scan loading
  - Empty state: "No Scan Available" saat scan list kosong
- [ ] Integrasi Sidebar + MapView: selected scan ID synchronization
- [ ] Integrasi BottomPanel + stores: reactive data display
- [ ] Setup UApp + UToast untuk notifications
- [ ] Responsive layout adjustments
- [ ] Unit test: full page integration test

## Components Touched
- pages/index.vue
- components/MapView.vue (update for marker integration)
- components/Sidebar.vue (update for integration)

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
- Ini adalah epic integrasi — semua komponen sebelumnya digabung di sini
- Data flow: scanStore → Sidebar props ↔ Sidebar emit select → scanStore.selectScan → MapView flyTo + BottomPanel update
- GPS flow: WebSocket → gpsStore.updatePosition → reactive map marker + GPSPanel update
- Map empty state: "No Scan Available" di tengah map (overlay teks)
- Semua composables init di sini (onMounted), cleanup onUnmounted
- Jangan fetch scan di sini — composables handle sendiri
- Pastikan z-index stack benar: navbar (50) > sidebar (40) > bottom panel (30) > loading overlay (60) > toast (70)
