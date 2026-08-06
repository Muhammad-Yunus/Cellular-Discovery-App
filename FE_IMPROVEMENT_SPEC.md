# FE_IMPROVEMENT_SPEC.md — Frontend Specification Additions (Mission Planner)

> This document is a **companion** to [`FE_SPEC.md`](./FE_SPEC.md). It adds Mission Planner pages and components on top of the existing specification. All base conventions (technology stack, design principles, architecture patterns) remain governed by `FE_SPEC.md`. All technology/architecture decisions in `FE_SPEC.md` apply here: Nuxt 4 (Pages router), Pinia stores, `$fetch` (NOT axios), TailwindCSS, `@iconify/vue`, Leaflet for maps, services layer for API calls, `types/` directory for DTOs.

**Version:** 1.2 (aligned with backend `app/api/routers/mission_*.py` and `app/schemas/mission*.py`, `route.py`)
**Date:** 2025-07-31
**Author:** Agnes-2.0-Flash (Sapiens AI)
**Backend API contract source of truth:**
- `backend/app/api/routers/missions.py`
- `backend/app/api/routers/mission_locations.py`
- `backend/app/api/routers/mission_planning.py`
- `backend/app/api/routers/mission_control.py`
- `backend/app/api/routers/mission_scans.py`
- `backend/app/api/routers/ws_mission.py`
- `backend/app/schemas/mission.py`
- `backend/app/schemas/mission_location.py`
- `backend/app/schemas/route.py`
- `backend/app/schemas/scan.py`

---

## 1. Overview

This document specifies additional UI/UX requirements for the **Mission Planner** feature to be integrated into the existing Nuxt/Vue frontend (defined in [`FE_SPEC.md`](./FE_SPEC.md)). It builds on top of the existing `/scan`, `/scans`, and `/settings` pages, adding new pages for mission management, location import, route planning, and real-time mission monitoring via WebSockets.

**Key feature behavior:**
- Users create a mission with metadata (name, description, radius, optional TTY port override).
- Users import tower locations via CSV → these become `mission_locations` rows tied to that mission.
- User runs **auto-plan** (`POST /missions/{id}/plan`) which orders visit sequence (nearest-neighbor heuristic), or **manually reorders** via drag/drop or numeric input.
- User clicks **Start** → backend singleton executor takes over (only one mission RUNNING at any time globally).
- Backend polls GPS via WebSocket `/ws/gps`, and when distance to current target ≤ `radius_meters`, auto-triggers `/scan`.
- Frontend subscribes to `/ws/mission` for live progress, visit events, status changes, and errors.

**Note on UI scope:** This spec only adds **mission planner pages**. The existing `/scan` page remains untouched (it is the manual scan flow). The mission executor calls the scan service internally — it never triggers the `/scan` page UI.

---

## 2. New Pages Structure (Nuxt 4 Convention)

Nuxt 4 uses automatic routing from the `pages/` directory. The Mission Planner feature adds these pages:

```
pages/
├── index.vue                  (existing dashboard, may add link to missions)
├── scan.vue                   (existing /scan — UNCHANGED)
├── history.vue                (existing /scans — UNCHANGED)
├── missions/                  (NEW: /missions — MissionListPage)
│   ├── index.vue              -- List all missions (MissionListPage)
│   ├── create.vue             -- Mission creation form (MissionCreatePage)
│   └── [id]/                  -- Dynamic route for single mission
│       ├── index.vue          -- Mission detail & tabs (MissionDetailPage)
│       ├── edit.vue           -- Edit mission metadata (MissionEditPage)
│       └── locations/
│           ├── index.vue      -- Tower locations list (LocationListPage)
│           └── upload.vue     -- CSV upload (LocationUploadPage)
├── settings.vue               (existing)
└── about.vue                  (existing)
```

### 2.1 Route Configuration (Nuxt 4 automatic routing)

| Page File                              | Route                                | Description |
|----------------------------------------|--------------------------------------|-------------|
| `missions/index.vue`                   | `/missions`                          | List all missions with status filter (MissionListPage) |
| `missions/create.vue`                  | `/missions/create`                   | Form to create a new mission (MissionCreatePage) |
| `missions/[id]/index.vue`              | `/missions/:id`                      | Mission detail with tabs (MissionDetailPage) |
| `missions/[id]/edit.vue`               | `/missions/:id/edit`                 | Edit mission metadata (MissionEditPage) |
| `missions/[id]/locations/index.vue`    | `/missions/:id/locations`            | Tower locations for a mission (LocationListPage) |
| `missions/[id]/locations/upload.vue`   | `/missions/:id/locations/upload`     | CSV upload + batch error log (LocationUploadPage) |

### 2.2 Navigation Bar Update

Existing navigation items: **Scan**, **History**, **Settings**, **About**.
Add new nav entry: **Missions** → `/missions`.

The nav menu SHALL highlight the active route. Add the Missions entry between History and Settings (logical grouping: scan-related actions).

---

## 3. Full API Inventory (Mission Planner Endpoints)

> **All** endpoints below follow `/api/v1/missions/*` prefix from the FastAPI routers. The frontend services layer SHALL call `$fetch('/missions/...')` (the prefix is appended by Nuxt via `NUXT_PUBLIC_API_BASE`).

### 3.1 Mission CRUD (`missions.py`)

| Method | Path | Query / Body | Response | Description |
|--------|------|--------------|----------|-------------|
| POST   | `/missions` | `MissionCreate` body | `MissionResponse` (201) | Create new mission. Name required (non-empty), radius_meters must be > 0 (optional), tty_port optional. |
| GET    | `/missions` | `?page=1&page_size=10&status=<status>&search=<q>` | `MissionListResponse` | Paginated list with optional status filter and search by name/description. |
| GET    | `/missions/{id}` | – | `MissionDetailResponse` (404 if not found) | Mission header + nested `locations: MissionLocationResponse[]`. |
| PATCH  | `/missions/{id}` | `MissionUpdate` body | `MissionResponse` | Partial update for name/description/radius/tty_port/start_location_id. |
| DELETE | `/missions/{id}` | – | `MissionDeleteResponse` | Delete mission and cascade-delete its locations. |

