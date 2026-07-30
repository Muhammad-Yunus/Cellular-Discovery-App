import { apiRequest } from './api'
import type { ScanResponse, ScanPaginated, ScanCreate } from '~/types'

export interface GetScansParams {
  page?: number
  pageSize?: number
  search?: string
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
      search: params?.search
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
