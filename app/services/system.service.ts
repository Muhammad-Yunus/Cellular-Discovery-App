import { healthRequest } from './api'
import type { SystemHealth, CLIStatus } from '~/types'

// Health & CLI-status probes hit the backend's root health endpoint
// (resolved via NUXT_PUBLIC_HEALTH_BASE), not the versioned /api/v1 API.
// This is intentional: the health endpoint may live outside the API
// prefix on the backend, and decoupling it keeps apiBase contract stable
// for every other consumer.
export async function getHealth(): Promise<SystemHealth> {
  return healthRequest<SystemHealth>('/health', {
    method: 'GET'
  })
}

export async function checkCLIStatus(): Promise<CLIStatus> {
  return healthRequest<CLIStatus>('/cli/status', {
    method: 'GET'
  })
}
