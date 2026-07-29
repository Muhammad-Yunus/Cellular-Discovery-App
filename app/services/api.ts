let _baseURL = 'http://localhost:8000/api/v1'

export function setApiBaseURL(url: string) {
  _baseURL = url
}

export function getBaseURL(): string {
  return _baseURL
}

export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit & { params?: Record<string, string | number | undefined> }
): Promise<T> {
  const url = new URL(`${_baseURL}${endpoint}`)

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
