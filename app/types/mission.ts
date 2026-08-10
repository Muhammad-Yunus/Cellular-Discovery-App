// app/types/mission.ts
//
// Type contracts shared by the Mission Planner (UAV mission builder). Each
// interface mirrors the FastAPI payloads documented in
// `backend/app/api/missions.py` so the frontend can rely on a single source of
// truth. Optional fields use `?` to remain compatible with backend responses
// that omit empty values (e.g. unassigned drone, missing metrics).
//
// The lower half of the file (Waypoint / Drone / SurveyArea /
// MissionListResponse / etc.) is the legacy shape used by the drone-driven
// planner UI. The lower-upper section (MissionLocation / MissionWSEvent /
// CSV upload) was added by Feature 02 to support the location-driven,
// mission-collector backend.

// ---------------------------------------------------------------------------
// Feature 02 — Mission domain types (location-based mission collector)
// ---------------------------------------------------------------------------

/**
 * 9-state mission lifecycle (collector backend).
 * Values are UPPERCASE — both API payload and display use the same format.
 *
 * IDLE      → Default saat mission dibuat, belum direncanakan
 * PLANNING  → Sedang dalam proses perencanaan route
 * READY     → Route sudah direncanakan, siap untuk dimulai
 * STARTING  → Mission baru saja dimulai (transisi)
 * RUNNING   → Mission sedang berjalan aktif
 * PAUSED    → Mission dihentikan sementara (pause)
 * COMPLETED → Mission selesai (semua lokasi dikunjungi)
 * STOPPED   → Mission dihentikan secara manual
 * FAILED   → Mission gagal (GPS error, scan error, dll)
 */
export type MissionStatus5
  = | 'IDLE'
    | 'PLANNING'
    | 'READY'
    | 'STARTING'
    | 'RUNNING'
    | 'PAUSED'
    | 'COMPLETED'
    | 'STOPPED'
    | 'FAILED'

/** Human-readable label for each status (same as value — already UPPERCASE). */
export const MISSION_STATUS_LABELS: Record<MissionStatus5, string> = {
  IDLE: 'IDLE',
  PLANNING: 'PLANNING',
  READY: 'READY',
  STARTING: 'STARTING',
  RUNNING: 'RUNNING',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  STOPPED: 'STOPPED',
  FAILED: 'FAILED'
}

/** HTTP-style colour for each status badge. */
export const MISSION_STATUS_COLOR: Record<
  MissionStatus5,
  'default' | 'success' | 'warning' | 'info' | 'error'
> = {
  IDLE: 'default',
  PLANNING: 'info',
  READY: 'info',
  STARTING: 'warning',
  RUNNING: 'success',
  PAUSED: 'warning',
  COMPLETED: 'info',
  STOPPED: 'error',
  FAILED: 'error'
}

// ---------------------------------------------------------------------------
// Location (waypoint) — collector backend
// ---------------------------------------------------------------------------

/** Mission location (waypoint) returned by the collector backend. */
export interface MissionLocation {
  id: string
  mission_id: string
  cellular_tower_id: string
  cellular_tower_name: string
  latitude: number
  longitude: number
  altitude?: number | null
  order_index: number
  /** Planned visit order (1-based). May be null until planning completes. */
  sequence_order?: number | null
  /** Per-location status from the collector backend. */
  status?: 'PENDING' | 'IN_PROGRESS' | 'VISITED' | 'SKIPPED' | 'FAILED' | string
  upload_batch_id?: string | null
  distance_from_previous_meters?: number | null
  bearing_from_previous_degrees?: number | null
  estimated_arrival_time?: string | null
  actual_visit_time?: string | null
  scan_session_id?: string | null
  visited_at?: string | null
  created_at: string
  updated_at: string
}

/**
 * Mission route response from GET /missions/{id}/route.
 * Contains the full ordered itinerary with per-segment distance and bearing.
 */
export interface MissionRoute {
  mission_id: string
  mission_name: string
  status: MissionStatus5
  start_location_id: string | null
  total_distance_meters: number | null
  items: MissionLocation[]
}

/** Payload for creating a new location. */
export interface MissionLocationCreate {
  cellular_tower_id: string
  cellular_tower_name: string
  latitude: number
  longitude: number
  altitude?: number | null
  order_index?: number
}

/** Raw row parsed from a CSV upload before validation. */
export interface MissionLocationUploadRow {
  cellular_tower_id: string
  cellular_tower_name: string
  latitude?: string | number
  longitude?: string | number
}

// ---------------------------------------------------------------------------
// Mission (collector backend shape) — optional count helpers
// ---------------------------------------------------------------------------

/** Mission record returned by the collector backend. */
export interface MissionRecord {
  id: string
  name: string
  status: MissionStatus5
  description?: string | null
  /** ISO-8601 timestamp */
  created_at: string
  /** ISO-8601 timestamp */
  updated_at: string
  /** Number of locations already uploaded */
  location_count?: number
  /** Number of locations already uploaded (alternative field name from backend) */
  total_locations?: number
  /** Number of locations already visited by the collector */
  visited_locations?: number
  /** Mission progress as a percentage (0-100) */
  progress_percent?: number
  /** Number of scans collected */
  scan_count?: number
  /** Search radius in meters (whole number). */
  radius_meters: number
  /** TTY serial port identifier (e.g. "/dev/ttyUSB0"). */
  tty_port: string
  /** Bounding box / center hint (nullable — derived from locations) */
  center_lat?: number | null
  center_lon?: number | null
}

/** Payload for creating a new mission via the collector API. */
export interface MissionRecordCreate {
  name: string
  description?: string | null
  /** Search radius in meters (whole number). */
  radius_meters: number
  /** TTY serial port identifier (e.g. "/dev/ttyUSB0"). */
  tty_port: string
  /** Start at known lat/lon — optional; if omitted mission is draft */
  center_lat?: number | null
  center_lon?: number | null
}

