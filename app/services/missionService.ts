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
  SurveyArea
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

/**
 * Execute a state transition on a mission (START / RESUME / PAUSE /
 * COMPLETE / CANCEL). The backend validates the transition and returns the
 * updated mission.
 */
export async function patchMissionStatus(
  id: string,
  action: 'start' | 'resume' | 'pause' | 'complete' | 'cancel'
): Promise<Mission> {
  return missionApiRequest<Mission>(`/missions/${id}/actions/${action}`, {
    method: 'PATCH'
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
