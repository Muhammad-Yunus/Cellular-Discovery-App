# Feature 02 — Mission types (DTOs)

| Field | Value |
|-------|-------|
| **Feature #** | 02 |
| **Title** | Mission domain types (`app/types/mission.ts`) |
| **Depends on** | 01 |
| **Blocks** | 03, 04, 05, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18 |

---

## 1. Objective

Create a dedicated types file for the mission domain so Feature 03 (service), Feature 04 (store), and all pages/components can import cleanly.

---

## 2. Files

### Create
- `app/types/mission.ts`

---

## 3. API

No API calls — this is purely type declarations.

---

## 4. Implementation Steps

### Step 1 — Create `app/types/mission.ts`

```ts
// app/types/mission.ts

/** Mission status values. */
export type MissionStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'

/** Human-readable label for each status. */
export const MISSION_STATUS_LABELS: Record<MissionStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
  cancelled: 'Cancelled'
}

/** HTTP colour for each status badge. */
export const MISSION_STATUS_COLOR: Record<MissionStatus, 'default' | 'success' | 'warning' | 'info' | 'error'> = {
  draft: 'default',
  active: 'success',
  paused: 'warning',
  completed: 'info',
  cancelled: 'error'
}

// ---------------------------------------------------------------------------
// Location (waypoint)
// ---------------------------------------------------------------------------

export interface MissionLocation {
  id: string
  mission_id: string
  latitude: number
  longitude: number
  altitude?: number | null
  order_index: number
  created_at: string
  updated_at: string
}

export interface MissionLocationCreate {
  latitude: number
  longitude: number
  altitude?: number | null
  order_index?: number
}

export interface MissionLocationUploadRow {
  /** Expected columns from the CSV. */
  latitude?: string | number
  longitude?: string | number
  altitude?: string | number
  order?: string | number
}

// ---------------------------------------------------------------------------
// Mission (main entity)
// ---------------------------------------------------------------------------

export interface Mission {
  id: string
  name: string
  status: MissionStatus
  description?: string | null
  /** ISO-8601 timestamp */
  created_at: string
  /** ISO-8601 timestamp */
  updated_at: string
  /** Number of locations already uploaded */
  location_count?: number
  /** Number of scans collected */
  scan_count?: number
  /** Bounding box / center hint (nullable — derived from locations) */
  center_lat?: number | null
  center_lon?: number | null
}

export interface MissionCreate {
  name: string
  description?: string | null
  /** Start at known lat/lon — optional; if omitted mission is draft */
  center_lat?: number | null
  center_lon?: number | null
}

export interface MissionUpdate {
  name?: string
  description?: string | null
  status?: MissionStatus
}

// ---------------------------------------------------------------------------
// Paginated lists
// ---------------------------------------------------------------------------

export interface MissionPaginated {
  items: Mission[]
  total: number
  limit: number
  offset: number
}

export interface LocationPaginated {
  items: MissionLocation[]
  total: number
  limit: number
  offset: number
}

// ---------------------------------------------------------------------------
// Query params
// ---------------------------------------------------------------------------

export interface ListMissionsParams {
  page?: number
  page_size?: number
  search?: string
  status?: MissionStatus | 'all'
  sort?: string // e.g. 'created_at' or '-created_at'
}

export interface ListLocationsParams {
  page?: number
  page_size?: number
  sort?: string
}

// ---------------------------------------------------------------------------
// WebSocket events (live mission feed)
// ---------------------------------------------------------------------------

export type MissionWSAction =
  | 'mission.status_changed'
  | 'mission.location_uploaded'
  | 'mission.scan_collected'
  | 'mission.gps_update'
  | 'mission.log_entry'

export interface MissionWSEvent {
  action: MissionWSAction
  mission_id: string
  data: Record<string, unknown>
  /** ISO-8601 */
  timestamp: string
}

export interface MissionGPSUpdate {
  lat: number
  lon: number
  alt?: number | null
}

export interface MissionLogEntry {
  level: 'info' | 'warn' | 'error'
  message: string
  ts: string
}

// ---------------------------------------------------------------------------
// CSV import validation
// ---------------------------------------------------------------------------

export interface CSVUploadResult {
  total_rows: number
  success_rows: number
  failed_rows: number
  errors: CSVUploadError[]
}

export interface CSVUploadError {
  row: number
  column?: string
  message: string
}
```

---

## 5. Unit Tests (Vitest)

File: `app/types/__tests__/mission.test.ts`

| Test | Assertion |
|------|-----------|
| `MISSION_STATUS_LABELS contains all statuses` | `Object.keys(MISSION_STATUS_LABELS).length === 5` |
| `MISSION_STATUS_COLOR contains all statuses` | `Object.keys(MISSION_STATUS_COLOR).length === 5` |
| `MissionLocationCreate shape is valid` | Instantiate with `{ latitude: -6.2, longitude: 106.8 }` — no TS error |
| `MissionCreate shape is valid` | Instantiate with `{ name: 'Test' }` — no TS error |
| `MissionWSAction is a union literal` | Infer type and assert it has expected members |
| `CSVUploadError is a discriminated-ish shape` | Verify `.row`, `.message` are required fields |

---

## 6. E2E Tests (Playwright)

Not required for this feature (pure type declarations). Feature 08 and 09 will consume these types.

---

## 7. Definition of Done

- [ ] `app/types/mission.ts` exported and no TypeScript errors.
- [ ] Unit tests pass.
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm build` green.
- [ ] Existing scan types in `app/types/index.ts` are untouched.
- [ ] Commit message: `feat(mission-planner): add mission domain types (#02)`

---

## 8. Commit Message

```
feat(mission-planner): add mission domain types (#02)

- Create app/types/mission.ts
- Define Mission, MissionCreate, MissionUpdate, MissionStatus
- Define MissionLocation, MissionLocationCreate
- Define MissionWSEvent, MissionGPSUpdate, MissionLogEntry
- Define CSVUploadResult, CSVUploadError
- Define ListMissionsParams, ListLocationsParams
- Add unit tests for shape validation
```