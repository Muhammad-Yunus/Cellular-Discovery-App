/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'

vi.mock('#app/nuxt', () => ({
  useRuntimeConfig: vi.fn(() => ({
    public: {
      appName: 'LTE Scanner',
      apiBase: 'http://localhost:8001/api/v1',
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
  buildWsUrl: vi.fn(() => 'ws://localhost/ws/device/location')
}))

describe('useDeviceLocationWebSocket', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  function createMockStore() {
    return {
      deviceLocationWS: ref(null),
      deviceLocationWsConnected: ref(false),
      deviceLocationWsStatus: ref('disconnected' as const),
      setDeviceLocationWS: vi.fn(),
      setDeviceLocationWsConnected: vi.fn(),
      setDeviceLocationWsStatus: vi.fn()
    }
  }

  it('returns deviceLocationWS, deviceLocationWsConnected, deviceLocationWsStatus refs plus connect/disconnect', async () => {
    const { ReconnectingWebSocket } = await import('~/utils/websocket')
    vi.mocked(ReconnectingWebSocket).mockImplementation(vi.fn().mockReturnValue({
      connect: vi.fn(),
      disconnect: vi.fn(),
      onMessage: vi.fn(),
      onStatusChange: vi.fn()
    } as any))

    const { useCollectorMissionStore } = await import('~/stores/mission')
    vi.mocked(useCollectorMissionStore).mockReturnValue(createMockStore() as any)

    const { useDeviceLocationWebSocket } = await import('../useDeviceLocationWebSocket')
    const result = useDeviceLocationWebSocket()

    expect(result.deviceLocationWS).toBeDefined()
    expect(result.deviceLocationWsConnected).toBeDefined()
    expect(result.deviceLocationWsStatus).toBeDefined()
    expect(result.connect).toBeDefined()
    expect(result.disconnect).toBeDefined()
  })

  it('calls setDeviceLocationWsConnected and setDeviceLocationWsStatus on status change', async () => {
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

    const { useDeviceLocationWebSocket } = await import('../useDeviceLocationWebSocket')
    const { connect } = useDeviceLocationWebSocket()
    connect()

    expect(onStatusChangeMock).toHaveBeenCalledOnce()
    const setStatusCb = onStatusChangeMock.mock.calls[0]?.[0] as (status: string) => void

    setStatusCb('connected')
    expect(mockStore.setDeviceLocationWsConnected).toHaveBeenCalledWith(true)
    expect(mockStore.setDeviceLocationWsStatus).toHaveBeenCalledWith('connected')

    setStatusCb('disconnected')
    expect(mockStore.setDeviceLocationWsConnected).toHaveBeenCalledWith(false)
    expect(mockStore.setDeviceLocationWsStatus).toHaveBeenCalledWith('disconnected')

    setStatusCb('reconnecting')
    expect(mockStore.setDeviceLocationWsConnected).toHaveBeenCalledWith(false)
    expect(mockStore.setDeviceLocationWsStatus).toHaveBeenCalledWith('reconnecting')
  })

  it('calls setDeviceLocationWS with parsed location on device_location event', async () => {
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

    const { useDeviceLocationWebSocket } = await import('../useDeviceLocationWebSocket')
    const { connect } = useDeviceLocationWebSocket()
    connect()

    const onMsgCb = onMessageMock.mock.calls[0]?.[0] as (msg: unknown) => void
    const event = {
      type: 'device_location',
      data: {
        latitude: -6.2088,
        longitude: 106.8456,
        altitude_m: 120.5,
        accuracy_m: 5.2,
        speed_ms: 3.1,
        status: 'MOVING',
        datetime: '2025-01-15T10:00:00Z',
        provider: 'gps'
      }
    }
    onMsgCb(event)

    expect(mockStore.setDeviceLocationWS).toHaveBeenCalledOnce()
    const received = mockStore.setDeviceLocationWS.mock.calls[0]?.[0] as Record<string, unknown>
    expect(received.latitude).toBe(-6.2088)
    expect(received.longitude).toBe(106.8456)
    expect(received.altitude_m).toBe(120.5)
    expect(received.accuracy_m).toBe(5.2)
    expect(received.speed_ms).toBe(3.1)
    expect(received.status).toBe('MOVING')
    expect(received.datetime).toBe('2025-01-15T10:00:00Z')
    expect(received.provider).toBe('gps')
    expect(received.error).toBeUndefined()
  })

  it('includes error field when backend sends error in WS payload', async () => {
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

    const { useDeviceLocationWebSocket } = await import('../useDeviceLocationWebSocket')
    const { connect } = useDeviceLocationWebSocket()
    connect()

    const onMsgCb = onMessageMock.mock.calls[0]?.[0] as (msg: unknown) => void
    const event = {
      type: 'device_location',
      data: {
        latitude: -6.2088,
        longitude: 106.8456,
        status: 'UNKNOWN',
        datetime: '2025-01-15T10:00:00Z',
        provider: 'mock',
        error: 'GPS signal lost'
      }
    }
    onMsgCb(event)

    expect(mockStore.setDeviceLocationWS).toHaveBeenCalledOnce()
    const received = mockStore.setDeviceLocationWS.mock.calls[0]?.[0] as Record<string, unknown>
    expect(received.error).toBe('GPS signal lost')
  })

  it('ignores non-device_location event types', async () => {
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

    const { useDeviceLocationWebSocket } = await import('../useDeviceLocationWebSocket')
    const { connect } = useDeviceLocationWebSocket()
    connect()

    const onMsgCb = onMessageMock.mock.calls[0]?.[0] as (msg: unknown) => void
    onMsgCb({ type: 'system_heartbeat', data: { ok: true } })
    onMsgCb({ type: 'device_beeper', data: { beep: 1 } })

    expect(mockStore.setDeviceLocationWS).not.toHaveBeenCalled()
  })

  it('ignores malformed messages without latitude/longitude', async () => {
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

    const { useDeviceLocationWebSocket } = await import('../useDeviceLocationWebSocket')
    const { connect } = useDeviceLocationWebSocket()
    connect()

    const onMsgCb = onMessageMock.mock.calls[0]?.[0] as (msg: unknown) => void

    // Missing latitude
    onMsgCb({ type: 'device_location', data: { longitude: 106.8 } })
    // Missing longitude
    onMsgCb({ type: 'device_location', data: { latitude: -6.2 } })
    // Empty data
    onMsgCb({ type: 'device_location', data: {} })
    // No type field
    onMsgCb({ data: { latitude: -6.2, longitude: 106.8 } })

    expect(mockStore.setDeviceLocationWS).not.toHaveBeenCalled()
  })

  it('falls back to null for optional numeric fields', async () => {
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

    const { useDeviceLocationWebSocket } = await import('../useDeviceLocationWebSocket')
    const { connect } = useDeviceLocationWebSocket()
    connect()

    const onMsgCb = onMessageMock.mock.calls[0]?.[0] as (msg: unknown) => void
    const event = {
      type: 'device_location',
      data: {
        latitude: -6.2088,
        longitude: 106.8456,
        datetime: '2025-01-15T10:00:00Z'
        // altitude_m, accuracy_m, speed_ms, status, provider all omitted
      }
    }
    onMsgCb(event)

    expect(mockStore.setDeviceLocationWS).toHaveBeenCalledOnce()
    const received = mockStore.setDeviceLocationWS.mock.calls[0]?.[0] as Record<string, unknown>
    expect(received.altitude_m).toBeNull()
    expect(received.accuracy_m).toBeNull()
    expect(received.speed_ms).toBeNull()
    expect(received.status).toBe('UNKNOWN')
    expect(received.provider).toBe('websocket')
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

    const { useDeviceLocationWebSocket } = await import('../useDeviceLocationWebSocket')
    const { connect, disconnect } = useDeviceLocationWebSocket()
    connect()
    disconnect()

    expect(connectMock).toHaveBeenCalled()
    expect(disconnectMock).toHaveBeenCalled()
  })
})