### 3.2 Location Management (`mission_locations.py`)

| Method | Path | Query / Body | Response | Description |
|--------|------|--------------|----------|-------------|
| POST   | `/missions/{id}/locations/upload` | `multipart file=<csv>` | `UploadLocationResponse` (422 if no file) | Upsert CSV rows. Returns `upload_batch_id`, counts of inserted/updated/skipped, and per-row errors. |
| GET    | `/missions/{id}/locations` | `?page=1&page_size=10&search=<q>` | `LocationListResponse` | Paginated list of locations for a mission. |
| GET    | `/missions/{id}/locations/{lid}` | – | `MissionLocationResponse` (404 if not found) | Single location. |
| DELETE | `/missions/{id}/locations/{lid}` | – | `DeleteLocationResponse` | Delete a single location. |
| POST   | `/missions/{id}/locations/bulk-delete` | `{upload_batch_id: string}` | `BulkDeleteResponse` | Delete all locations from one CSV batch. |

### 3.3 Route Planning (`mission_planning.py`)

| Method | Path | Query / Body | Response | Description |
|--------|------|--------------|----------|-------------|
| POST   | `/missions/{id}/plan` | – | `RouteResponse` | Compute auto-plan (nearest-neighbor ordering), populate `sequence_order`, `distance_from_previous_meters`, `bearing_from_previous_degrees`. |
| GET    | `/missions/{id}/route` | – | `RouteResponse` | Read current ordered route (sequence_order ASC). |
| POST   | `/missions/{id}/route/reorder` | `[{location_id, sequence_order}, …]` | `RouteResponse` | Manual reorder; payload is a list of `{location_id, sequence_order}` pairs. |
| POST   | `/missions/{id}/route/skip` | `{location_id: int}` | `SkipResponse` | Mark a location as `SKIPPED`. |

### 3.4 Mission Control (`mission_control.py`)

| Method | Path | Body | Response | Description |
|--------|------|------|----------|-------------|
| POST   | `/missions/{id}/start` | – | dynamic (executor returns status envelope) | Start the singleton executor. **409 Conflict if another mission is RUNNING.** |
| POST   | `/missions/{id}/pause` | – | dynamic | Pause RUNNING mission. |
| POST   | `/missions/{id}/resume` | – | dynamic | Resume PAUSED mission. |
| POST   | `/missions/{id}/stop` | – | dynamic | Stop the mission (any non-terminal state). |
| GET    | `/missions/{id}/status` | – | `MissionStatusResponse` | Current status + counters (poll if WebSocket disconnects). |
| GET    | `/missions/{id}/logs` | – | `MissionLogResponse` | In-memory ring buffer of log entries (size from `MISSION_LOG_SIZE` setting). |

### 3.5 Mission Scans (`mission_scans.py`)

| Method | Path | Query | Response | Description |
|--------|------|-------|----------|-------------|
| GET    | `/missions/{id}/scans` | `?page=1&page_size=10&search=<q>&rat=<rat>&start_time=<iso>&end_time=<iso>&sort=-scan_time` | `PaginatedResponse` | Scans filtered to this mission (JOIN on `mission_locations.scan_session_id`). 404 if mission not found. |
| GET    | `/missions/{id}/scans/export` | same filters as above (no pagination) | CSV (`Content-Disposition: attachment; filename="mission_{id}_scans.csv"`) | Bulk export filtered scans. |

### 3.6 WebSocket — Mission Events (`ws_mission.py`)

| Channel | Direction | Payload | Description |
|---------|-----------|---------|-------------|
| `/ws/mission` | server → client | `{type, mission_id, data}` | Broadcasts events. Backend invokes `broadcast_mission_event(event_type, mission_id, **data)`. |

**Valid `event_type` values (from `EVENT_TYPES` set in `mission_executor.py`):**
`STARTING`, `RUNNING`, `PAUSED`, `RESUMED`, `VISITED`, `SKIPPED`, `STOPPED`, `COMPLETED`, `FAILED`, `GPS_ERROR`, `SCAN_ERROR`, `INFO`.

Example payload:
```json
{
  "type": "VISITED",
  "mission_id": 1,
  "data": {
    "location_id": 5,
    "scan_session_id": 120,
    "distance_meters": 18.2
  }
}
```

---

## 4. Component Specifications

### 4.1 `pages/missions/index.vue` — MissionListPage

**Purpose:** List all missions with summary, filter by status, quick actions.

#### API Calls
- `GET /api/v1/missions?page=<n>&page_size=10&status=<filter>&search=<q>` on mount and after any mutation (create/delete/start/stop).
- WebSocket event handler updates rows in-place when status or counters change.

#### UI Layout

```
Header: "Mission Dashboard" + [Create Mission Button (+)]
─────────────────────────────────────────────────────────────
Filters: [Search input] [Status filter: ALL | IDLE | READY | RUNNING | PAUSED | COMPLETED | STOPPED | FAILED ▼]

┌──────────────────────────────────────────────────────────────────────────┐
│ ID │ Name          │ Status   │ Progress   │ Created   │ Actions         │
├────┼────────────────┼──────────┼────────────┼───────────┼─────────────────┤
│ 1  │ Jakarta Sweep │ RUNNING  │ ████ 3/10  │ 2025-07-30│ ▶︎ ⏸ ⏹ ✎  🗑   │
│ 2  │ Downtown Scan │ COMPLETED│ ████ 10/10 │ 2025-07-29│ 👁  🗑          │
│ 3  │ Bandung Trip  │ IDLE     │ ░░░░ 0/5   │ 2025-07-31│ ▶︎ ✎  🗑         │
└──────────────────────────────────────────────────────────────────────────┘
[Pagination: « 1 2 3 » | Page size: [10] [25] [50] | Total: 18]
```

