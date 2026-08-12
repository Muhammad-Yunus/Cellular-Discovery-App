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

const POLL_INTERVAL_MS = 3000
const MAX_POLL_RECONNECT_WAIT = 30000

export function useDeviceLocationWebSocket() {
  const missionStore = useCollectorMissionStore()
  const { deviceLocationWS, deviceLocationWsConnected, deviceLocationWsStatus } =
    storeToRefs(missionStore)

  let ws: ReconnectingWebSocket | null = null
  let pollTimer: ReturnType<typeof setTimeout> | null = null
  let isPolling = false
  let pollRetryCount = 0

  function getWebSocketUrl(): string {
    const config = useRuntimeConfig()
    return buildWsUrl(config.public.apiBase as string, '/ws/device/location')
  }

  function getHttpEndpoint(): string {
    const config = useRuntimeConfig()
    const apiBase = config.public.apiBase as string
    // Strip trailing slash and ensure path is clean
    const base = apiBase.replace(/\/+$/, '')
    return `${base}/device/location`
  }

  function pollDeviceLocation() {
    const url = getHttpEndpoint()
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data: { latitude: number; longitude: number; [key: string]: unknown }) => {
        // Reset poll retry on successful response
        pollRetryCount = 0
        const location: DeviceLocationWS = {
          latitude: data.latitude,
          longitude: data.longitude,
          altitude_m: data.altitude ?? null,
          accuracy_m: data.accuracy ?? null,
          speed_ms: data.speed ?? null,
          course_deg: data.course_deg ?? null,
          status: (data.status as DeviceLocationWS['status']) ?? 'UNKNOWN',
          datetime: data.datetime ?? new Date().toISOString(),
          provider: data.provider ?? 'http-poll',
        }
        missionStore.setDeviceLocationWS(location)
        if (isPolling) {
          pollTimer = setTimeout(pollDeviceLocation, POLL_INTERVAL_MS)
        }
      })
      .catch((err) => {
        console.warn('[DeviceLocationWS] Poll failed:', err)
        // Exponential backoff for poll retries, capped at MAX_POLL_RECONNECT_WAIT
        pollRetryCount++
        const delay = Math.min(POLL_INTERVAL_MS * Math.pow(2, pollRetryCount), MAX_POLL_RECONNECT_WAIT)
        if (isPolling) {
          pollTimer = setTimeout(pollDeviceLocation, delay)
        }
      })
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

  function stopPolling() {
    isPolling = false
    if (pollTimer) {
      clearTimeout(pollTimer)
      pollTimer = null
    }
  }

  function startPolling() {
    isPolling = true
    pollRetryCount = 0
    missionStore.setDeviceLocationWsConnected(true)
    missionStore.setDeviceLocationWsStatus('connected')
    pollDeviceLocation()
  }

  function connect() {
    const wsUrl = getWebSocketUrl()
    ws = new ReconnectingWebSocket(wsUrl)

    ws.onMessage(handleMessage)

    ws.onStatusChange((status) => {
      if (status === 'connected') {
        // WebSocket connected — stop polling
        stopPolling()
        missionStore.setDeviceLocationWsConnected(true)
        missionStore.setDeviceLocationWsStatus(status)
      } else if (status === 'disconnected') {
        // WebSocket disconnected — fall back to polling
        missionStore.setDeviceLocationWsConnected(false)
        missionStore.setDeviceLocationWsStatus(status)
        startPolling()
      } else {
        // reconnecting
        missionStore.setDeviceLocationWsConnected(false)
        missionStore.setDeviceLocationWsStatus(status)
      }
    })

    ws.connect()
  }

  function disconnect() {
    stopPolling()
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
