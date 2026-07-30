import { apiRequest } from './api'
import type { ScanResponse, ScanPaginated, ScanCreate } from '~/types'

export interface GetScansParams {
  page?: number
  pageSize?: number
  search?: string
  rat?: string // Filter by RAT (e.g., 'LTE', 'NR'); if null or 'ALL', no filter applied
}

export async function createScan(data: ScanCreate): Promise<ScanResponse> {
  return apiRequest<ScanResponse>('/scan', {
    method: 'POST',
    body: data
  })
}

export async function getScans(params?: GetScansParams): Promise<ScanPaginated> {
  const queryParams: Record<string, unknown> = {
    page: params?.page ?? 1,
    page_size: params?.pageSize ?? 10,
    search: params?.search ?? null
  }

  // Only include rat filter if it's provided AND is NOT 'ALL' or null
  if (params?.rat !== undefined && params?.rat !== '' && params?.rat !== 'ALL') {
    queryParams.rat = params?.rat
  }

  return apiRequest<ScanPaginated>('/scans', {
    method: 'GET',
    params: queryParams
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