#### Row Action Buttons (depending on `status`)
| Status    | Available Actions                     |
|-----------|---------------------------------------|
| IDLE/READY| ▶︎ Start, ✎ Edit, 🗑 Delete (confirm) |
| STARTING  | (auto-advance to RUNNING)             |
| RUNNING   | ⏸ Pause, ⏹ Stop                      |
| PAUSED    | ⏵ Resume, ⏹ Stop                     |
| COMPLETED | 👁 View, 🗑 Delete (confirm)          |
| STOPPED   | ▶︎ Restart, ✎ Edit, 🗑 Delete         |
| FAILED    | 👁 View Logs, 🗑 Delete               |
| PLANNING  | (show spinner, no actions)            |

**Stop and Delete both require confirmation modals.** Stop modal copy: *"This mission will be terminated. Visited locations stay scanned; unvisited locations remain PENDING. Continue?"*

#### Pagination
Standard pagination component: page size selector (10, 25, 50), current page indicator, total count text.

---

### 4.2 `pages/missions/create.vue` — MissionCreatePage

**Purpose:** Create a new mission via form.

#### Form Fields
- **Name** *(required)* — text input, max 255 chars, non-empty after trim.
- **Description** *(optional)* — textarea, max 2000 chars.
- **Radius (meters)** *(optional)* — number input, must be > 0 if set, defaults to 20 (matches backend default if omitted).
- **TTY Port** *(optional)* — text input, e.g., `/dev/ttyUSB0`. If empty, executor uses `DEFAULT_TTY` setting.

#### Validation
- Submit is disabled while name is empty (after trim).
- Show inline error: "Mission name is required" if user tabs past empty field.

#### On Submit
1. POST `/missions` with `MissionCreate` body.
2. On 201 success, navigate to `/missions/{created_id}/locations/upload` so the user can immediately import tower locations. Do NOT navigate to detail page yet — locations are required before the mission becomes actionable.
3. On 422, show server validation errors inline.
4. On other errors, show toast (see §10).

---

### 4.3 `pages/missions/[id]/index.vue` — MissionDetailPage

**Purpose:** Single mission overview with tabs, action buttons, live progress.

#### Tabs Navigation

| # | Tab          | Content                                                                                         |
|---|--------------|------------------------------------------------------------------------------------------------|
| 1 | **Overview** | Mission header fields (name, description, radius_meters, tty_port, status badge, counters), plan/start/pause/resume/stop action buttons, inline `progress_percent` bar. |
| 2 | **Route**    | Interactive Leaflet map showing all mission locations in `sequence_order`, polyline connecting points, live GPS dot overlay, color-coded markers (see §8). |
| 3 | **Planner**  | Table of `mission_locations`: tower ID/name, lat/lon, `sequence_order`, status badge, `actual_visit_time`, `scan_session_id` (link → detail). Manual reorder via drag-drop or numeric input. |
| 4 | **Scans**    | Paginated list of scan results linked to this mission via `MissionScanService`. Same filter set as main `/scans`. |
| 5 | **Logs**     | Event timeline of mission events (STARTING, VISITED, SCAN_ERROR, …) using `GET /missions/{id}/logs` (poll every 5s) plus WebSocket `Logs` event stream for live entries. |

#### Action Buttons (Overview tab — conditional on status)

| Status     | Available Actions                                                                |
|------------|----------------------------------------------------------------------------------|
| IDLE       | [Generate Plan] [✎ Edit] [🗑 Delete] [▶︎ Start *(disabled until plan exists)*]    |
| READY      | [▶︎ Start] [🔀 Reorder] [⬀ Skip *(per-row)*] [✎ Edit]                            |
| PLANNING   | (spinner — plan in progress)                                                     |
| STARTING   | (spinner — executor initializing)                                                |
| RUNNING    | [⏸ Pause] [⏹ Stop]                                                               |
| PAUSED     | [⏵ Resume] [⏹ Stop]                                                              |
| COMPLETED  | [📥 Export Scans] [👁 View Logs] [🗑 Delete]                                     |
| STOPPED    | [▶︎ Restart] [🔄 Re-plan] [✎ Edit] [🗑 Delete]                                    |
| FAILED     | [👁 View Logs] [🔄 Retry] [🗑 Delete]                                             |

- **Generate Plan** → POST `/missions/{id}/plan` → show spinner → on success refresh Route + Planner tabs.
- **Manual Reorder** → open modal (see §9) → POST `/missions/{id}/route/reorder`.
- **Skip** → on a Planner-tab row: POST `/missions/{id}/route/skip` with `{location_id}`.
- **Start / Pause / Resume / Stop** → call control endpoints. On 409 (another mission RUNNING), show toast: *"Another mission is already running. Please wait or stop it first."*

#### Live Update (WebSocket)
Subscribe (via `MissionsWebSocket.vue` global component) to channel `"mission"`. On each event:
- `STARTING` → status badge to STARTING, disable Start button.
- `RUNNING` → status to RUNNING, show Pause/Stop.
- `PAUSED` / `RESUMED` → swap Pause↔Resume visibility.
- `VISITED` → mark location as VISITED in Planner tab, append entry to Logs.
- `SKIPPED` → mark location row as SKIPPED.
- `GPS_ERROR` → append to Logs with warning styling.
- `SCAN_ERROR` → append to Logs with error styling, do NOT mark location as failed (executor auto-retries).
- `STOPPED` / `COMPLETED` / `FAILED` → final status, disable control buttons, show toast.

---

### 4.4 `pages/missions/[id]/locations/upload.vue` — LocationUploadPage

**Purpose:** Upload CSV of tower locations, view batch results, manage uploads.

#### Upload Form

