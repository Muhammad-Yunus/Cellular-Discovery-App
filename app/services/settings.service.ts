import { apiRequest } from './api'
import type { Setting } from '~/types'

export async function getSettings(): Promise<Setting[]> {
  return apiRequest<Setting[]>('/settings', {
    method: 'GET'
  })
}

export async function updateSettings(settings: Setting[]): Promise<Setting[]> {
  return apiRequest<Setting[]>('/settings', {
    method: 'PUT',
    body: settings
  })
}
