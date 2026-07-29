export type ApiErrorType
  = | 'NETWORK_ERROR'
    | 'BACKEND_OFFLINE'
    | 'SCAN_FAILED'
    | 'INVALID_RESPONSE'
    | 'VALIDATION_ERROR'
    | 'NOT_FOUND'
    | 'TIMEOUT'
    | 'UNKNOWN'

export class AppError extends Error {
  type: ApiErrorType
  status?: number

  constructor(type: ApiErrorType, message: string, status?: number) {
    super(message)
    this.name = 'AppError'
    this.type = type
    this.status = status
  }
}

export function parseApiError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error
  }

  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return new AppError('NETWORK_ERROR', 'Unable to connect to server. Please check your connection.')
  }

  if (error instanceof DOMException && error.name === 'AbortError') {
    return new AppError('TIMEOUT', 'Request timed out. Please try again.')
  }

  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>

    if (err.status === 503) {
      return new AppError('BACKEND_OFFLINE', 'Backend server is not responding. Please try again later.', 503)
    }

    if (err.status === 404) {
      return new AppError('NOT_FOUND', 'The requested resource was not found.', 404)
    }

    if (err.status === 422) {
      const detail = (err as { data?: { detail?: string } }).data?.detail || 'Invalid data submitted.'
      return new AppError('VALIDATION_ERROR', detail, 422)
    }

    const detailResult = (err as { data?: { detail?: string } }).data?.detail
    if (detailResult) {
      return new AppError('SCAN_FAILED', detailResult, (err as { status?: number }).status)
    }

    if (typeof (err as { message?: string }).message === 'string') {
      return new AppError('UNKNOWN', (err as { message: string }).message)
    }
  }

  return new AppError('UNKNOWN', 'An unexpected error occurred.')
}
