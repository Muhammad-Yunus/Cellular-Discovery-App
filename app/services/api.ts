// Module-level override (set via setApiBaseURL). Falls back to runtime config apiBase,
// which resolves from NUXT_PUBLIC_API_BASE at build/dev time. NEVER hardcode localhost
// here — that breaks remote backends configured via env vars.
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
    // Outside Nuxt context (e.g. unit tests)
    return 'http://localhost:8000/api/v1'
  }
}

function resolveBaseURL(): string {
  if (_baseURLOverride) return _baseURLOverride
  try {
    const config = useRuntimeConfig()
    return config.public.apiBase as string
  } catch {
    return 'http://localhost:8000/api/v1'
  }
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
