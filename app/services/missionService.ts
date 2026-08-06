// app/services/missionService.ts
//
// Service layer for the Mission Planner API. Each exported function maps
// directly to a FastAPI endpoint defined in `backend/app/api/missions.py`.
// All HTTP calls go through `missionApiRequest` (from `missionApi.ts`) so
// the `NUXT_PUBLIC_MISSION_API_BASE` config is respected and errors are
// normalised to the shared `AppError` / `MissionApiError` types.

import { missionApiRequest } from './missionApi'
import type {
  Mission,
  MissionListQuery,
  MissionListResponse,
  MissionCreateInput,
  MissionUpdateInput,
  WaypointCreateInput,
  WaypointUpdateInput,
  WaypointResponse,
  Drone,
  SurveyArea,
  // Collector backend (Feature 02+) types
  MissionRecord,
  MissionRecordCreate,
  MissionRecordUpdate,
  MissionLocation,
  MissionLocationCreate,
  LocationPaginated,
  MissionPaginated,
  ListMissionsParams,
  ListLocationsParams,
  CSVUploadResult
} from '~/types/mission'

// ─────────────────────────────────────────────────────────────────────────────
// Missions
// ──────────────────────────────────────────────────────────���──────────────────

/**
 * List missions with optional filtering, search, sorting and pagination.
 * Defaults mirror the backend (`page=1`, `page_size=25`, `status=all`).
 */
export async function listMissions(
  params: MissionListQuery = {}
): Promise<MissionListResponse> {
  return missionApiRequest<MissionListResponse>('/missions', {
    params: {
      page: params.page ?? 1,
      page_size: params.pageSize ?? 25,
      ...(params.status && params.status !== 'all' ? { status: params.status } : {}),
      ...(params.drone_id ? { drone_id: params.drone_id } : {}),
      ...(params.search ? { search: params.search } : {}),
      ...(params.sort ? { sort: params.sort } : {})
    }
  })
}

/** Fetch a single mission by UUID. */
export async function getMissionById(id: string): Promise<Mission> {
  return missionApiRequest<Mission>(`/missions/${id}`)
}

/**
 * Create a new mission. The backend assigns the id and timestamps.
 * Optional waypoints (without ids) are accepted and persisted in order.
 */
export async function createMission(
  data: MissionCreateInput
): Promise<Mission> {
  return missionApiRequest<Mission>('/missions', {
    method: 'POST',
    body: data
  })
}

/**
 * Partially update a mission (PATCH). Only fields present in `data` are
 * written – missing keys are ignored by the backend.
 */
export async function updateMission(
  id: string,
  data: MissionUpdateInput
): Promise<Mission> {
  return missionApiRequest<Mission>(`/missions/${id}`, {
    method: 'PATCH',
    body: data
  })
}