/** Patch payload for partial mission updates. */
export interface MissionRecordUpdate {
  name?: string
  description?: string | null
  status?: MissionStatus5
}

// ---------------------------------------------------------------------------
// Paginated lists (collector backend)
// ---------------------------------------------------------------------------

export interface MissionPaginated {
  items: MissionRecord[]
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
// Query params (collector backend)
// ---------------------------------------------------------------------------

/** Valid sort fields for `/missions` endpoint. `created_at` is the implicit default (sent as `-created_at`). */
export const MISSION_SORT_FIELDS = ['created_at', 'name', 'description'] as const
export type MissionSortField = typeof MISSION_SORT_FIELDS[number]

export interface ListMissionsParams {
  page?: number
  page_size?: number
  search?: string
  status?: MissionStatus5 | 'all'
  /** e.g. 'created_at' or '-created_at' */
  sort?: string
  /** ISO-8601 datetime filter — created_at >= this value */
  start_time?: string
  /** ISO-8601 datetime filter — created_at <= this value */
  end_time?: string
}

export interface ListLocationsParams {
  page?: number
  page_size?: number
  sort?: string
}

// ---------------------------------------------------------------------------
// WebSocket events (live mission feed)
// ---------------------------------------------------------------------------

export type MissionWSAction
  = | 'mission.status_changed'
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

// ---------------------------------------------------------------------------
// Legacy mission / waypoint / drone / survey types below.
// These are used by the existing drone-driven planner UI (pages/missions/*,
// stores/missionStore.ts, services/missionService.ts, components/*).
// ---------------------------------------------------------------------------

/** Available mission lifecycle phases, matching the backend `Mission.status`. */
export type MissionStatus
  = | 'draft'
    | 'planned'
    | 'approved'
    | 'in_progress'
    | 'paused'
    | 'completed'
    | 'failed'
    | 'cancelled'

/** Predefined waypoint action types emitted by the mission engine. */
export type WaypointAction
  = | 'survey'
    | 'scan'
    | 'hover'
    | 'photo'
    | 'video'
    | 'sensor_read'

/** Supported coordinate frames. Currently only WGS84 is implemented. */
export type CoordinateFrame = 'wgs84' | 'utm'

/** Mission-level waypoint geometry. */
export interface Waypoint {
  id: string
  /** Stable index in the mission, 0-based, for ordering. */
  sequence: number
  latitude: number
  longitude: number
  altitude: number
  speed?: number
  /** Seconds the drone should hover after reaching the waypoint. */
  hold_time?: number
  action?: WaypointAction
  notes?: string
  created_at?: string
  updated_at?: string
}

/** Drone registered with the mission backend. */
export interface Drone {
  id: string
  callsign: string
  model: string
  firmware_version?: string
  last_known_latitude?: number
  last_known_longitude?: number
  last_seen_at?: string
  status: 'available' | 'assigned' | 'maintenance' | 'offline'
  notes?: string
}

/** Survey polygon or corridor the mission is collecting data over. */
export interface SurveyArea {
  id: string
  name: string
  /** GeoJSON-style polygon coordinates: [lon, lat] pairs. */
  coordinates: Array<[number, number]>
  area_m2?: number
  notes?: string
}

/** Full mission record returned by the backend. */
export interface Mission {
  id: string
  name: string
  description?: string
  status: MissionStatus
  drone_id?: string | null
  survey_area_id?: string | null
  coordinate_frame: CoordinateFrame
  planned_start_at?: string | null
  planned_end_at?: string | null
  started_at?: string | null
  completed_at?: string | null
  waypoints: Waypoint[]
  survey_area?: SurveyArea
  drone?: Drone
  /** Free-form payload for metrics such as battery, distance, duration. */
  metrics?: Record<string, number>
  created_at: string
  updated_at: string
}

/** Payload for creating a new mission. `id` is assigned by the backend. */
export type MissionCreateInput = Omit<
  Mission,
  | 'id'
  | 'created_at'
  | 'updated_at'
  | 'waypoints'
  | 'survey_area'
  | 'drone'
  | 'metrics'
  | 'started_at'
  | 'completed_at'
> & {
  waypoints?: Array<Omit<Waypoint, 'id' | 'created_at' | 'updated_at'>>
}

/** Patch payload for partial updates – every field optional. */
export type MissionUpdateInput = Partial<
  Omit<Mission, 'id' | 'created_at' | 'updated_at'>
>

/** Input for appending a waypoint to an existing mission. */
export type WaypointCreateInput = Omit<Waypoint, 'id' | 'created_at' | 'updated_at'>

/** Mission list response – mirrors the FastAPI paginated envelope. */
export interface MissionListResponse {
  items: Mission[]
  total: number
  limit: number
  offset: number
}

/** Query parameters accepted by `GET /missions`. */
export interface MissionListQuery {
  /** Page number, 1-based. Defaults to 1. */
  page?: number
  /** Items per page. Defaults to 25. */
  pageSize?: number
  status?: MissionStatus | 'all'
  drone_id?: string
  search?: string
  /** Sort column. Prepend `-` for descending (e.g. `-created_at`). */
  sort?: string
}

/** Device (drone) current location from GET /device/location. */
export interface DeviceLocation {
  latitude: number
  longitude: number
  altitude: number | null
  accuracy: number | null
  speed: number | null
  status: 'UNKNOWN' | 'IDLE' | 'MOVING' | string
  datetime: string
  provider: string
}

/** Patch payload for updating an existing waypoint. */
export type WaypointUpdateInput = Partial<WaypointCreateInput>

/** Single waypoint returned by the backend after creation/update. */
export type WaypointResponse = Waypoint
