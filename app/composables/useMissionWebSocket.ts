// app/composables/useMissionWebSocket.ts
//
// New collector-mission WebSocket composable (Feature 05) that lives
// alongside the existing `useMissions` composable. It connects to the
// collector backend's `/ws/missions` endpoint and reflects server-pushed
// `MissionWSEvent` payloads into the collector mission store so the
// planner UI re-fetches its grid / detail state in real time.
//
// Why a separate composable?
// --------------------------
//   - The existing `useMissions` composable is tied to the legacy
//     `missionStore.ts` and the drone-driven REST API. Feature 05 needs
//     live updates against the simplified collector backend without
//     breaking the existing pages.
//   - Splitting concerns keeps the new behaviour easy to toggle: pages
//     that opt into the live feed call `useMissionWebSocket()` in their
//     `<script setup>`, while legacy pages remain untouched.

import { storeToRefs } from 'pinia'
import { ReconnectingWebSocket, buildWsUrl } from '~/utils/websocket'
import { useCollectorMissionStore } from '~/stores/mission'
import { useCustomToast } from '@/composables/useCustomToast'
import type { MissionWSEvent, MissionWSAction } from '~/types/mission'

export function useMissionWebSocket() {
  const toast = useCustomToast()
  const missionStore = useCollectorMissionStore()
  const { wsConnected, wsStatus } = storeToRefs(missionStore)

  let ws: ReconnectingWebSocket | null = null

  function notify(title: string, color: 'success' | 'error', icon: string) {
    toast.add({ title, description: undefined, color, icon })
  }

  function getWebSocketUrl(): string {
    const config = useRuntimeConfig()
    return buildWsUrl(
      config.public.apiBase as string,
      '/ws/mission'
    )
  }

  /**
   * Map a server event action to a store-level side effect. Status changes,
   * location uploads and scan collections all require refreshing the list
   * so the planner grid stays in sync with the backend.
   */
  function handleEvent(event: MissionWSEvent) {
    switch (event.action as MissionWSAction) {
      case 'mission.status_changed':
        missionStore.fetchMissions()
        notify('Mission status updated', 'success', 'i-lucide-check-circle-2')
        break
      case 'mission.location_uploaded':
        missionStore.fetchMissions()
        notify('Locations uploaded', 'success', 'i-lucide-upload')
        break
      case 'mission.scan_collected':
        missionStore.fetchMissions()
        notify('Scan collected', 'success', 'i-lucide-radar')
        break
      case 'mission.gps_update':
      case 'mission.log_entry':
      default:
        // No grid-refresh needed; consumers can listen on the store if
        // they want to render these telemetry streams.
        break
    }
  }

  function connect() {
    ws = new ReconnectingWebSocket(getWebSocketUrl())

    ws.onMessage((data) => {
      const event = data as MissionWSEvent
      if (event && typeof event.action === 'string') {
        handleEvent(event)
      }
    })

    ws.onStatusChange((status) => {
      missionStore.setWsConnected(status === 'connected')
      missionStore.setWsStatus(status)
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
    wsConnected,
    wsStatus,
    connect,
    disconnect
  }
}
