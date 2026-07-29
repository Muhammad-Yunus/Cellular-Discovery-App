import { describe, it, expect } from 'vitest'
import { AppError, parseApiError } from '../api'

describe('AppError', () => {
  it('creates error with type and message', () => {
    const error = new AppError('NETWORK_ERROR', 'Connection failed')
    expect(error.type).toBe('NETWORK_ERROR')
    expect(error.message).toBe('Connection failed')
    expect(error.status).toBeUndefined()
  })

  it('creates error with status code', () => {
    const error = new AppError('NOT_FOUND', 'Not found', 404)
    expect(error.status).toBe(404)
  })

  it('is instance of Error', () => {
    const error = new AppError('UNKNOWN', 'test')
    expect(error).toBeInstanceOf(Error)
  })
})

describe('parseApiError', () => {
  it('returns AppError directly', () => {
    const original = new AppError('TIMEOUT', 'timeout')
    const result = parseApiError(original)
    expect(result).toBe(original)
  })

  it('handles network error', () => {
    const error = new TypeError('Failed to fetch')
    const result = parseApiError(error)
    expect(result.type).toBe('NETWORK_ERROR')
    expect(result.status).toBeUndefined()
  })

  it('handles abort error', () => {
    const error = new DOMException('Aborted', 'AbortError')
    const result = parseApiError(error)
    expect(result.type).toBe('TIMEOUT')
  })

  it('handles 503 backend offline', () => {
    const error = { status: 503 }
    const result = parseApiError(error)
    expect(result.type).toBe('BACKEND_OFFLINE')
    expect(result.status).toBe(503)
  })

  it('handles 404 not found', () => {
    const error = { status: 404 }
    const result = parseApiError(error)
    expect(result.type).toBe('NOT_FOUND')
    expect(result.status).toBe(404)
  })

  it('handles 422 validation error', () => {
    const error = { status: 422, data: { detail: 'Invalid field' } }
    const result = parseApiError(error)
    expect(result.type).toBe('VALIDATION_ERROR')
    expect(result.message).toBe('Invalid field')
  })

  it('handles error with detail message', () => {
    const error = { status: 400, data: { detail: 'Scan failed' } }
    const result = parseApiError(error)
    expect(result.type).toBe('SCAN_FAILED')
    expect(result.message).toBe('Scan failed')
  })

  it('handles unknown error with message', () => {
    const error = new Error('Something went wrong')
    const result = parseApiError(error)
    expect(result.type).toBe('UNKNOWN')
  })

  it('returns UNKNOWN for unhandled input', () => {
    const result = parseApiError('string error')
    expect(result.type).toBe('UNKNOWN')
  })

  it('handles null/undefined', () => {
    const result = parseApiError(null)
    expect(result.type).toBe('UNKNOWN')
  })
})