```
[ Choose File   no-file-selected.csv ]    [⬆ UPLOAD]
─────────────────────────────────────────────────────────────────
Progress bar: ███████░░░ 70%
─────────────────────────────────────────────────────────────────
Result Panel (appears after upload):
  Batch ID: 8f3c1e9a-4b6d-4a7c-b321-9f0e8d7c6b5a
  Summary: 150 inserted, 12 updated, 3 skipped
  [View Errors]  [Go to Location List →]
─────────────────────────────────────────────────────────────────
Error Log (collapsible, only if errors > 0):
  Row 42: Invalid latitude value 'abc'
  Row 87: Missing required column 'cellular_tower_id'
  ...
─────────────────────────────────────────────────────────────────
Recent Uploads (last 5 batches shown as cards):
  ┌──────────────────────────────────────┐
  │ Batch: 8f3c1e9a...                   │
  │ 150 inserted · 12 updated · 3 skipped│
  │ Uploaded: 2025-07-31 14:23          │
  │ [View Locations] [⛌ Delete Batch]    │
  └──────────────────────────────────────┘
```

#### CSV Validation Rules (server-side enforced; FE shows toast on 422)
- Header MUST be: `cellular_tower_id,cellular_tower_name,latitude,longitude`
- `cellular_tower_id` required, unique per mission (duplicates trigger UPSERT, not error)
- `latitude` must be float in `[-90, 90]`
- `longitude` must be float in `[-180, 180]`
- `cellular_tower_name` optional string

#### On Upload Success
- Show toast: *"Upload complete: 150 inserted, 12 updated, 3 skipped"*
- Show Result Panel with batch ID
- Append a card to "Recent Uploads" section (fetch via `GET /missions/{id}/locations?page=1&page_size=10&search=<batch_id>` would NOT work — instead, derive batch list from local state and re-fetch on revisit)

#### On Upload Error
- 422 with detail message: parse and show inline
- 413 (file too large): show "File too large" toast

#### Recent Uploads Section
- Maintain a local `recentBatches` array updated by successful uploads in this session
- Persist across page reloads via `localStorage` key `mission:{id}:recent_batches` (array of `{batch_id, upload_time, summary}`)

---

### 4.5 `pages/missions/[id]/locations/index.vue` — LocationListPage

**Purpose:** Paginated list of locations for a mission, search, bulk delete by batch, individual delete.

#### UI Layout

```
Header: "Locations for {Mission Name}" [⬆ Upload CSV] [Back to Mission]
─────────────────────────────────────────────────────────────────────
[Search by tower ID/name]   Batch filter: [All ▼]   [⛌ Bulk Delete Selected]

┌──────────────────────────────────────────────────────────────────────────┐
│ ☐ │ Sequence │ Tower ID │ Tower Name    │ Lat      │ Lon      │ Status │
├───┼──────────┼───────────┼───────────────┼──────────┼──────────┼────────┤
│ ☐ │ 1        │ TWR-001   │ Jakarta P.    │ -6.2088  │ 106.8456 │ 🟢     │
│ ☐ │ 2        │ TWR-002   │ Sudirman       │ -6.2210  │ 106.8200 │ 🔵     │
│ ☐ │ 3        │ TWR-003   │ Kemang         │ -6.2610  │ 106.8133 │ ⚪     │
│ ☐ │ 4        │ TWR-004   │ TB Simatupang  │ -6.2890  │ 106.7980 │ 🔴     │
└──────────────────────────────────────────────────────────────────────────┘
[Pagination: « 1 2 3 » | Page size: [25] | Total: 42]
```

Status badges: ⚪ PENDING, 🔵 IN_PROGRESS, 🟢 VISITED, 🔴 SKIPPED

**Bulk delete:** select multiple rows, click "Bulk Delete Selected" → confirmation modal: *"Delete X locations? This cannot be undone."* → DELETE per location OR if all share a batch, use POST `/locations/bulk-delete` with `upload_batch_id`.

---

### 4.6 `components/MissionsWebSocket.vue` — Hidden Global Component

Single Vue component mounted once in `app.vue` that manages the `/ws/mission` WebSocket lifecycle.

**Structure:**

```vue
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useMissionStore } from '@/stores/mission'

const ws = ref<WebSocket | null>(null)
const reconnectAttempts = ref(0)
const MAX_RETRIES = 5
const BASE_BACKOFF_MS = 1000

const missionStore = useMissionStore()

function buildWsUrl(): string {
  const apiBase = useRuntimeConfig().public.apiBase // NUXT_PUBLIC_API_BASE
  // Convert http(s) → ws(s), strip trailing /api/v1
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const apiHost = apiBase.replace(/^https?:\/\//, '').split('/')[0]
  return `${wsProtocol}//${apiHost}/ws/mission`
}

function connect() {
  ws.value = new WebSocket(buildWsUrl())

  ws.value.onopen = () => {
    reconnectAttempts.value = 0
    console.info('Mission WS connected')
  }

  ws.value.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data)
      // msg = { type, mission_id, data }
      missionStore.applyEvent(msg.type, msg.mission_id, msg.data)
    } catch (err) {
      console.error('Mission WS malformed payload', err)
    }
  }

  ws.value.onclose = () => {
    if (reconnectAttempts.value >= MAX_RETRIES) {
      console.warn('Mission WS giving up after max retries')
      return
    }
    const delay = BASE_BACKOFF_MS * Math.pow(2, reconnectAttempts.value)
    reconnectAttempts.value++
    setTimeout(connect, delay)
  }

  ws.value.onerror = (err) => {
    console.error('Mission WS error', err)
    ws.value?.close()
  }
}

onMounted(connect)

onBeforeUnmount(() => {
  ws.value?.close()
})
</script>

<template>
  <!-- Hidden: no DOM output -->
