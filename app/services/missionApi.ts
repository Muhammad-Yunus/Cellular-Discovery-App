// app/services/missionApi.ts
//
// Thin HTTP helper dedicated to the Mission Planner endpoints. It mirrors the
// shape of `app/services/api.ts` but resolves the base URL through the dedicated
// `NUXT_PUBLIC_MISSION_API_BASE` runtime config so the mission backend can be
// deployed on a different origin (or path) than the legacy scan API.
//
// Returns parsed JSON unless `response` is explicitly set to `'blob'` (or
// other non-JSON hints). Throws `AppError` so callers can rely on a single
// error-handling surface.

import { AppError, parseApiError } from '~/types/api'

type Primitive = string | number | boolean
type Params = Record<string, Primitive | null | undefined>

let _baseURLOverride: string | null = null

export function setMissionApiBaseURL(url: string) {
  _baseURLOverride = url
}

export function getMissionApiBaseURL(): string {
  if (_baseURLOverride) return _baseURLOverride
  try {
    const config = useRuntimeConfig()
    return (config.public.missionApiBase as string) || ''
  } catch {
    // Outside Nuxt context (unit tests). Falling back to the same default
    // as the main API keeps `missionApiRequest` usable in isolation.
    return 'http://localhost:8000/api/v1'
  }
}

export interface MissionRequestOptions<TBody = unknown> {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  params?: Params
  headers?: Record<string, string>
  body?: TBody
  /**
   * Override the response handling. Defaults to JSON. When set to `'blob'`
   * the helper returns the raw `Blob` (used by the CSV export endpoint).
   */
  response?: 'json' | 'blob' | 'text' | 'raw'
}

export class MissionApiError extends AppError {
  constructor(type: AppError['type'], message: string, status?: number) {
    super(type, message, status)
    this.name = 'MissionApiError'
  }
}

function buildUrl(endpoint: string, params?: Params): string {
  const base = getMissionApiBaseURL()
  const url = new URL(`${base}${endpoint}`)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') continue
      url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

export async function missionApiRequest<T = unknown>(
  endpoint: string,
  options: MissionRequestOptions = {}
): Promise<T> {
  const { method = 'GET', params, headers, body, response = 'json' } = options
  const url = buildUrl(endpoint, params)

  const finalHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(headers as Record<string, string> | undefined)
  }

  // Body handling: serialise plain objects as JSON, leave FormData untouched.
  let fetchBody: BodyInit | undefined
  if (body instanceof FormData) {
    fetchBody = body
    // Never set Content-Type manually when uploading files – the runtime
    // adds the correct multipart boundary.
    delete finalHeaders['Content-Type']
  } else if (body !== undefined && body !== null) {
    fetchBody = JSON.stringify(body)
    finalHeaders['Content-Type'] = finalHeaders['Content-Type'] ?? 'application/json'
  }

  try {
    const result = await $fetch.raw(url, {
      method,
      headers: finalHeaders,
      body: fetchBody,
      retry: false,
      responseType: response === 'raw' ? 'json' : (response as 'json' | 'blob' | 'text'),
      ignoreResponseError: true
    })

    const status = result.status ?? 0
    if (status >= 400) {
      throw new MissionApiError(
        status === 404 ? 'NOT_FOUND' : status === 503 ? 'BACKEND_OFFLINE' : 'UNKNOWN',
        typeof result._data === 'object' && result._data !== null && 'detail' in (result._data as Record<string, unknown>)
          ? String((result._data as Record<string, unknown>).detail)
          : `Request failed with status ${status}`,
        status
      )
    }

    return result._data as T
  } catch (err) {
    if (err instanceof MissionApiError) throw err
    throw parseApiError(err)
  }
}