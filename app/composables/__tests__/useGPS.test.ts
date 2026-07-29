/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'

vi.mock('~/stores/gpsStore', () => ({
  useGpsStore: vi.fn()
}))

vi.mock('~/utils/websocket', () => ({
  ReconnectingWebSocket: vi.fn(),
  buildWsUrl: vi.fn(() => 'ws://localhost/ws/gps')
}))

describe('useGPS', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  function createMockStore() {
    const store = {
      latitude: ref(-6.150676643667096),
      longitude: ref(106.89665223346297),
      provider: ref(null) as unknown,
      connected: ref(false),
      updatePosition: vi.fn(),
      setProvider: vi.fn(),
      setConnected: vi.fn()
    }
    return store as unknown as ReturnType<typeof import('~/stores/gpsStore')['useGpsStore']>
  }

  it('returns GPS state and actions', async () => {
    const { ReconnectingWebSocket } = await import('~/utils/websocket')
    vi.mocked(ReconnectingWebSocket).mockImplementation(vi.fn().mockReturnValue({
      connect: vi.fn(),
      disconnect: vi.fn(),
      onMessage: vi.fn(),
      onStatusChange: vi.fn()
    }) as any)

    const { useGpsStore } = await import('~/stores/gpsStore')
    vi.mocked(useGpsStore).mockReturnValue(createMockStore())

    const { useGPS } = await import('../useGPS')
    const result = useGPS()

    expect(result.latitude).toBeDefined()
    expect(result.longitude).toBeDefined()
    expect(result.provider).toBeDefined()
    expect(result.connected).toBeDefined()
    expect(result.connect).toBeDefined()
    expect(result.disconnect).toBeDefined()
  })
})
