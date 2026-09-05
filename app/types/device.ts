export interface SDRStatus {
  type: string
  status: 'active' | 'inactive' | 'error'
  message: string
}

export interface GPSStatus {
  type: string
  status: 'active' | 'inactive' | 'error'
  message: string
  latitude: number | null
  longitude: number | null
  satellites: number | null
}

export interface MachineStatus {
  cpu_percent: number
  memory_total_mb: number
  memory_used_mb: number
  memory_percent: number
  temperature_c: number
  disk_total_gb: number
  disk_used_gb: number
  disk_percent: number
  load_avg_1m: number
  uptime_seconds: number
}

export interface NetworkStatus {
  status: 'online' | 'offline'
  mode: string | null
  ip_address: string
  gateway: string
  dns: string[]
  hostname: string
}

export interface HealthSummary {
  total: number
  active: number
  missing: number
  error: number
}

export interface DeviceMetadata {
  collected_at: string
  collector_version: string
  health_summary: HealthSummary
}

export interface DeviceStatus {
  sdr: SDRStatus
  gps: GPSStatus
  machine: MachineStatus
  network: NetworkStatus
  metadata: DeviceMetadata
}