</template>
```

> **Critical:** This component is added to `app.vue` ONCE (not per page) so events are received globally regardless of current route.

---

## 5. State Management (Pinia)

### 5.1 New Store `stores/mission.ts`

```ts
export const useMissionStore = defineStore('mission', {
  state: () => ({
    missions: [] as MissionResponse[],
    currentMission: null as MissionDetailResponse | null,
    activeStatusFilter: 'ALL' as MissionStatus | 'ALL',
    activeSearchQuery: '' as string,
    pagination: { page: 1, pageSize: 10, total: 0 } as PaginationState,
    liveLogs: new Map<number, MissionLogEntry[]>(),
  }),

  getters: {
    getRunningMission: (state): MissionResponse | undefined =>
      state.missions.find(m => m.status === 'RUNNING'),
  },

  actions: {
    async fetchMissions(params: { status?: MissionStatus | 'ALL'; search?: string; page?: number; pageSize?: number } = {}) {
      const query = new URLSearchParams()
      if (params.status && params.status !== 'ALL') query.set('status', params.status)
      if (params.search) query.set('search', params.search)
      query.set('page', String(params.page ?? this.pagination.page))
      query.set('page_size', String(params.pageSize ?? this.pagination.pageSize))
      const res = await $fetch<MissionListResponse>(`/missions?${query.toString()}`)
      this.missions = res.items
      this.pagination = { page: res.page, pageSize: res.page_size, total: res.total }
    },

    async getMission(id: number) {
      this.currentMission = await $fetch<MissionDetailResponse>(`/missions/${id}`)
    },

    async createMission(payload: MissionCreate): Promise<MissionResponse> {
      return await $fetch<MissionResponse>('/missions', { method: 'POST', body: payload })
    },

    async updateMission(id: number, payload: MissionUpdate): Promise<MissionResponse> {
      return await $fetch<MissionResponse>(`/missions/${id}`, { method: 'PATCH', body: payload })
    },

    async deleteMission(id: number): Promise<void> {
      await $fetch(`/missions/${id}`, { method: 'DELETE' })
      this.missions = this.missions.filter(m => m.id !== id)
    },

    async startMission(id: number): Promise<any> {
      return await $fetch(`/missions/${id}/start`, { method: 'POST' })
    },
    async pauseMission(id: number) { return await $fetch(`/missions/${id}/pause`, { method: 'POST' }) },
    async resumeMission(id: number) { return await $fetch(`/missions/${id}/resume`, { method: 'POST' }) },
    async stopMission(id: number) { return await $fetch(`/missions/${id}/stop`, { method: 'POST' }) },

    async planMission(id: number): Promise<RouteResponse> {
      return await $fetch<RouteResponse>(`/missions/${id}/plan`, { method: 'POST' })
    },
    async getRoute(id: number): Promise<RouteResponse> {
      return await $fetch<RouteResponse>(`/missions/${id}/route`)
    },
    async reorderRoute(id: number, payload: { location_id: number; sequence_order: number }[]) {
      return await $fetch<RouteResponse>(`/missions/${id}/route/reorder`, { method: 'POST', body: payload })
    },
    async skipLocation(id: number, locationId: number): Promise<SkipResponse> {
      return await $fetch<SkipResponse>(`/missions/${id}/route/skip`, { method: 'POST', body: { location_id: locationId } })
    },

    async uploadLocationsCsv(id: number, file: File): Promise<UploadLocationResponse> {
      const form = new FormData()
      form.append('file', file)
      return await $fetch<UploadLocationResponse>(`/missions/${id}/locations/upload`, { method: 'POST', body: form })
    },

    async fetchLocations(id: number, params: { page?: number; pageSize?: number; search?: string }) {
      return await $fetch<LocationListResponse>(`/missions/${id}/locations`, { params })
    },
    async deleteLocation(id: number, locationId: number): Promise<void> {
      await $fetch(`/missions/${id}/locations/${locationId}`, { method: 'DELETE' })
    },
    async bulkDeleteLocations(id: number, batchId: string): Promise<BulkDeleteResponse> {
      return await $fetch<BulkDeleteResponse>(`/missions/${id}/locations/bulk-delete`, {
        method: 'POST',
        body: { upload_batch_id: batchId },
      })
    },

    async fetchMissionScans(id: number, params: { page?: number; pageSize?: number; search?: string; rat?: string; start_time?: string; end_time?: string; sort?: string }) {
      return await $fetch<PaginatedResponse>(`/missions/${id}/scans`, { params })
    },

    async fetchStatus(id: number) {
      return await $fetch(`/missions/${id}/status`)
    },
    async fetchLogs(id: number): Promise<MissionLogResponse> {
      return await $fetch<MissionLogResponse>(`/missions/${id}/logs`)
    },

    /**
     * Apply a WebSocket event to the store.
     * Called by MissionsWebSocket.vue global component.
     */
    applyEvent(type: string, missionId: number, data: any) {
      // Push to live log buffer
      const buf = this.liveLogs.get(missionId) ?? []
      buf.push({ timestamp: new Date().toISOString(), event_type: type, message: JSON.stringify(data) })
      this.liveLogs.set(missionId, buf.slice(-200))

      // Update in-memory missions list / current mission
      const setStatus = (status: MissionStatus) => {
        if (this.currentMission?.id === missionId) this.currentMission.status = status
        const m = this.missions.find(x => x.id === missionId)
        if (m) m.status = status
      }

      switch (type) {
        case 'STARTING':
          setStatus('STARTING'); break
        case 'RUNNING':
          setStatus('RUNNING'); break
        case 'PAUSED':
          setStatus('PAUSED'); break
        case 'RESUMED':
          setStatus('RUNNING'); break
        case 'STOPPED':
          setStatus('STOPPED'); break
        case 'COMPLETED':
          setStatus('COMPLETED'); break
        case 'FAILED':
          setStatus('FAILED'); break
        case 'VISITED':
          if (this.currentMission?.id === missionId) {
            this.currentMission.visited_locations += 1
            this.currentMission.progress_percent = (this.currentMission.visited_locations / this.currentMission.total_locations) * 100
            this.currentMission.current_location_id = data.location_id ?? this.currentMission.current_location_id
          }
          break
      }
    },
  },
})
```

**Singleton constraint visibility:** `getRunningMission` getter surfaces whether another mission is currently RUNNING. The UI SHALL show a warning banner on the MissionListPage if `getRunningMission` exists and the user is on the page of a *different* mission in IDLE/READY state: *"Mission '{name}' is currently RUNNING. Start is disabled until it stops."*

### 5.2 Separate composable `composables/useMissionWebSocket.ts`

For pages that want to listen to events while mounted but not depend on the global component (e.g., standalone location list), expose a thin composable wrapping the store's `applyEvent` plus `onMounted`/`onUnmounted` lifecycle.

---

## 6. DTOs / Types (TypeScript Interfaces)

> **These DTOs MIRROR the backend Pydantic models** from `backend/app/schemas/mission.py`, `mission_location.py`, `route.py`, `scan.py`. Maintain sync when backend changes.

```ts
// ─── Mission ────────────────────────────────────────────────────────
export type MissionStatus =
  | 'IDLE' | 'PLANNING' | 'READY' | 'STARTING' | 'RUNNING'
  | 'PAUSED' | 'COMPLETED' | 'STOPPED' | 'FAILED'

