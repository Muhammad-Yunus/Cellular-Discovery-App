// Module-level override (set via setApiBaseURL). Falls back to runtime config apiBase,
// which resolves from NUXT_PUBLIC_API_BASE at build/dev time. NEVER hardcode host/port
// here — all URLs flow from env vars. Outside Nuxt context we return an empty string
// so callers surface a clear "missing configuration" error rather than silently
// pointing at a developer-localhost URL.
let _baseURLOverride: string | null = null

export function setApiBaseURL(url: string) {
  _baseURLOverride = url
}

export function getBaseURL(): string {
  if (_baseURLOverride) return _baseURLOverride
  try {
    const config = useRuntimeConfig()
    return config.public.apiBase as string
  } catch {
    return ''
  }
}

function resolveBaseURL(): string {
  if (_baseURLOverride) return _baseURLOverride
  try {
    const config = useRuntimeConfig()
    return config.public.apiBase as string
  } catch {
    return ''
  }
}

/**
 * Resolve the base URL for the health endpoint. Health is intentionally
 * separate from the main apiBase: the main API lives under a versioned
 * prefix (e.g. /api/v1) configured via NUXT_PUBLIC_API_BASE, while the
 * health probe may live at the root path (e.g. /health) configured via
 * NUXT_PUBLIC_HEALTH_BASE. Falls back to apiBase when healthBase is
 * not set, so existing deployments keep working.
 */
export function resolveHealthBaseURL(): string {
  try {
    const config = useRuntimeConfig()
    const healthBase = config.public.healthBase as string | undefined
    if (healthBase) return healthBase
    return resolveBaseURL()
  } catch {
    return ''
  }
}

export async function healthRequest<T>(
  endpoint: string,
  options?: RequestInit & { params?: Record<string, string | number | undefined> }
): Promise<T> {
  const baseURL = resolveHealthBaseURL()
  const url = new URL(`${baseURL}${endpoint}`)

  if (options?.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value))
      }
    })
  }

  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string>),
    'Content-Type': 'application/json'
  }

  const { params: _, ...fetchOptions } = options ?? {}
  const response = await $fetch(url.toString(), {
    ...fetchOptions,
    headers,
    retry: false
  })

  return response as T
}

export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit & { params?: Record<string, string | number | undefined> }
): Promise<T> {
  const baseURL = resolveBaseURL()
  const url = new URL(`${baseURL}${endpoint}`)

  if (options?.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value))
      }
    })
  }

  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string>),
    'Content-Type': 'application/json'
  }

  const { params: _, ...fetchOptions } = options ?? {}
  const response = await $fetch(url.toString(), {
    ...fetchOptions,
    headers,
    retry: false
  })

  return response as T
}
