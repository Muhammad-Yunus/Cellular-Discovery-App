# FEATURE: System Health Check
**Epic:** #10
**Depends on:** #3 Stores & Composables
**Status:** Pending

## User Story
Sebagai user, saya ingin melihat status backend dan CLI secara real-time di bottom panel, sehingga saya tahu apakah system berfungsi normal.

## Acceptance Criteria
- [ ] Health check ke GET `/health` pada app mount
- [ ] Health check periodik setiap 30 detik setelah mount
- [ ] Backend status ditampilkan: OK (green) / Unavailable (red) di System tab
- [ ] CLI status: inferred dari last scan time atau endpoint terpisah
- [ ] Response time diukur dan ditampilkan
- [ ] Status badges color-coded
- [ ] Jika backend offline, tampilkan toast/notification
- [ ] Health check berhenti saat navigasi away dari halaman yang relevan (cleanup)
- [ ] Update systemStore dengan hasil health check
- [ ] Unit test: health check polling, status updates

## Tasks
- [ ] Update `services/system.service.ts`: implement `getHealth()` yang panggil GET `/health`
- [ ] Update `composables/useSystem.ts`:
  - Panggil health check on mount
  - Set interval 30 detik untuk periodic check
  - Update systemStore dengan status + response time
  - Cleanup interval on unmount
  - Handle network errors gracefully
- [ ] Update `components/SystemPanel.vue`:
  - Display Backend Status dengan StatusBadge
  - Display CLI Status
  - Display Response Time (ms)
  - Show last check timestamp
- [ ] Update `stores/systemStore.ts`:
  - State: backendStatus ('ok' | 'unavailable'), cliStatus, responseTime, lastCheck
  - Actions: setHealth(), setCLIStatus()
- [ ] Handle edge case: first check loading, empty state
- [ ] Unit test: health check success/error, interval cleanup, status change

## Components Touched
- composables/useSystem.ts (update)
- services/system.service.ts (update)
- stores/systemStore.ts (update)
- components/SystemPanel.vue (depends on #7)

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
- Endpoint: GET `/health` → 200 = OK, 503 = Unavailable
- Response time: measure dengan `performance.now()` sebelum dan sesudah request
- CLI status: dari GET `/scans` — jika last scan > configurable threshold, warning
- Interval cleanup: `onUnmounted` clear interval
- Toast notification: hanya saat status berubah dari OK → Unavailable (avoid spam)
- SystemPanel polling indicator: subtle pulse icon saat checking
