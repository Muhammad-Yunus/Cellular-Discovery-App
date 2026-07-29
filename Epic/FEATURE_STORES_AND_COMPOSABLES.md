# FEATURE: Pinia Stores & Composables
**Epic:** #3
**Depends on:** #2 Types & Services
**Status:** Pending

## User Story
Sebagai developer, saya ingin memiliki state management terpusat di Pinia stores dan composables yang membungkus interaksi API/store, sehingga komponen dapat mengakses data secara konsisten tanpa duplikasi.

## Acceptance Criteria
- [ ] 5 Pinia stores terdefinisi: scan, gps, settings, system, ui
- [ ] `scanStore` mengelola scan list, current selection, loading, pagination state
- [ ] `gpsStore` mengelola current position, provider, connection status
- [ ] `settingsStore` mengelola settings form state, loading, dirty flag
- [ ] `systemStore` mengelola backend/cli status, response time, health check
- [ ] `uiStore` mengelola sidebar open/close, bottom panel open/close, active tab
- [ ] 5 composables: useScan, useGPS, useSettings, useSystem, useMap
- [ ] Composables encapsulate service calls dan store actions
- [ ] Loading states dipropagasi dari composable ke component
- [ ] Unit tests untuk semua store + composables

## Tasks
- [ ] Buat `stores/scanStore.ts`: state (scans, selectedScanId, loading, pagination), actions (fetchScans, createScan, selectScan, deleteScan, setPage, setSearch)
- [ ] Buat `stores/gpsStore.ts`: state (latitude, longitude, provider, connected), actions (updatePosition, setProvider, setConnected)
- [ ] Buat `stores/settingsStore.ts`: state (settings, loading, saving, dirty), actions (fetchSettings, saveSettings)
- [ ] Buat `stores/systemStore.ts`: state (backendStatus, cliStatus, responseTime, lastCheck), actions (checkHealth)
- [ ] Buat `stores/uiStore.ts`: state (sidebarOpen, bottomPanelOpen, activeTab), actions (toggleSidebar, toggleBottomPanel, setActiveTab)
- [ ] Buat `composables/useScan.ts`: wrapper scanStore + scan service + loading state
- [ ] Buat `composables/useGPS.ts`: wrapper gpsStore + WebSocket connection logic
- [ ] Buat `composables/useSettings.ts`: wrapper settingsStore + settings service
- [ ] Buat `composables/useSystem.ts`: wrapper systemStore + health check logic
- [ ] Buat `composables/useMap.ts`: wrapper Leaflet map instance + marker management
- [ ] Unit tests untuk stores dengan setActivePinia + createPinia
- [ ] Unit tests untuk composables

## Components Touched
- stores/scanStore.ts
- stores/gpsStore.ts
- stores/settingsStore.ts
- stores/systemStore.ts
- stores/uiStore.ts
- composables/useScan.ts
- composables/useGPS.ts
- composables/useSettings.ts
- composables/useSystem.ts
- composables/useMap.ts

## Definition of Done (from AGENT.md)
- [ ] implementation finished
- [ ] typed
- [ ] documented
- [ ] reusable
- [ ] follows folder structure
- [ ] follows technology constraints
- [ ] passes lint
- [ ] passes unit tests
- [ ] contains no duplicated logic
- [ ] code reviewed

## Technical Notes
- Pinia stores: gunakan `defineStore` dengan Options API atau Setup store syntax
- Composables: jangan langsung return store — return reactive state + methods
- Loading state: composable return `{ data, loading, error, refresh }` pattern
- Pagination store: track `currentPage`, `limit`, `totalItems`, `offset`, `searchTerm`
- GPS fallback: default coords dari env (`NUXT_PUBLIC_DEFAULT_LAT/LON`)
- useMap: jangan inisialisasi Leaflet di composable — tunggu DOM mount, return `{ initMap, addMarker, flyTo, ... }`
- Composables yang manage WebSocket (useGPS, useScan) handle cleanup di `onUnmounted`
