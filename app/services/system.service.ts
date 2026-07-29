import { apiRequest } from './api'
import type { SystemHealth, CLIStatus } from '~/types'

export async function getHealth(): Promise<SystemHealth> {
  return apiRequest<SystemHealth>('/health', {
    method: 'GET'
  })
}

export async function checkCLIStatus(): Promise<CLIStatus> {
  return apiRequest<CLIStatus>('/cli/status', {
    method: 'GET'
  })
}
