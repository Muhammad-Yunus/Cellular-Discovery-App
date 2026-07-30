import { apiRequest } from './api'
import type { ScanResponse, ScanPaginated, ScanCreate } from '~/types'

export interface GetScansParams {
  page?: number
  pageSize?: number
  search?: string
  rat?: string // Filter by RAT (e.g., 'LTE', 'NR'); if null or 'ALL', no filter applied
  startDate?: string // ISO datetime string (inclusive lower bound)
  endDate?: string // ISO datetime string (inclusive upper bound)
}

export async function createScan(data: ScanCreate): Promise<ScanResponse> {
  return apiRequest<ScanResponse>('/scan', {
    method: 'POST',
    body: data
  })
}

export async function getScans(params?: GetScansParams): Promise<ScanPaginated> {
  return apiRequest<ScanPaginated>('/scans', {
    method: 'GET',
    params: {
      page: params?.page ?? 1,
      page_size: params?.pageSize ?? 10,
      search: params?.search,
      rat: params?.rat && params.rat !== 'ALL' ? params.rat : undefined,
      start_date: params?.startDate || undefined,
      end_date: params?.endDate || undefined
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
