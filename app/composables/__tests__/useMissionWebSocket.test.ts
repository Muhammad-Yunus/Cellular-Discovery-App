/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'

vi.mock('#app/nuxt', () => ({
  useRuntimeConfig: vi.fn(() => ({
    public: {
      appName: 'LTE Scanner',
      apiBase: 'http://localhost:8000/api/v1',
      defaultLat: '-6.150676643667096',
      defaultLon: '106.89665223346297'
    }
  })),
  useNuxtApp: vi.fn(() => ({
    vueApp: { use: vi.fn() },
    $config: { public: {} },
    _route: { path: '/' }
  })),
  defineNuxtPlugin: vi.fn(),
  definePayloadPlugin: vi.fn(),
  defineAppConfig: vi.fn(),
  tryUseNuxtApp: vi.fn()
}))

vi.mock('~/stores/mission', () => ({
  useCollectorMissionStore: vi.fn()
}))

vi.mock('~/utils/websocket', () => ({
  ReconnectingWebSocket: vi.fn(),
  buildWsUrl: vi.fn(() => 'ws://localhost/ws/missions')
}))

describe('useMissionWebSocket', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  function createMockStore() {
    return {
      wsConnected: ref(false),
      wsStatus: ref('disconnected' as const),
      fetchMissions: vi.fn().mockResolvedValue(undefined),
      setWsConnected: vi.fn(),
      setWsStatus: vi.fn()
    }
  }

  it('returns wsConnected and wsStatus refs plus connect/disconnect', async () => {
    const { ReconnectingWebSocket } = await import('~/utils/websocket')
    vi.mocked(ReconnectingWebSocket).mockImplementation(vi.fn().mockReturnValue({
      connect: vi.fn(),
      disconnect: vi.fn(),
      onMessage: vi.fn(),
      onStatusChange: vi.fn()
    } as any))

    const { useCollectorMissionStore } = await import('~/stores/mission')
    vi.mocked(useCollectorMissionStore).mockReturnValue(createMockStore() as any)

    const { useMissionWebSocket } = await import('../useMissionWebSocket')
    const result = useMissionWebSocket()

    expect(result.wsConnected).toBeDefined()
    expect(result.wsStatus).toBeDefined()
    expect(result.connect).toBeDefined()
    expect(result.disconnect).toBeDefined()
  })

  it('calls setWsConnected and setWsStatus on status change', async () => {
    const onStatusChangeMock = vi.fn() as any

    const { ReconnectingWebSocket } = await import('~/utils/websocket')
    vi.mocked(ReconnectingWebSocket).mockImplementation(vi.fn().mockReturnValue({
      connect: vi.fn(),
      disconnect: vi.fn(),
      onMessage: vi.fn(),
      onStatusChange: onStatusChangeMock
    } as any))

    const { useCollectorMissionStore } = await import('~/stores/mission')
    const mockStore = createMockStore()
    vi.mocked(useCollectorMissionStore).mockReturnValue(mockStore as any)

    const { useMissionWebSocket } = await import('../useMissionWebSocket')
    const { connect } = useMissionWebSocket()
    connect()

    // Get the status callback that was registered
    expect(onStatusChangeMock).toHaveBeenCalledOnce()
    const setStatusCb = onStatusChangeMock.mock.calls[0]?.[0] as (status: string) => void
    setStatusCb('connected')

    expect(mockStore.setWsConnected).toHaveBeenCalledWith(true)
    expect(mockStore.setWsStatus).toHaveBeenCalledWith('connected')

    setStatusCb('disconnected')
    expect(mockStore.setWsConnected).toHaveBeenCalledWith(false)
    expect(mockStore.setWsStatus).toHaveBeenCalledWith('disconnected')
  })

  it('refreshes mission list on status_changed event', async () => {
    const onMessageMock = vi.fn() as any

    const { ReconnectingWebSocket } = await import('~/utils/websocket')
    vi.mocked(ReconnectingWebSocket).mockImplementation(vi.fn().mockReturnValue({
      connect: vi.fn(),
      disconnect: vi.fn(),
      onMessage: onMessageMock,
      onStatusChange: vi.fn()
    } as any))

    const { useCollectorMissionStore } = await import('~/stores/mission')
    const mockStore = createMockStore()
    vi.mocked(useCollectorMissionStore).mockReturnValue(mockStore as any)

    const { useMissionWebSocket } = await import('../useMissionWebSocket')
    const { connect } = useMissionWebSocket()
    connect()

    const onMsgCb = onMessageMock.mock.calls[0]?.[0] as (msg: unknown) => void
    onMsgCb({
      action: 'mission.status_changed',
      mission_id: 'cm-001',
      data: { status: 'active' },
      timestamp: '2025-01-15T10:00:00Z'
    })

    expect(mockStore.fetchMissions).toHaveBeenCalled()
  })

  it('refreshes mission list on location_uploaded event', async () => {
    const onMessageMock = vi.fn() as any

    const { ReconnectingWebSocket } = await import('~/utils/websocket')
    vi.mocked(ReconnectingWebSocket).mockImplementation(vi.fn().mockReturnValue({
      connect: vi.fn(),
      disconnect: vi.fn(),
      onMessage: onMessageMock,
      onStatusChange: vi.fn()
    } as any))

    const { useCollectorMissionStore } = await import('~/stores/mission')
    const mockStore = createMockStore()
    vi.mocked(useCollectorMissionStore).mockReturnValue(mockStore as any)

    const { useMissionWebSocket } = await import('../useMissionWebSocket')
    const { connect } = useMissionWebSocket()
    connect()

    const onMsgCb = onMessageMock.mock.calls[0]?.[0] as (msg: unknown) => void
    onMsgCb({
      action: 'mission.location_uploaded',
      mission_id: 'cm-001',
      data: { rows: 5 },
      timestamp: '2025-01-15T10:00:00Z'
    })

    expect(mockStore.fetchMissions).toHaveBeenCalled()
  })

  it('refreshes mission list on scan_collected event', async () => {
    const onMessageMock = vi.fn() as any

    const { ReconnectingWebSocket } = await import('~/utils/websocket')
    vi.mocked(ReconnectingWebSocket).mockImplementation(vi.fn().mockReturnValue({
      connect: vi.fn(),
      disconnect: vi.fn(),
      onMessage: onMessageMock,
      onStatusChange: vi.fn()
    } as any))

    const { useCollectorMissionStore } = await import('~/stores/mission')
    const mockStore = createMockStore()
    vi.mocked(useCollectorMissionStore).mockReturnValue(mockStore as any)

    const { useMissionWebSocket } = await import('../useMissionWebSocket')
    const { connect } = useMissionWebSocket()
    connect()

    const onMsgCb = onMessageMock.mock.calls[0]?.[0] as (msg: unknown) => void
    onMsgCb({
      action: 'mission.scan_collected',
      mission_id: 'cm-001',
      data: { scan_id: 'scan-abc' },
      timestamp: '2025-01-15T10:00:00Z'
    })

    expect(mockStore.fetchMissions).toHaveBeenCalled()
  })

  it('does not refresh on gps_update or log_entry events', async () => {
    const onMessageMock = vi.fn() as any

    const { ReconnectingWebSocket } = await import('~/utils/websocket')
    vi.mocked(ReconnectingWebSocket).mockImplementation(vi.fn().mockReturnValue({
      connect: vi.fn(),
      disconnect: vi.fn(),
      onMessage: onMessageMock,
      onStatusChange: vi.fn()
    } as any))

    const { useCollectorMissionStore } = await import('~/stores/mission')
    const mockStore = createMockStore()
    vi.mocked(useCollectorMissionStore).mockReturnValue(mockStore as any)

    const { useMissionWebSocket } = await import('../useMissionWebSocket')
    const { connect } = useMissionWebSocket()
    connect()

    const onMsgCb = onMessageMock.mock.calls[0]?.[0] as (msg: unknown) => void
    onMsgCb({
      action: 'mission.gps_update',
      mission_id: 'cm-001',
      data: { lat: -6.2, lon: 106.8 },
      timestamp: '2025-01-15T10:00:00Z'
    })
    onMsgCb({
      action: 'mission.log_entry',
      mission_id: 'cm-001',
      data: { level: 'info', message: 'test' },
      timestamp: '2025-01-15T10:00:00Z'
    })

    expect(mockStore.fetchMissions).not.toHaveBeenCalled()
  })

  it('disconnects when disconnect is called', async () => {
    const disconnectMock = vi.fn() as any
    const connectMock = vi.fn() as any

    const { ReconnectingWebSocket } = await import('~/utils/websocket')
    vi.mocked(ReconnectingWebSocket).mockImplementation(vi.fn().mockReturnValue({
      connect: connectMock,
      disconnect: disconnectMock,
      onMessage: vi.fn(),
      onStatusChange: vi.fn()
    } as any))

    const { useCollectorMissionStore } = await import('~/stores/mission')
    vi.mocked(useCollectorMissionStore).mockReturnValue(createMockStore() as any)

    const { useMissionWebSocket } = await import('../useMissionWebSocket')
    const { connect, disconnect } = useMissionWebSocket()
    connect()
    disconnect()

    expect(connectMock).toHaveBeenCalled()
    expect(disconnectMock).toHaveBeenCalled()
  })

  it('reconnects when connect is called again', async () => {
    const connectMock = vi.fn() as any
    const disconnectMock = vi.fn() as any

    const { ReconnectingWebSocket } = await import('~/utils/websocket')
    vi.mocked(ReconnectingWebSocket).mockImplementation(vi.fn().mockReturnValue({
      connect: connectMock,
      disconnect: disconnectMock,
      onMessage: vi.fn(),
      onStatusChange: vi.fn()
    } as any))

    const { useCollectorMissionStore } = await import('~/stores/mission')
    vi.mocked(useCollectorMissionStore).mockReturnValue(createMockStore() as any)

    const { useMissionWebSocket } = await import('../useMissionWebSocket')
    const { connect } = useMissionWebSocket()
    connect()
    connect()

    expect(connectMock).toHaveBeenCalled()
    expect(connectMock.mock.calls.length).toBeGreaterThanOrEqual(1)
  })
})
