import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'

vi.mock('~/stores/systemStore', () => ({
  useSystemStore: vi.fn()
}))

vi.mock('~/services/system.service', () => ({
  getHealth: vi.fn()
}))

describe('useSystem', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  function createMockStore() {
    return {
      backendStatus: ref('unavailable'),
      cliStatus: ref('unknown'),
      responseTime: ref(null) as unknown,
      lastCheck: ref(null) as unknown,
      error: ref(null) as unknown,
      setHealth: vi.fn(),
      setCLIStatus: vi.fn(),
      setError: vi.fn()
    } as unknown as ReturnType<typeof import('~/stores/systemStore')['useSystemStore']>
  }

  it('returns system state and actions', async () => {
    const { useSystemStore } = await import('~/stores/systemStore')
    vi.mocked(useSystemStore).mockReturnValue(createMockStore())

    const { useSystem } = await import('../useSystem')
    const result = useSystem()

    expect(result.backendStatus).toBeDefined()
    expect(result.cliStatus).toBeDefined()
    expect(result.responseTime).toBeDefined()
    expect(result.checkNow).toBeDefined()
    expect(result.startPolling).toBeDefined()
    expect(result.stopPolling).toBeDefined()
  })

  it('checkNow calls getHealth and updates store on success', async () => {
    const { useSystemStore } = await import('~/stores/systemStore')
    const mockSetHealth = vi.fn()
    const store = createMockStore()
    store.setHealth = mockSetHealth
    vi.mocked(useSystemStore).mockReturnValue(store)

    const { getHealth } = await import('~/services/system.service')
    vi.mocked(getHealth).mockResolvedValueOnce({ status: 'ok', version: '1.0', timestamp: new Date().toISOString() })

    const { useSystem } = await import('../useSystem')
    const result = useSystem()
    await result.checkNow()

    expect(getHealth).toHaveBeenCalled()
    expect(mockSetHealth).toHaveBeenCalledWith('ok', expect.any(Number))
  })
})
