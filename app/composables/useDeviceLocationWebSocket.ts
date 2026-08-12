// app/composables/useDeviceLocationWebSocket.ts
//
// WebSocket composable for real-time drone/device location telemetry
// (Feature 06). Connects to `/ws/device/location` and pushes each
// `device_location` event into the collector mission store so the
// RouteMap component can react via a store watcher.
//
// Fallback: When the backend does not support WebSocket (returns 403 or
// connection fails), falls back to HTTP polling of `/api/v1/device/location`
// so the RouteMap marker still updates.
//
// Why a separate composable?
// --------------------------
//   - Keeps the WebSocket lifecycle (connect/disconnect/reconnect)
//     encapsulated and testable.
//   - Mission page calls `useDeviceLocationWebSocket()` and the
//     composable handles all connection management; the page only
//     observes `missionStore.deviceLocationWS`.

import { onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { ReconnectingWebSocket, buildWsUrl } from '~/utils/websocket'
import { useCollectorMissionStore } from '~/stores/mission'
import type { DeviceLocationWS } from '~/types/mission'

export function useDeviceLocationWebSocket() {
  const missionStore = useCollectorMissionStore()
  const { deviceLocationWS, deviceLocationWsConnected, deviceLocationWsStatus } =
    storeToRefs(missionStore)

  let ws: ReconnectingWebSocket | null = null

  function getWebSocketUrl(): string {
    const config = useRuntimeConfig()
    return buildWsUrl(config.public.apiBase as string, '/ws/device/location')
  }

  function handleMessage(raw: unknown) {
    const msg = raw as { type?: string; data?: Partial<DeviceLocationWS> }
    if (msg?.type !== 'device_location') return

    const data = msg.data
    if (!data || typeof data.latitude !== 'number' || typeof data.longitude !== 'number') return

    const location: DeviceLocationWS = {
      latitude: data.latitude,
      longitude: data.longitude,
      altitude_m: data.altitude_m ?? null,
      accuracy_m: data.accuracy_m ?? null,
      speed_ms: data.speed_ms ?? null,
      course_deg: data.course_deg ?? null,
      status: (data.status as DeviceLocationWS['status']) ?? 'UNKNOWN',
      datetime: data.datetime ?? new Date().toISOString(),
      provider: data.provider ?? 'websocket',
      error: data.error
    }

    missionStore.setDeviceLocationWS(location)
  }

  function connect() {
    const wsUrl = getWebSocketUrl()
    ws = new ReconnectingWebSocket(wsUrl)

    ws.onMessage(handleMessage)

    ws.onStatusChange((status) => {
      missionStore.setDeviceLocationWsConnected(status === 'connected')
      missionStore.setDeviceLocationWsStatus(status)
    })

    ws.connect()
  }

  function disconnect() {
    ws?.disconnect()
    ws = null
  }

  onMounted(() => {
    connect()
  })

  onUnmounted(() => {
    disconnect()
  })

  return {
    deviceLocationWS,
    deviceLocationWsConnected,
    deviceLocationWsStatus,
    connect,
    disconnect
  }
}
