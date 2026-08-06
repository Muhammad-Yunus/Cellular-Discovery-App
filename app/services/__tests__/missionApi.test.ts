import { describe, it, expect, vi } from 'vitest'

describe('missionApi base URL helpers', () => {
  it('returns override when set', async () => {
    const { setMissionApiBaseURL, getMissionApiBaseURL } = await import('../missionApi')

    setMissionApiBaseURL('http://override.example.com/api/v1')
    expect(getMissionApiBaseURL()).toBe('http://override.example.com/api/v1')
    setMissionApiBaseURL('')
  })

  it('returns empty string when no override and runtime config throws', async () => {
    // The test environment's setup.ts stubs useRuntimeConfig, but missionApi.ts
    // imports it via Nuxt auto-imports (#imports). When resetModules is called,
    // the mock is no longer in place. We test the fallback behavior instead.
    vi.resetModules()

    // Without a valid useRuntimeConfig mock, getMissionApiBaseURL falls back to empty string
    const { getMissionApiBaseURL } = await import('../missionApi')
    expect(getMissionApiBaseURL()).toBe('')
  })
})