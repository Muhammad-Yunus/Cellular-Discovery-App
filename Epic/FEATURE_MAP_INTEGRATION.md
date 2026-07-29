# FEATURE: Map Integration (Leaflet)
**Epic:** #5
**Depends on:** #4 Layout & Navigation
**Status:** Pending

## User Story
Sebagai user, saya ingin melihat peta interaktif dengan marker dari hasil scan LTE, sehingga saya bisa memvisualisasikan lokasi pemindaian secara geografis.

## Acceptance Criteria
- [ ] Leaflet map ter-render di area utama layout (full remaining space below navbar)
- [ ] Map center: [-6.150676643667096, 106.89665223346297] dengan zoom 17
- [ ] Tile layer OpenStreetMap atau provider sesuai konfigurasi
- [ ] Map mendukung zoom dan pan
- [ ] Marker ditampilkan di posisi GPS dari scan
- [ ] Popup marker menampilkan informasi operator, MCC/MNC, RAT, scan time
- [ ] MapView component reusable, menerima props untuk markers list
- [ ] MapMarker component untuk single marker dengan popup
- [ ] Sidebar & bottom panel semi-transparent overlay di atas map (z-index)
- [ ] Map meresize otomatis saat sidebar/panel toggle
- [ ] Default center dari environment variable
- [ ] Unit test map initialization dan marker rendering

## Tasks
- [ ] Install leaflet + @types/leaflet
- [ ] Setup leaflet CSS (import di plugin atau nuxt.config css)
- [ ] Buat `plugins/leaflet.client.ts` — register Leaflet icon fix (asset path issue)
- [ ] Buat `components/MapView.vue`:
  - Initialize Leaflet map on mount
  - Set center/zoom dari props/env
  - Handle resize
  - Accept markers array as prop
  - Emit map-click events
- [ ] Buat `components/MapMarker.vue`:
  - Accept position + scan data props
  - Create Leaflet marker with popup
  - Handle click: emit selected event
- [ ] Integrasi dengan `useMap` composable untuk map instance management
- [ ] Implementasi semi-transparent overlay CSS untuk sidebar/panel (via z-index)
- [ ] Tangani invalidateSize() saat sidebar toggle
- [ ] Unit test: render map, add/remove markers

## Components Touched
- components/MapView.vue
- components/MapMarker.vue
- plugins/leaflet.client.ts
- composables/useMap.ts (update)

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
- [ ] code reviewed

## Technical Notes
- Leaflet hanya jalan di client (gunakan `.client.ts` plugin atau ClientOnly wrapper)
- Fix icon path: Leaflet default icon broken di bundler — override dengan custom icon URL
- JANGAN gunakan Google Maps / OpenLayers — Leaflet only
- Tile layer: OpenStreetMap default (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`)
- Marker position: `[latitude, longitude]` format untuk Leaflet
- MapView harus handle cleanup (map.remove()) di onUnmounted
- Gunakan `nextTick()` untuk initialize map setelah DOM ter-render
