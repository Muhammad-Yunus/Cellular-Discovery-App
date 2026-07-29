import { storeToRefs } from 'pinia'
import { useGpsStore } from '~/stores/gpsStore'
import { ReconnectingWebSocket, buildWsUrl } from '~/utils/websocket'

export function useGPS() {
  const gpsStore = useGpsStore()
  const { latitude, longitude, provider, connected } = storeToRefs(gpsStore)

  let ws: ReconnectingWebSocket | null = null
  let fallbackTimer: ReturnType<typeof setTimeout> | null = null

  function getWebSocketUrl(): string {
    const config = useRuntimeConfig()
    return buildWsUrl(config.public.apiBase as string, '/ws/gps')
  }

  function connect() {
    ws = new ReconnectingWebSocket(getWebSocketUrl())

    ws.onMessage((data) => {
      const msg = data as { latitude?: number, longitude?: number, provider?: string }
      if (typeof msg.latitude === 'number' && typeof msg.longitude === 'number') {
        gpsStore.updatePosition(msg.latitude, msg.longitude)
      }
      if (msg.provider) {
        gpsStore.setProvider(msg.provider as 'mock' | 'serial' | 'gps')
      }
    })

    ws.onStatusChange((status) => {
      gpsStore.setConnected(status === 'connected')
    })

    ws.connect()
  }

  function disconnect() {
    if (fallbackTimer) {
      clearTimeout(fallbackTimer)
      fallbackTimer = null
    }
    ws?.disconnect()
    ws = null
  }

  onMounted(() => {
    connect()

    fallbackTimer = setTimeout(() => {
      if (!gpsStore.provider) {
        const config = useRuntimeConfig()
        gpsStore.updatePosition(
          parseFloat(config.public.defaultLat as string),
          parseFloat(config.public.defaultLon as string)
        )
        gpsStore.setProvider('mock')
      }
    }, 5000)
  })

  onUnmounted(() => {
    disconnect()
  })

  return {
    latitude,
    longitude,
    provider,
    connected,
    connect,
    disconnect
  }
}
