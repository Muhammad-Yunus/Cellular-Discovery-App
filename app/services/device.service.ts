import { apiRequest } from './api'
import type { DeviceStatus } from '~/types/device'

export async function getDeviceStatus(): Promise<DeviceStatus> {
  return apiRequest<DeviceStatus>('/device/status', { method: 'GET' })
}
