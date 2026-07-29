import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getSettings, updateSettings } from '../settings.service'

const mockApiRequest = vi.hoisted(() => vi.fn())

vi.mock('../api', () => ({
  apiRequest: mockApiRequest
}))

describe('settings.service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getSettings calls GET /settings', async () => {
    const mockSettings = [
      { id: '1', key: 'polling_interval', value: '30', description: 'Polling interval in seconds' }
    ]
    mockApiRequest.mockResolvedValueOnce(mockSettings)

    const result = await getSettings()

    expect(mockApiRequest).toHaveBeenCalledWith('/settings', { method: 'GET' })
    expect(result).toEqual(mockSettings)
  })

  it('updateSettings calls PUT /settings with body', async () => {
    const mockSettings = [
      { id: '1', key: 'polling_interval', value: '60', description: 'Polling interval in seconds' }
    ]
    mockApiRequest.mockResolvedValueOnce(mockSettings)

    const result = await updateSettings(mockSettings)

    expect(mockApiRequest).toHaveBeenCalledWith('/settings', {
      method: 'PUT',
      body: mockSettings
    })
    expect(result).toEqual(mockSettings)
  })

  it('returns empty array when no settings', async () => {
    mockApiRequest.mockResolvedValueOnce([])

    const result = await getSettings()

    expect(result).toEqual([])
  })

  it('handles error on update', async () => {
    mockApiRequest.mockRejectedValueOnce(new Error('Validation failed'))

    await expect(updateSettings([])).rejects.toThrow()
  })
})
