import { apiRequest } from './api'
import type { ScanResponse, ScanPaginated, ScanCreate, MissionScan, MissionScanPaginated, MissionLog, MissionLogPaginated } from '~/types'

export interface GetScansParams {
  page?: number
  pageSize?: number
  search?:string
  rat?: string // Filter by RAT (e.g., 'LTE', 'NR'); if null or 'ALL', no filter applied
  startDate?: string // ISO datetime string (inclusive lower bound)
  endDate?: string // ISO datetime string (inclusive upper bound)
  sort?: string // e.g., 'scan_time' or '-scan_time' for DESC
}

export async function createScan(data: ScanCreate): Promise<ScanResponse> {
  return apiRequest<ScanResponse>('/scan', {
    method: 'POST',
    body: data
  })
}

export async function getScans(params?: GetScansParams): Promise<ScanPaginated> {
  console.log('[service] getScans called with params:', params)
  return apiRequest<ScanPaginated>('/scans', {
    method: 'GET',
    params: {
      page: params?.page ?? 1,
      page_size: params?.pageSize ?? 10,
      search: params?.search,
      rat: params?.rat && params.rat !== 'ALL' ? params.rat : undefined,
      start_time: params?.startDate || undefined,
      end_time: params?.endDate || undefined,
      sort: params?.sort || undefined
    }
  })
}

export async function getScanById(id: string): Promise<ScanResponse> {
  return apiRequest<ScanResponse>(`/scans/${id}`, {
    method: 'GET'
  })
}

export async function deleteScan(id: string): Promise<undefined> {
  return apiRequest<undefined>(`/scans/${id}`, {
    method: 'DELETE'
  })
}

export interface GetMissionScansParams {
  page?: number
  pageSize?: number
  search?: string
  rat?: string // Filter by RAT (e.g., 'LTE', 'NR'); if null or 'ALL', no filter applied
  startDate?: string // ISO datetime string (inclusive lower bound)
  endDate?: string // ISO datetime string (inclusive upper bound)
  sort?: string // e.g., 'scan_time' or '-scan_time' for DESC
}

export async function getMissionScans(
  missionId: string,
  params?: GetMissionScansParams
): Promise<MissionScanPaginated> {
  return apiRequest<MissionScanPaginated>(`/missions/${missionId}/scans`, {
    method: 'GET',
    params: {
      page: params?.page ?? 1,
      page_size: params?.pageSize ?? 10,
      search: params?.search,
      rat: params?.rat && params.rat !== 'ALL' ? params.rat : undefined,
      start_time: params?.startDate || undefined,
      end_time: params?.endDate || undefined,
      sort: params?.sort || undefined
    }
  })
}

export async function getMissionLogs(
  missionId: string,
  params?: { page?: number; page_size?: number }
): Promise<MissionLogPaginated> {
  const page = params?.page ?? 1
  const pageSize = params?.page_size ?? 10

  // API returns { value: [...], Count: N } format
  // Note: Count is the number of items in this page, not the total count
  // We need to fetch page 1 with max page_size to get the total count
  const result = await apiRequest<{ value: MissionLog[]; Count: number }>(`/missions/${missionId}/logs`, {
    method: 'GET',
    params: {
      page: page,
      page_size: pageSize
    }
  })

  const logs = result.value ?? []

  // If this is page 1 and we got a full page, we need to check if there are more pages
  // by fetching with a larger page_size to get the total count
  let total = logs.length
  if (page === 1 && logs.length === pageSize) {
    try {
      const totalResult = await apiRequest<{ value: MissionLog[]; Count: number }>(`/missions/${missionId}/logs`, {
        method: 'GET',
        params: {
          page: 1,
          page_size: 100
        }
      })
      total = totalResult.Count ?? totalResult.value?.length ?? logs.length
    } catch {
      // Fallback to page length if total count request fails
      total = logs.length
    }
  }

  return {
    items: logs,
    total,
    page,
    page_size: pageSize,
    total_pages: Math.ceil(total / pageSize)
  }
}
