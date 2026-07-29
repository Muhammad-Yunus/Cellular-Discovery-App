# FEATURE: WebSocket Integration
**Epic:** #9
**Depends on:** #3 Stores & Composables
**Status:** Pending

## User Story
Sebagai user, saya ingin mendapatkan update real-time GPS dan notifikasi scan completion melalui WebSocket, sehingga saya bisa melihat data terkini tanpa perlu refresh halaman.

## Acceptance Criteria
- [ ] WebSocket connection ke `/ws/gps` pada app mount
- [ ] WebSocket connection ke `/ws/scan` pada app mount
- [ ] GPS WebSocket menerima `{ "latitude": number, "longitude": number, "provider": string }` — update gpsStore dan map marker
- [ ] Scan WebSocket menerima `{ "event": "scan_complete", "scan_id": "uuid" }` — refresh history, update bottom panel, toast notification
- [ ] Auto-reconnect on disconnect dengan exponential backoff (max 5 retries)
- [ ] Cleanup connection on component unmount (onUnmounted)
- [ ] Error handling: graceful, user-friendly messages via toast
- [ ] Fallback: jika WebSocket gagal, aplikasi tetap berfungsi (data via REST)
- [ ] Connection status tracking di store
- [ ] Unit test: WebSocket message parsing, reconnect logic

## Tasks
- [ ] Update `composables/useGPS.ts`:
  - Connect WebSocket ke `/ws/gps` (URL dari apiBase, ganti http → ws)
  - Parse incoming messages, update gpsStore
  - Implement auto-reconnect dengan exponential backoff
  - Handle connection lifecycle (onOpen, onMessage, onError, onClose)
  - Fallback ke default coords jika timeout (5 detik tanpa message)
- [ ] Update `composables/useScan.ts`:
  - Connect WebSocket ke `/ws/scan`
  - Listen for `scan_complete` event
  - Refresh scan list via REST, update store
  - Show toast notification
  - Auto-reconnect dengan exponential backoff (max 5 retries)
- [ ] Buat WebSocket utility di `utils/websocket.ts`:
  - Reusable WebSocket class/factory
  - Auto-reconnect with exponential backoff: 1s, 2s, 4s, 8s, 16s (max 5)
  - Event emitter pattern (onMessage, onStatusChange)
  - Cleanup method
- [ ] Tracking connection status di store (connected/disconnected)
- [ ] Handle WebSocket URL transform: `http://...` → `ws://...`, `https://...` → `wss://...`
- [ ] Unit test: WebSocket message handling, reconnect, cleanup

## Components Touched
- composables/useGPS.ts (update)
- composables/useScan.ts (update)
- utils/websocket.ts
- stores/gpsStore.ts (update)
- stores/scanStore.ts (update)

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
- WebSocket URL: transform `NUXT_PUBLIC_API_BASE` dari `http://localhost:8000/api/v1` → `ws://localhost:8000/ws/gps`
- Exponential backoff base: 1 second, growth factor 2, max 5 retries
- Auto-reconnect: jangan reconnect jika component sudah unmount (guard flag)
- GPS fallback: start timer 5 detik setelah mount, jika no message within 5s, set default coords
- WebSocket messages: JSON parse, validate structure before dispatch
- Global reconnect: handle multiple WS connections independently (GPS + scan)
- Error toast: "GPS connection lost. Retrying..." / "Scan updates paused. Reconnecting..."
- Jangan blocking UI — WebSocket failure ≠ app failure. Fallback ke REST polling
