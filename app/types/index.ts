export interface ScanCreate {
  operator: string
  mcc: string
  mnc: string
  rat: string
  latitude: number
  longitude: number
  signalStrength?: number
}

export interface ScanSummary {
  id: string
  operator: string
  mcc: string
  mnc: string
  rat: string
  latitude: number
  longitude: number
  scan_time: string
  signal_strength?: number
}

export type ScanResponse = ScanSummary

export interface ScanPaginated {
  items: ScanSummary[]
  total: number
  limit: number
  offset: number
}

export interface Setting {
  id?: string
  key: string
  value: string
  description?: string
}

export interface SystemHealth {
  status: 'ok' | 'unavailable'
  version?: string
  uptime?: number
  timestamp: string
}

export interface CLIStatus {
  status: 'ok' | 'warning' | 'error'
  last_scan_time?: string
  message?: string
}

export interface GPSData {
  latitude: number
  longitude: number
  provider: 'mock' | 'serial' | 'gps'
}

export interface WSEvent {
  event: string
  scan_id?: string
  data?: Record<string, unknown>
}

export interface PaginationMeta {
  currentPage: number
  limit: number
  totalItems: number
  offset: number
  totalPages: number
  searchTerm: string
}
