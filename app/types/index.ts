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

/**
 * Single tower-scan record returned by
 * GET /api/v1/missions/{mission_id}/scans.
 * Mirrors the FastAPI MissionScan response model.
 */
export interface MissionScan {
  id: string
  mission_id: string
  cellular_tower_id: string
  cellular_tower_name: string
  operator: string
  mcc: string
  mnc: string
  rat: string
  /** Signal strength in dBm (nullable for older records). */
  signal_strength?: number | null
  latitude: number
  longitude: number
  /** ISO-8601 timestamp recorded by the collector. */
  scan_time: string
  /** Optional raw payload (e.g. serialised ModemManager result). */
  raw?: Record<string, unknown> | null
}

export interface MissionScanPaginated {
  items: MissionScan[]
  total: number
  limit: number
  offset: number
}

export interface MissionLog {
  timestamp: string
  event_type: string
  message: string
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
