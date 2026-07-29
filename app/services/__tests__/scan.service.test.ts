import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createScan, getScans, getScanById, deleteScan } from '../scan.service'

const mockApiRequest = vi.hoisted(() => vi.fn())

vi.mock('../api', () => ({
  apiRequest: mockApiRequest
}))

describe('scan.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('createScan calls POST /scan with body', async () => {
    const mockData = { operator: 'Test', mcc: '123', mnc: '456', rat: 'LTE', latitude: 0, longitude: 0 }
    const mockResponse = { id: '1', ...mockData, scan_time: '2024-01-01T00:00:00Z' }
    mockApiRequest.mockResolvedValueOnce(mockResponse)

    const result = await createScan(mockData)

    expect(mockApiRequest).toHaveBeenCalledWith('/scan', {
      method: 'POST',
      body: mockData
    })
    expect(result).toEqual(mockResponse)
  })

  it('getScans calls GET /scans with params', async () => {
    const mockResponse = { items: [], total: 0, limit: 20, offset: 0 }
    mockApiRequest.mockResolvedValueOnce(mockResponse)

    const result = await getScans({ limit: 10, offset: 5, search: 'test' })

    expect(mockApiRequest).toHaveBeenCalledWith('/scans', {
      method: 'GET',
      params: { limit: 10, offset: 5, search: 'test' }
    })
    expect(result).toEqual(mockResponse)
  })

  it('getScans uses defaults when no params given', async () => {
    const mockResponse = { items: [], total: 0, limit: 20, offset: 0 }
    mockApiRequest.mockResolvedValueOnce(mockResponse)

    await getScans()

    expect(mockApiRequest).toHaveBeenCalledWith('/scans', {
      method: 'GET',
      params: { limit: 20, offset: 0, search: undefined }
    })
  })

  it('getScanById calls GET /scans/{id}', async () => {
    const mockResponse = { id: 'abc-123', operator: 'Test', mcc: '123', mnc: '456', rat: 'LTE', latitude: 0, longitude: 0, scan_time: '2024-01-01T00:00:00Z' }
    mockApiRequest.mockResolvedValueOnce(mockResponse)

    const result = await getScanById('abc-123')

    expect(mockApiRequest).toHaveBeenCalledWith('/scans/abc-123', { method: 'GET' })
    expect(result).toEqual(mockResponse)
  })

  it('deleteScan calls DELETE /scans/{id}', async () => {
    mockApiRequest.mockResolvedValueOnce(undefined)

    await deleteScan('abc-123')

    expect(mockApiRequest).toHaveBeenCalledWith('/scans/abc-123', { method: 'DELETE' })
  })

  it('handles error when scan not found', async () => {
    mockApiRequest.mockRejectedValueOnce(new Error('Not found'))

    await expect(getScanById('non-existent')).rejects.toThrow()
  })
})