export interface MissionCreate {
  name: string
  description?: string | null
  radius_meters?: number | null
  tty_port?: string | null
}

export interface MissionUpdate {
  name?: string
  description?: string | null
  radius_meters?: number | null
  tty_port?: string | null
  start_location_id?: number | null
}

export interface MissionResponse {
  id: number
  name: string
  description: string | null
  status: MissionStatus
  radius_meters: number | null
  tty_port: string | null
  start_location_id: number | null
  current_location_id: number | null
  total_locations: number
  visited_locations: number
  progress_percent: number  // computed by backend: (visited / total) * 100, 0 if total=0
  started_at: string | null
  completed_at: string | null
  stopped_at: string | null
  created_at: string
  updated_at: string
}

export interface MissionListResponse {
  items: MissionResponse[]
  total: number
  page: number
  page_size: number
  // NOTE: backend does NOT return total_pages for /missions — derive as Math.ceil(total/page_size)
}

export interface MissionDetailResponse extends MissionResponse {
  locations: MissionLocationResponse[]
}

export interface MissionDeleteResponse {
  message: string
  id: number
}

// ─── Mission Location ───────────────────────────────────────────────
export type LocationStatus = 'PENDING' | 'IN_PROGRESS' | 'VISITED' | 'SKIPPED'

export interface MissionLocationResponse {
  id: number
  mission_id: number
  cellular_tower_id: string
  cellular_tower_name: string | null
  latitude: number
  longitude: number
  upload_batch_id: string | null
  sequence_order: number | null
  status: LocationStatus
  distance_from_previous_meters: number | null
  bearing_from_previous_degrees: number | null
  estimated_arrival_time: string | null
  actual_visit_time: string | null
  scan_session_id: number | null
  visited_at: string | null
  created_at: string
  updated_at: string
}

export interface LocationListResponse {
  items: MissionLocationResponse[]
  total: number
  page: number
  page_size: number
  // NOTE: backend does NOT return total_pages for locations — derive
}

export interface UploadRowError {
  row: number
  error: string
}

export interface UploadLocationResponse {
  upload_batch_id: string
  mission_id: number
  total_rows: number
  inserted: number
  updated: number
  skipped: number
  errors: UploadRowError[]
}

export interface DeleteLocationResponse {
  message: string
  id: number
}

export interface BulkDeleteRequest {
  upload_batch_id: string
}

export interface BulkDeleteResponse {
  message: string
  deleted: number
}

// ─── Route / Planner ────────────────────────────────────────────────
export interface RouteItem {
  location_id: number
  sequence_order: number | null
  cellular_tower_id: string
  cellular_tower_name: string | null
  latitude: number
  longitude: number
  status: LocationStatus
  distance_from_previous_meters: number | null
  bearing_from_previous_degrees: number | null
  estimated_arrival_time: string | null
  actual_visit_time: string | null
  scan_session_id: number | null
  visited_at: string | null
}

export interface RouteResponse {
  mission_id: number
  mission_name: string
  status: MissionStatus
  start_location_id: number | null
  total_distance_meters: number
  items: RouteItem[]
}

export interface ReorderItem {
  location_id: number
  sequence_order: number
}
export type ReorderRequest = ReorderItem[]

export interface SkipRequest {
  location_id: number
}

export interface SkipResponse {
  message: string
  location_id: number
}

// ─── Logs ───────────────────────────────────────────────────────────
export interface MissionLogEntry {
  timestamp: string         // ISO 8601 UTC
  event_type: 'STARTING' | 'RUNNING' | 'PAUSED' | 'RESUMED' | 'VISITED' | 'SKIPPED' |
              'STOPPED' | 'COMPLETED' | 'FAILED' | 'GPS_ERROR' | 'SCAN_ERROR' | 'INFO'
  message: string
}

export interface MissionLogResponse {
  items?: MissionLogEntry[]
  logs?: MissionLogEntry[]
  // Backend returns a dict — verify exact shape at integration time
}

