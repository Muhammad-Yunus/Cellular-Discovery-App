/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref, computed } from 'vue'

vi.mock('~/stores/scanStore', () => ({
  useScanStore: vi.fn()
}))

vi.mock('~/utils/websocket', () => ({
  ReconnectingWebSocket: vi.fn(),
  buildWsUrl: vi.fn(() => 'ws://localhost/ws/scan')
}))

describe('useScan', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  function createMockStore() {
    const store = {
      scans: ref([]) as unknown,
      selectedScanId: ref(null) as unknown,
      selectedScan: computed(() => null),
      loading: ref(false),
      creating: ref(false),
      error: ref(null) as unknown,
      wsConnected: ref(false),
      pagination: ref({
        currentPage: 1,
        limit: 20,
        totalItems: 0,
        offset: 0,
        totalPages: 0,
        searchTerm: ''
      }),
      fetchScans: vi.fn(),
      createScan: vi.fn(),
      selectScan: vi.fn(),
      deleteScan: vi.fn(),
      setPage: vi.fn(),
      setSearch: vi.fn(),
      setWsConnected: vi.fn()
    }
    return store as unknown as ReturnType<typeof import('~/stores/scanStore')['useScanStore']>
  }

  it('returns scan state and actions', async () => {
    const { ReconnectingWebSocket } = await import('~/utils/websocket')
    vi.mocked(ReconnectingWebSocket).mockImplementation(vi.fn().mockReturnValue({
      connect: vi.fn(),
      disconnect: vi.fn(),
      onMessage: vi.fn(),
      onStatusChange: vi.fn()
    }) as any)

    const { useScanStore } = await import('~/stores/scanStore')
    vi.mocked(useScanStore).mockReturnValue(createMockStore())

    const { useScan } = await import('../useScan')
    const result = useScan()

    expect(result.scans).toBeDefined()
    expect(result.loading).toBeDefined()
    expect(result.fetchScans).toBeDefined()
    expect(result.startScan).toBeDefined()
    expect(result.selectScan).toBeDefined()
    expect(result.removeScan).toBeDefined()
    expect(result.setPage).toBeDefined()
    expect(result.setSearch).toBeDefined()
    expect(result.wsConnected).toBeDefined()
  })

  it('startScan calls createScan on store', async () => {
    const { ReconnectingWebSocket } = await import('~/utils/websocket')
    vi.mocked(ReconnectingWebSocket).mockImplementation(vi.fn().mockReturnValue({
      connect: vi.fn(),
      disconnect: vi.fn(),
      onMessage: vi.fn(),
      onStatusChange: vi.fn()
    }) as any)

    const { useScanStore } = await import('~/stores/scanStore')
    const mockCreateScan = vi.fn().mockResolvedValue({ id: 'new-scan' })
    const store = createMockStore()
    store.createScan = mockCreateScan
    vi.mocked(useScanStore).mockReturnValue(store)

    const { useScan } = await import('../useScan')
    const result = useScan()
    await result.startScan()

    expect(mockCreateScan).toHaveBeenCalled()
  })
})
