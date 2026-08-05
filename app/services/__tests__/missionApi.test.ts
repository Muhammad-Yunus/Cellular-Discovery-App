import { describe, it, expect, vi } from 'vitest'

describe('missionApi base URL helpers', () => {
  it('returns override when set', async () => {
    vi.doMock('#imports', () => ({
      useRuntimeConfig: () => ({ public: { missionApiBase: 'http://config.example.com/api/v1' } })
    }))

    const { setMissionApiBaseURL, getMissionApiBaseURL } = await import('../missionApi')

    setMissionApiBaseURL('http://override.example.com/api/v1')
    expect(getMissionApiBaseURL()).toBe('http://override.example.com/api/v1')
  })
})