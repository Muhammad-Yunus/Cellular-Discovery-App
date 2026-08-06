# Feature 05 — Mission WebSocket composable (`useMissionWebSocket`)

| Field | Value |
|-------|-------|
| **Feature #** | 05 |
| **Title** | Mission WebSocket composable |
| **Depends on** | 01, 02, 04 |
| **Blocks** | 06, 11 |

---

## 1. Objective

A composable that opens a reconnecting WebSocket per mission, emits typed events, and updates the mission store live (status changes, GPS drift, scan arrival, logs).

---

## 2. Files

### Create
- `app/composables/useMissionWebSocket.ts`
- `app/composables/__tests__/useMissionWebSocket.test.ts`

---

## 3. Implementation Steps

### Step 1 — Create `app/composables/useMissionWebSocket.ts`

```ts
// app/composables/useMissionWebSocket.ts
import { storeToRefs } from 'pinia'
import { useMissionStore } from '~/stores/mission'
import { ReconnectingWebSocket, buildWsUrl } from '~/utils/websocket'
import type { MissionWSAction, MissionLogEntry, MissionGPSUpdate } from '~/types/mission'

export function useMissionWebSocket(missionId: string) {
  const missionStore = useMissionStore()
  const { wsConnected, wsStatus } = storeToRefs(missionStore)

  let ws: ReconnectingWebSocket | null = null
  const handlers = new Map<MissionWSAction, Array<(data: unknown) => void>>()

  function getWebSocketUrl(): string {
    const config = useRuntimeConfig()
    return buildWsUrl(config.public.apiBaseMissions as string, `/ws/mission/${missionId}`)
  }

  function parseEvent(raw: unknown): MissionWSEvent | null {
    if (!raw || typeof raw !== 'object') return null
    const e = raw as Record<string, unknown>
    if (typeof e.action !== 'string') return null
    return e as MissionWSEvent
  }

  function connect() {
    if (ws) return
    ws = new ReconnectingWebSocket(getWebSocketUrl())

    ws.onMessage((data) => {
      const event = parseEvent(data)
      if (!event) return

      // Dispatch to global listeners
      const global = handlers.get(event.action as MissionWSAction)
      if (global) global.forEach(fn => fn(event.data))

      // Special-case: update the store's mission list when status changes
      if (event.action === 'mission.status_changed') {
        const status = event.data?.status as MissionStatus | undefined
        if (status) {
          const idx = missionStore.missions.findIndex(m => m.id === missionId)
          if (idx >= 0) {
            ;(missionStore.missions[idx] as any).status = status
          }
        }
      }

      if (event.action === 'mission.scan_collected') {
        const count = event.data?.scan_count as number | undefined
        if (count !== undefined) {
          const idx = missionStore.missions.findIndex(m => m.id === missionId)
          if (idx >= 0) {
            ;(missionStore.missions[idx] as any).scan_count = count
          }
        }
      }

      if (event.action === 'mission.location_uploaded') {
        const count = event.data?.location_count as number | undefined
        if (count !== undefined) {
          const idx = missionStore.missions.findIndex(m => m.id === missionId)
          if (idx >= 0) {
            ;(missionStore.missions[idx] as any).location_count = count
          }
        }
      }
    })

    ws.onStatusChange((status) => {
      missionStore.setWsConnected(status === 'connected')
      missionStore.setWsStatus(status as any)
    })

    ws.connect()
  }

  function disconnect() {
    ws?.disconnect()
    ws = null
  }

  function on(action: MissionWSAction, fn: (data: unknown) => void) {
    const arr = handlers.get(action) ?? []
    arr.push(fn)
    handlers.set(action, arr)
    return () => {
      const updated = handlers.get(action)?.filter(h => h !== fn) ?? []
      handlers.set(action, updated)
    }
  }

  onMounted(() => {
    connect()
  })

  onUnmounted(() => {
    disconnect()
  })

  return {
    connect,
    disconnect,
    on,
    wsConnected,
    wsStatus
  }
}

// Internal event shape (narrower than the raw one)
interface MissionWSEvent {
  action: string
  mission_id: string
  data: Record<string, unknown>
  timestamp: string
}

type MissionStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'
```

> **Note:** `MissionStatus` is redeclared locally to avoid a circular import between `composables/` and `types/mission.ts` at compile time. The real type lives in `app/types/mission.ts`; this is a deliberate local copy to keep the composable dependency-free for the unit-test mock.

### Step 2 — Unit tests `app/composables/__tests__/useMissionWebSocket.test.ts`

| Test | Assertion |
|------|-----------|
| `connect is called on onMounted` | Mount the composable, assert `ReconnectingWebSocket` instance was created with correct URL |
| `disconnect is called on onUnmounted` | Unmount, assert `ws.disconnect()` was called |
| `onMessage parses status_changed` | Mock ws message, assert `missionStore.missions` updated status |
| `onMessage parses scan_collected` | Mock ws message with `scan_count`, assert `scan_count` updated |
| `onMessage parses location_uploaded` | Mock ws message with `location_count`, assert `location_count` updated |
| `on returns an unsubscribe` | Subscribe, unsubscribe, send message, assert handler not called |
| `WebSocket URL is /ws/mission/{missionId}` | Assert URL string contains mission id |

---

## 4. Definition of Done

- [ ] `app/composables/useMissionWebSocket.ts` exported.
- [ ] Unit tests pass.
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm build` green.
- [ ] Commit message: `feat(mission-planner): add mission WebSocket composable (#05)`

---

## 5. Commit Message

```
feat(mission-planner): add mission WebSocket composable (#05)

- Create app/composables/useMissionWebSocket.ts
- Wire ReconnectingWebSocket to /ws/mission/{id}
- Emit mission.status_changed, mission.scan_collected, mission.location_uploaded
- Update store state live on each event
- Export connect/disconnect/on helpers
- Add unit tests for useMissionWebSocket
```