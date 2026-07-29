import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getHealth, checkCLIStatus } from '../system.service'

const mockApiRequest = vi.hoisted(() => vi.fn())

vi.mock('../api', () => ({
  apiRequest: mockApiRequest
}))

describe('system.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getHealth calls GET /health', async () => {
    const mockHealth = { status: 'ok' as const, version: '1.0.0', timestamp: '2024-01-01T00:00:00Z' }
    mockApiRequest.mockResolvedValueOnce(mockHealth)

    const result = await getHealth()

    expect(mockApiRequest).toHaveBeenCalledWith('/health', { method: 'GET' })
    expect(result).toEqual(mockHealth)
  })

  it('getHealth returns unavailable status', async () => {
    const mockHealth = { status: 'unavailable' as const, timestamp: '2024-01-01T00:00:00Z' }
    mockApiRequest.mockResolvedValueOnce(mockHealth)

    const result = await getHealth()

    expect(result.status).toBe('unavailable')
  })

  it('checkCLIStatus calls GET /cli/status', async () => {
    const mockStatus = { status: 'ok' as const, last_scan_time: '2024-01-01T00:00:00Z' }
    mockApiRequest.mockResolvedValueOnce(mockStatus)

    const result = await checkCLIStatus()

    expect(mockApiRequest).toHaveBeenCalledWith('/cli/status', { method: 'GET' })
    expect(result).toEqual(mockStatus)
  })

  it('handles health check failure', async () => {
    mockApiRequest.mockRejectedValueOnce(new Error('Network error'))

    await expect(getHealth()).rejects.toThrow()
  })
})
