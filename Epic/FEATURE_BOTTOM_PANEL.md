# FEATURE: Bottom Information Panel
**Epic:** #7
**Depends on:** #5 Map Integration
**Status:** Pending

## User Story
Sebagai user, saya ingin melihat panel informasi di bagian bawah peta yang menampilkan detail signal, GPS, dan system status dalam tab terpisah, sehingga saya bisa memonitor data scan dan system health.

## Acceptance Criteria
- [ ] Bottom panel adalah floating semi-transparent overlay di bagian bawah map
- [ ] Background rgba(0,0,0,0.7) dengan z-index di atas map, di bawah sidebar
- [ ] Tabbed layout dengan 3 tabs: Signal, GPS, System
- [ ] Tab Signal: menampilkan Operator, MCC, MNC, RAT, Scan Time (dari selected scan)
- [ ] Tab GPS: menampilkan Latitude, Longitude, GPS Provider (dari gpsStore)
- [ ] Tab System: menampilkan Backend Status, CLI Status, Response Time (dari systemStore)
- [ ] Panel dapat di-toggle visibility (close/open)
- [ ] Panel mempertahankan state tab aktif (via uiStore)
- [ ] Empty state: "No scan selected" di Signal tab jika belum ada data
- [ ] Real-time update untuk GPS dan System tabs
- [ ] Responsive: lebar penuh di mobile, anchored di bottom desktop
- [ ] Optional: draggable / resizable
- [ ] Unit test panel components

## Tasks
- [ ] Buat `components/BottomPanel.vue`:
  - Floating positioning (fixed bottom)
  - Tab navigation (Signal | GPS | System)
  - Close toggle button
  - Semi-transparent background
  - Dynamic content based on active tab
- [ ] Buat `components/SignalPanel.vue`:
  - Display fields: Operator, MCC, MNC, RAT, Scan Time
  - Data from selected scan (scanStore.selectedScan)
  - Empty state: "No scan selected" / "No data available"
- [ ] Buat `components/GPSPanel.vue`:
  - Display fields: Latitude, Longitude, GPS Provider
  - Reactive data from gpsStore
  - Show "Waiting for GPS..." jika belum ada data
- [ ] Buat `components/SystemPanel.vue`:
  - Display: Backend Status (OK/Unavailable), CLI Status, Response Time
  - Data from systemStore
  - Auto-refresh via useSystem composable
  - Status badges (green/red)
  - Show timestamps
- [ ] Integrasi dengan uiStore untuk activeTab dan panel visibility
- [ ] Responsive: full width on tablet, anchored on desktop
- [ ] Unit test: tab switching, data display, empty states

## Components Touched
- components/BottomPanel.vue
- components/SignalPanel.vue
- components/GPSPanel.vue
- components/SystemPanel.vue

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
- Positioning: `fixed bottom-4 left-1/2 -translate-x-1/2` (center) atau `right-4` (corner)
- Width: `w-[90%] max-w-[800px]` di desktop, `w-full` di mobile
- Background: `bg-black/70 backdrop-blur-sm`
- Tabs: `UTabs` dari Nuxt UI atau custom tab component
- Tab state persist di uiStore: `uiStore.activeInfoTab`
- Signal panel data: `scanStore.selectedScan` — jika null, show "No scan selected"
- GPS panel subscribe ke gpsStore via `storeToRefs` untuk reactivity
- System panel: polling health check setiap 30 detik (via useSystem composable)
- Status badges: green circle untuk OK, red untuk error/unavailable
