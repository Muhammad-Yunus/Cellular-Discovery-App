# FEATURE: Scan Workflow
**Epic:** #8
**Depends on:** #6 Sidebar, #7 Bottom Panel
**Status:** Pending

## User Story
Sebagai user, saya ingin memulai scan LTE dengan satu klik, melihat proses loading, dan melihat hasilnya langsung muncul di map, sidebar, dan bottom panel.

## Acceptance Criteria
- [ ] Button "Get LTE Signal" di sidebar trigger POST /scan
- [ ] Loading overlay ditampilkan selama proses scan berlangsung
- [ ] Button disabled (dengan spinner) saat scan berlangsung
- [ ] Setelah scan selesai: map otomatis update (marker baru), sidebar tambah item, bottom panel tampil data
- [ ] Error handling: tampilkan toast/alert jika scan gagal (Network Error, Backend Offline, Scan Failed, Invalid Response)
- [ ] Error messages user-friendly — jangan expose stack trace / internal errors
- [ ] LoadingOverlay muncul saat request pending dan hilang setelah selesai
- [ ] LoadingOverlay support aggregated loading state untuk concurrent requests
- [ ] ConfirmationDialog untuk delete scan (optional, future)
- [ ] Toast notification untuk success/error events
- [ ] Unit test: scan workflow, loading states, error states

## Tasks
- [ ] Update `composables/useScan.ts`: tambah method `startScan()` yang panggil `scanService.createScan()` dan update stores
- [ ] Buat `components/LoadingOverlay.vue`:
  - Full-screen atau local overlay
  - Spinner component
  - Text message prop
  - Conditional v-if berdasarkan loading state
- [ ] Buat `components/StatusBadge.vue`:
  - Reusable badge for status display (success, error, loading, warning)
  - Color-coded berdasarkan status
- [ ] Buat `components/ConfirmationDialog.vue`:
  - Modal dialog for confirmation (e.g., delete scan)
  - Title, message, confirm/cancel buttons
  - Emit confirm/cancel events
- [ ] Integrasi toast notifications (Nuxt UI UToast)
- [ ] Flow: klik button → loading=true → POST /scan → success → update scanStore → update map → update sidebar → update bottom panel → toast success
- [ ] Flow: error → loading=false → toast error (user-friendly message)
- [ ] Cegah duplicate request: disable button saat loading
- [ ] Unit test: loading state perubahan, error handling, successful scan flow

## Components Touched
- components/LoadingOverlay.vue
- components/StatusBadge.vue
- components/ConfirmationDialog.vue
- composables/useScan.ts (update)
- stores/scanStore.ts (update)

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
- LoadingOverlay: `fixed inset-0 z-[60] bg-black/50 flex items-center justify-center`
- LoadingOverlay: optional per-component atau global (via uiStore)
- Toast: `useToast()` dari Nuxt UI untuk notifikasi
- Error messages user-facing:
  - Network Error → "Unable to connect to server. Please check your connection."
  - Backend Offline → "Backend server is not responding. Please try again later."
  - Scan Failed → "Scan failed. Please try again."
  - Invalid Response → "Received unexpected data from server."
- Jangan expose: error.message, error.stack, response body langsung ke user
- ConfirmationDialog: optional di epic ini — bisa delay ke future
- useScan composable return: `{ startScan, loading, error, scans, selectedScan }`