/** Delete a mission. Returns `undefined`. */
export async function deleteMission(id: string): Promise<undefined> {
  return missionApiRequest<undefined>(`/missions/${id}`, {
    method: 'DELETE'
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Waypoints
// ───────────────────────────────────────────────��─────────────────────────────

/** Create a waypoint and append it to the given mission. */
export async function createWaypoint(
  missionId: string,
  data: WaypointCreateInput
): Promise<WaypointResponse> {
  return missionApiRequest<WaypointResponse>(`/missions/${missionId}/waypoints`, {
    method: 'POST',
    body: data
  })
}

/** Retrieve a single waypoint by (missionId, waypointId). */
export async function getWaypoint(
  missionId: string,
  waypointId: string
): Promise<WaypointResponse> {
  return missionApiRequest<WaypointResponse>(
    `/missions/${missionId}/waypoints/${waypointId}`
  )
}

/**
 * Partially update a waypoint (PATCH). Returns the updated waypoint record.
 */
export async function updateWaypoint(
  missionId: string,
  waypointId: string,
  data: WaypointUpdateInput
): Promise<WaypointResponse> {
  return missionApiRequest<WaypointResponse>(
    `/missions/${missionId}/waypoints/${waypointId}`,
    { method: 'PATCH', body: data }
  )
}

/** Delete a single waypoint from a mission. */
export async function deleteWaypoint(
  missionId: string,
  waypointId: string
): Promise<undefined> {
  return missionApiRequest<undefined>(
    `/missions/${missionId}/waypoints/${waypointId}`,
    { method: 'DELETE' }
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Drones
// ─────────────────────────────────────────────────────────────────────────────

/** List drones with optional filtering and pagination. */
export async function listDrones(
  params?: { page?: number, pageSize?: number, search?: string, status?: string }
): Promise<{ items: Drone[], total: number, limit: number, offset: number }> {
  return missionApiRequest<{ items: Drone[], total: number, limit: number, offset: number }>(
    '/drones',
    {
      params: {
        page: params?.page ?? 1,
        page_size: params?.pageSize ?? 25,
        ...(params?.search ? { search: params.search } : {}),
        ...(params?.status ? { status: params.status } : {})
      }
    }
  )
}

/** Fetch a single drone by UUID. */
export async function getDroneById(id: string): Promise<Drone> {
  return missionApiRequest<Drone>(`/drones/${id}`)
}

// ─────────��───────────────────────────────────────────────────────────────────
// Survey Areas
// ─────────────────────────────────────────────────────────────────────────────

/** List survey areas with optional filtering. */
export async function listSurveyAreas(
  params?: { page?: number, pageSize?: number, search?: string }
): Promise<{ items: SurveyArea[], total: number, limit: number, offset: number }> {
  return missionApiRequest<{ items: SurveyArea[], total: number, limit: number, offset: number }>(
    '/survey-areas',
    {
      params: {
        page: params?.page ?? 1,
        page_size: params?.pageSize ?? 25,
        ...(params?.search ? { search: params.search } : {})
      }
    }
  )
}

/** Fetch a single survey area by UUID. */
export async function getSurveyAreaById(id: string): Promise<SurveyArea> {
  return missionApiRequest<SurveyArea>(`/survey-areas/${id}`)
}

// ──────────────────────────────────────────────��──────────────────────────────
// Telemetry & Logs
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Download a telemetry CSV for the given mission. Returns a `Blob` so the
 * caller can trigger a file download directly in the browser.
 */
export async function exportTelemetryCsv(missionId: string): Promise<Blob> {
  return missionApiRequest<Blob>(
    `/missions/${missionId}/telemetry`,
    { response: 'blob' }
  )
}

/**
 * Download a PDF mission summary report. Returns a `Blob`.
 */
export async function exportMissionReportPdf(missionId: string): Promise<Blob> {
  return missionApiRequest<Blob>(
    `/missions/${missionId}/report`,
    { response: 'blob' }
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Mission Commands (GET/SET)
// ─────────────────────────────────────────────────────────────────────────────

export interface MissionCommandResult {
  status: string
  timestamp: string
  data?: unknown
}

/**
 * Execute a GET or SET command on the mission at runtime.
 * This maps to the `/missions/{id}/command` endpoint.
 */
export async function runMissionCommand(
  missionId: string,
  commandType: 'GET' | 'SET',
  payload?: unknown
): Promise<MissionCommandResult> {
  return missionApiRequest<MissionCommandResult>(
    `/missions/${missionId}/command`,
    {
      method: 'POST',
      body: { type: commandType, ...(payload ? { payload } : {}) }
    }
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MissionRecord / MissionLocation — location-based mission planner
// ─────────────────────────────────────────────────────────────────────────────
//
// These endpoints power the **location-based** mission planner UI described
// in `NewEpic/NEW_FEATURE_*`. They live alongside the legacy drone-driven
// endpoints above so both the existing pages/missions/* UI and the future
// NewEpic UI can coexist. The backend uses a simplified 5-state lifecycle
// (`MissionStatus5`) and exposes locations as first-class rows rather than
// embedded waypoints.

/**
 * List missions (`/missions`) with optional pagination, search, status
 * filter, and sort.
 */
export async function listCollectorMissions(
  params: ListMissionsParams = {}
): Promise<MissionPaginated> {
  return missionApiRequest<MissionPaginated>('/missions', {
    params: {
      page: params.page ?? 1,
      page_size: params.page_size ?? 10,
      ...(params.search ? { search: params.search } : {}),
      ...(params.status && params.status !== 'all' ? { status: params.status } : {}),
      ...(params.sort ? { sort: params.sort } : {})
    }
  })
}

/** Fetch a single mission by UUID. */
export async function getCollectorMission(id: string): Promise<MissionRecord> {
  return missionApiRequest<MissionRecord>(`/missions/${id}`)
}

/**
 * Create a new mission. The backend assigns the id and timestamps; the
 * response mirrors `MissionRecord`.
 */
export async function createCollectorMission(
  data: MissionRecordCreate
): Promise<MissionRecord> {
  return missionApiRequest<MissionRecord>('/missions', {
    method: 'POST',
    body: data
  })
}

/** Patch an existing mission. */
export async function updateCollectorMission(
  id: string,
  data: MissionRecordUpdate
): Promise<MissionRecord> {
  return missionApiRequest<MissionRecord>(`/missions/${id}`, {
    method: 'PATCH',
    body: data
  })
}

/** Delete a mission. Returns `undefined`. */
export async function deleteCollectorMission(id: string): Promise<undefined> {
  return missionApiRequest<undefined>(`/missions/${id}`, {
    method: 'DELETE'
  })
}

/**
 * Lifecycle actions on a mission. Maps to dedicated endpoints:
 *   POST /missions/{id}/start    (allowed from IDLE, READY, STOPPED, FAILED)
 *   POST /missions/{id}/pause    (allowed from RUNNING)
 *   POST /missions/{id}/resume   (allowed from PAUSED)
 *   POST /missions/{id}/stop     (allowed from STARTING, RUNNING, PAUSED)
 */
export async function startCollectorMission(id: string): Promise<MissionRecord> {
  return missionApiRequest<MissionRecord>(
    `/missions/${id}/start`,
    { method: 'POST' }
  )
}

export async function pauseCollectorMission(id: string): Promise<MissionRecord> {
  return missionApiRequest<MissionRecord>(
    `/missions/${id}/pause`,
    { method: 'POST' }
  )
}

export async function resumeCollectorMission(id: string): Promise<MissionRecord> {
  return missionApiRequest<MissionRecord>(
    `/missions/${id}/resume`,
    { method: 'POST' }
  )
}

export async function stopCollectorMission(id: string): Promise<MissionRecord> {
  return missionApiRequest<MissionRecord>(
    `/missions/${id}/stop`,
    { method: 'POST' }
  )
}

/** Map an action name to its dedicated endpoint. Helper used by the store. */
export async function collectorMissionAction(
  id: string,
  action: 'start' | 'pause' | 'resume' | 'stop'
): Promise<MissionRecord> {
  switch (action) {
    case 'start':
      return startCollectorMission(id)
    case 'pause':
      return pauseCollectorMission(id)
    case 'resume':
      return resumeCollectorMission(id)
    case 'stop':
      return stopCollectorMission(id)
    default: {
      const exhaustive: never = action
      throw new Error(`Unknown collector mission action: ${exhaustive as string}`)
    }
  }
}

// ── MissionLocation endpoints ───────────────────────────────────────────────

/**
 * List locations belonging to a mission with optional pagination/sort.
 */
export async function listLocations(
  missionId: string,
  params: ListLocationsParams = {}
): Promise<LocationPaginated> {
  return missionApiRequest<LocationPaginated>(
    `/missions/${missionId}/locations`,
    {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? 20,
        ...(params.sort ? { sort: params.sort } : {})
      }
    }
  )
}

/** Create a single location for a mission. */
export async function createLocation(
  missionId: string,
  data: MissionLocationCreate
): Promise<MissionLocation> {
  return missionApiRequest<MissionLocation>(
    `/missions/${missionId}/locations`,
    { method: 'POST', body: data }
  )
}

/** Delete a single location from a mission. */
export async function deleteLocation(
  missionId: string,
  locationId: string
): Promise<undefined> {
  return missionApiRequest<undefined>(
    `/missions/${missionId}/locations/${locationId}`,
    { method: 'DELETE' }
  )
}

/**
 * Upload a CSV file containing a batch of locations. The backend returns a
 * `CSVUploadResult` describing successes/failures per row.
 */
export async function uploadLocationsCSV(
  missionId: string,
  file: File
): Promise<CSVUploadResult> {
  const form = new FormData()
  form.append('file', file)
  return missionApiRequest<CSVUploadResult>(
    `/missions/${missionId}/locations/upload`,
    { method: 'POST', body: form }
  )
}
