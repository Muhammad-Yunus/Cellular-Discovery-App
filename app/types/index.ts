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
  /** Frequency in MHz */
  frequency_mhz?: number | null
  /** E-UTRA Absolute Radio Frequency Channel Number */
  earfcn?: number | null
  /** Physical Cell ID */
  pci?: number | null
  /** Reference Signal Received Power in dBm */
  rsrp?: number | null
  /** Reference Signal Received Quality */
  rsrq?: number | null
  /** Signal-to-Noise Ratio */
  snr?: number | null
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
  operator_name: string
  mcc: string
  mnc: string
  rat: string
  /** Signal strength in dBm (nullable for older records). */
  signal_strength?: number | null
  /** Frequency in MHz (nullable for older records). */
  frequency_mhz?: number | null
  /** E-UTRA Absolute Radio Frequency Channel Number (nullable). */
  earfcn?: number | null
  /** Physical Cell ID (nullable). */
  pci?: number | null
  /** Reference Signal Received Power in dBm (nullable). */
  rsrp?: number | null
  /** Reference Signal Received Quality (nullable). */
  rsrq?: number | null
  /** Signal to Noise Ratio (nullable). */
  snr?: number | null
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

export interface MissionLogPaginated {
  items: MissionLog[]
  total: number
  page: number
  page_size: number
  total_pages: number
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