// ─── Scan (reused from FE_SPEC.md, but mission-scoped version) ──────
export interface MissionScansListResponse {
  items: ScanResultFlat[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface ScanResultFlat {
  id: number
  scan_session_id: number
  scan_time: string
  tty_port: string
  latitude: number | null
  longitude: number | null
  mission_location_id: number | null   // present (non-null) for mission scans
  created_at: string
  operator_name: string | null
  mcc: string | null
  mnc: string | null
  rat: string | null
  status: string | null
}

export interface PaginatedResponse {
  items: ScanResultFlat[]
  total: number
  page: number
  page_size: number
  total_pages: number
}
```

> **Place all interfaces in `frontend/types/mission.ts`** and import from there.

---

## 7. Services Layer (`services/missionService.ts`)

Per `FE_SPEC.md` §API Rules, components never call `$fetch` directly. Create a dedicated service module:

```ts
// services/missionService.ts
import type {
  MissionCreate, MissionUpdate, MissionResponse, MissionListResponse, MissionDetailResponse,
  MissionLocationResponse, LocationListResponse, UploadLocationResponse, DeleteLocationResponse,
  BulkDeleteResponse, RouteResponse, ReorderRequest, SkipResponse,
  MissionLogResponse,
} from '@/types/mission'
import { useNuxtApp } from '#imports'

const API = '/missions'  // prefix is auto-prepended by $fetch runtime config

export const missionService = {
  list(params?: { page?: number; page_size?: number; status?: string; search?: string }) {
    return $fetch<MissionListResponse>(API, { params })
  },
  get(id: number) {
    return $fetch<MissionDetailResponse>(`${API}/${id}`)
  },
  create(payload: MissionCreate) {
    return $fetch<MissionResponse>(API, { method: 'POST', body: payload })
  },
  update(id: number, payload: MissionUpdate) {
    return $fetch<MissionResponse>(`${API}/${id}`, { method: 'PATCH', body: payload })
  },
  remove(id: number) {
    return $fetch<{ message: string; id: number }>(`${API}/${id}`, { method: 'DELETE' })
  },

  // Locations
  uploadLocations(id: number, file: File) {
    const form = new FormData()
    form.append('file', file)
    return $fetch<UploadLocationResponse>(`${API}/${id}/locations/upload`, { method: 'POST', body: form })
  },
  listLocations(id: number, params?: { page?: number; page_size?: number; search?: string }) {
    return $fetch<LocationListResponse>(`${API}/${id}/locations`, { params })
  },
  getLocation(id: number, locationId: number) {
    return $fetch<MissionLocationResponse>(`${API}/${id}/locations/${locationId}`)
  },
  deleteLocation(id: number, locationId: number) {
    return $fetch<DeleteLocationResponse>(`${API}/${id}/locations/${locationId}`, { method: 'DELETE' })
  },
  bulkDeleteLocations(id: number, uploadBatchId: string) {
    return $fetch<BulkDeleteResponse>(`${API}/${id}/locations/bulk-delete`, {
      method: 'POST',
      body: { upload_batch_id: uploadBatchId },
    })
  },

  // Planning
  plan(id: number) { return $fetch<RouteResponse>(`${API}/${id}/plan`, { method: 'POST' }) },
  getRoute(id: number) { return $fetch<RouteResponse>(`${API}/${id}/route`) },
  reorder(id: number, payload: ReorderRequest) {
    return $fetch<RouteResponse>(`${API}/${id}/route/reorder`, { method: 'POST', body: payload })
  },
  skipLocation(id: number, locationId: number) {
    return $fetch<SkipResponse>(`${API}/${id}/route/skip`, { method: 'POST', body: { location_id: locationId } })
  },

  // Control
  start(id: number) { return $fetch(`${API}/${id}/start`, { method: 'POST' }) },
  pause(id: number) { return $fetch(`${API}/${id}/pause`, { method: 'POST' }) },
  resume(id: number) { return $fetch(`${API}/${id}/resume`, { method: 'POST' }) },
  stop(id: number) { return $fetch(`${API}/${id}/stop`, { method: 'POST' }) },
  status(id: number) { return $fetch(`${API}/${id}/status`) },
  logs(id: number) { return $fetch<MissionLogResponse>(`${API}/${id}/logs`) },

  // Scans
  listScans(id: number, params?: {
    page?: number; page_size?: number; search?: string;
    rat?: string; start_time?: string; end_time?: string; sort?: string
  }) {
    return $fetch<PaginatedResponse>(`${API}/${id}/scans`, { params })
  },
  exportScansUrl(id: number, params?: any) {
    const qs = new URLSearchParams(params as any).toString()
    return `${API}/${id}/scans/export${qs ? '?' + qs : ''}`  // used in <a :href="..." download>
  },
}
```

---

## 8. Map Integration (Route Tab)

Use Leaflet.js (already established by `FE_SPEC.md` and the existing map page). **Do not introduce Google Maps.**

### Map Behavior
- On mount, load `mission_locations` (already in `currentMission.locations`) and place markers colored by `status`:
  - ⚪ gray = PENDING
  - 🔵 blue = IN_PROGRESS
  - 🟢 green = VISITED
  - 🔴 red = SKIPPED
- Draw polyline in `sequence_order` ASC connecting consecutive points.
- Subscribe to `/ws/gps` (existing) to show a blue dot for live GPS position; if GPS is within `radius_meters` of the current target, animate the marker (pulse glow).
- Click marker → open popup with tower ID, name, lat/lon, status, sequence_order, distance_from_previous_meters, scan_session_id link.
- "Fit to route" button resets the map bounds to include all markers.

### Libraries
- `leaflet` (already in package.json presumably)
- `leaflet.markercluster` (optional) for missions with >100 points
- Leaflet CSS imported once in `nuxt.config.ts`

> Reuse the existing map composable `composables/useLeafletMap.ts` if it exists; otherwise create one but follow patterns in `FE_SPEC.md`.

---

## 9. Reordering Modal (Manual Override)

Triggered from Planner tab → "Reorder Sequence" button.

### Modal Layout
```
┌─────────────────────────────────────────────────────────────────────┐
│ Reorder Locations                                          [×]      │
├─────────────────────────────────────────────────────────────────────┤
│ Drag rows to reorder, or enter sequence numbers (1..N).            │
│                                                                     │
│ ┌────┬──────────────────────────────────────────────────┐           │
│ │ ☰  │ Tower: TWR-001 · Lat -6.20 · Lng 106.84         │           │
│ │    │ Sequence: [ 1 ]                                  │           │
│ ├────┼──────────────────────────────────────────────────┤           │
│ │ ☰  │ Tower: TWR-003 · Lat -6.26 · Lng 106.81         │           │
│ │    │ Sequence: [ 2 ]                                  │           │
│ ├────┼──────────────────────────────────────────────────┤           │
│ │ ☰  │ Tower: TWR-002 · Lat -6.22 · Lng 106.82         │           │
│ │    │ Sequence: [ 3 ]                                  │           │
│ └────┴──────────────────────────────────────────────────┘           │
│                                                                     │
│                                       [Cancel]  [Save Order]        │
└─────────────────────────────────────────────────────────────────────┘
```

### Validation
- Sequence numbers must be unique integers from 1 to N (where N = number of mission_locations).
- Show inline error if duplicate or gap detected.

### Save
Convert current order to `ReorderRequest: [{location_id, sequence_order}, …]` and call `missionService.reorder(missionId, payload)`. On success, close modal, refresh Planner and Route tabs.

---

## 10. Error Handling & Toast Notifications

All `$fetch` calls SHALL be wrapped in `try/catch` (or use Nuxt's `useAsyncData` error propagation). Map HTTP statuses to user messages:

| HTTP Code              | Toast Message                                                                  |
|------------------------|--------------------------------------------------------------------------------|
| 409 Conflict           | "Another mission is already running. Please wait or stop it first."           |
| 422 Validation        | Show server-provided errors inline (e.g., per-row CSV errors on upload page)   |
| 404 Not Found          | "Mission not found" / "Location not found"                                    |
| 500 / 502 / 503        | "An unexpected error occurred. Please try again."                              |
| Network error (`fetch`) | "Backend offline. Check connection and retry."                                |
| WebSocket close        | "WebSocket connection lost. Attempting to reconnect…" (silent retry, no spam)  |

Use the existing toast library (Toastify or equivalent) already adopted by the project; do NOT introduce a new one.

---

## 11. Pagination Defaults

| Endpoint                                       | page_size default | max | notes                          |
|------------------------------------------------|-------------------|-----|--------------------------------|
| `GET /missions`                                | 10                | 100 | `total_pages` derived client-side |
| `GET /missions/{id}/locations`                 | 10                | 100 | `total_pages` derived client-side |
| `GET /missions/{id}/scans`                     | 10                | 100 | backend returns `total_pages`     |
| `GET /missions/{id}/logs`                      | n/a               | n/a | single response, no pagination   |
| `GET /missions/{id}/scans/export`              | n/a               | n/a | bulk export, no pagination       |

> **Important:** Backend `MissionListResponse` and `LocationListResponse` do **NOT** include `total_pages`. Frontend MUST derive: `Math.ceil(total / page_size)`.

---

## 12. Environment Variables

**No new environment variables are introduced.** Use the existing `NUXT_PUBLIC_API_BASE` (e.g., `http://localhost:8000/api/v1`). WebSocket URLs are derived from this same base (host portion only).

`NUXT_PUBLIC_API_BASE` is exposed via Nuxt runtime config:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8000/api/v1',
    },
  },
})
```

In services, prefix-relative paths (`$fetch('/missions/...')`) automatically use this base.

---

## 13. Loading States & Skeletons

- All list/grid tables use skeleton loaders while fetching.
- Spinner on buttons during async actions (e.g., Start/Pause/Stop).
- Mission progress bar (`progress_percent` from `MissionResponse`) shown on Detail page Overview tab.
- Map shows subtle "Loading route…" overlay until polyline renders.

---

## 14. Responsive Design

Same grid/table layout as existing pages (per `FE_SPEC.md`). Mobile-friendly: stack tabs vertically on small screens, use collapsible sections for detailed info.

---

## 15. Permissions / Access Control

All mission CRUD actions assume authenticated session (implement auth later if needed). For now, all endpoints are public on LAN. Add CSRF token protection ONLY if backend enables it.

---

## 16. Integration with Existing Components

| Existing Component                   | Usage in Mission Planner Feature                                              |
|--------------------------------------|------------------------------------------------------------------------------|
| `pages/scan.vue`                     | **UNCHANGED.** Mission executor calls scan service directly (no UI involvement). |
| `pages/history.vue`                  | **UNCHANGED.** Mission-scoped scans live under `/missions/{id}/scans`, not on global history page. |
| `composables/useLeafletMap.ts`       | Reuse for Route tab map.                                                     |
| `composables/useMissionWebSocket.ts` | NEW: thin wrapper around `/ws/mission` socket + store.applyEvent.            |
| `services/api.ts` (existing wrapper) | Pass `apiBase` so mission service uses same base as scan/settings.            |
| `stores/toast.ts` (existing)         | Reuse for all toast notifications.                                            |

**No breaking changes** to existing flows.

---

## 17. Testing Checklist (Frontend)

### Mission CRUD
- [ ] Create page accepts valid name + optional fields, returns 201, navigates to upload page
- [ ] Create page rejects empty name (inline + server validation surfaced)
- [ ] Edit page loads current values, partial update works
- [ ] Delete confirmation modal blocks accidental deletion

### List & Filter
- [ ] Mission list renders pagination, status filter (8 statuses + ALL) works
- [ ] Search filters by name/description
- [ ] Singleton warning banner appears when another mission is RUNNING
- [ ] List refreshes after create/delete/start/stop actions

### Locations
- [ ] CSV upload accepts valid file, shows correct summary (inserted/updated/skipped)
- [ ] CSV upload rejects malformed file with 422 inline errors
- [ ] Recent uploads section shows successful batch
- [ ] Location list paginates correctly, search filters towers
- [ ] Single delete works with confirmation
- [ ] Bulk delete by batch removes all rows from same `upload_batch_id`

### Route Planning
- [ ] Generate Plan button computes sequence and updates Route/Planner tabs
- [ ] Manual reorder modal validates unique sequence 1..N
- [ ] Skip button marks a location as SKIPPED in the table and map

### Mission Control
- [ ] Start button is disabled when status !== IDLE/READY
- [ ] 409 conflict shows "another mission running" toast
- [ ] Pause/Resume/Stop swap correctly based on status
- [ ] Stop confirmation modal blocks accidental stop

### Live Updates (WebSocket)
- [ ] Mission status badge updates in real time without page refresh
- [ ] VISITED event increments `visited_locations` and `progress_percent`
- [ ] GPS dot on Route tab updates as `/ws/gps` emits
- [ ] Logs tab streams new entries as events arrive
- [ ] Disconnect triggers exponential backoff reconnect (1s, 2s, 4s, 8s, 16s, max 5 retries)

### Scans Tab
- [ ] Mission scans list paginates correctly with same filters as global history
- [ ] Export downloads `mission_{id}_scans.csv` with current filters applied

### Responsive
- [ ] Tabs stack vertically on viewport <768px
- [ ] Tables remain scrollable on small screens

---

**End of Document.**
