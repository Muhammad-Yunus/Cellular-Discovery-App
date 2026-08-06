# Feature 06 — Global mission WebSocket component + mount in `app.vue`

| Field | Value |
|-------|-------|
| **Feature #** | 06 |
| **Title** | Mount <MissionsWebSocket /> globally in app.vue |
| **Depends on** | 05 |
| **Blocks** | 11 |

---

## 1. Objective

Create a lightweight global component that opens a WebSocket per **visible** mission and renders nothing. Mount it once in `app.vue` so every mission page automatically gets live updates.

---

## 2. Files

### Create
- `app/components/MissionsWebSocket.vue`
- `app/components/__tests__/MissionsWebSocket.test.ts`

### Modify
- `app/app.vue` — add `<MissionsWebSocket />`

---

## 3. Implementation Steps

### Step 1 — Create `app/components/MissionsWebSocket.vue`

```vue
<!-- app/components/MissionsWebSocket.vue -->
<script setup lang="ts">
import { useMissionStore } from '~/stores/mission'
import { useMissionWebSocket } from '~/composables/useMissionWebSocket'

const missionStore = useMissionStore()

// Keep a map of missionId -> composable instance.
// Vue will trigger on each navigation. We use a ref to avoid stale closures.
const activeIds = ref<string[]>([])
const wsInstances = new Map<string, ReturnType<typeof useMissionWebSocket>>()

// Watch for the selected mission changing, and also sync when the list
// of missions changes (e.g. after navigation between pages).
watch(
  () => [missionStore.selectedId, missionStore.missions.length] as const,
  ([selectedId, _]) => {
    if (!selectedId) return
    ensureWS(selectedId)
  },
  { immediate: true }
)

function ensureWS(missionId: string) {
  if (wsInstances.has(missionId)) return
  const ws = useMissionWebSocket(missionId)
  wsInstances.set(missionId, ws)
}

onUnmounted(() => {
  wsInstances.forEach(ws => ws.disconnect())
  wsInstances.clear()
})
</script>

<template>
  <!-- No visual output — purely side-effect component -->
  <div class="hidden" aria-hidden="true">
    <span>{{ missionStore.selectedId ?? '' }}</span>
  </div>
</template>
```

> **Design note:** We use a single `useMissionWebSocket` per mission ID (memoized via the `wsInstances` map) so reconnecting doesn't race when navigating between detail pages of the same mission.

### Step 2 — Update `app/app.vue`

```vue
<!-- app/app.vue -->
<script setup lang="ts">
useHead({
  htmlAttrs: { lang: 'en' }
})

useSeoMeta({
  title: 'Cellular Discovery',
  description: 'USB Modem Cellular Network Discovery Web Frontend'
})
</script>

<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <CustomToaster />
    <MissionsWebSocket />
  </div>
</template>
```

### Step 3 — Unit test

`app/components/__tests__/MissionsWebSocket.test.ts`:

| Test | Assertion |
|------|-----------|
| `renders hidden container` | `wrapper.find('[aria-hidden=true]').exists()` |
| `creates a composable instance for selectedId` | Mock `useMissionWebSocket`, assert called with `missionId` when `selectedId` is set |
| `reuses same instance on rerender` | Mount twice, assert composable called exactly once for same id |
| `disconnects on unmount` | `wrapper.unmount()`, assert `wsInstances` cleared |

---

## 4. Definition of Done

- [ ] `app/components/MissionsWebSocket.vue` created.
- [ ] `app.vue` mounts `<MissionsWebSocket />`.
- [ ] Unit tests pass.
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm build` green.
- [ ] No visual regression on existing pages (no DOM changes visible).
- [ ] Commit message: `feat(mission-planner): mount MissionsWebSocket globally (#06)`

---

## 5. Commit Message

```
feat(mission-planner): mount MissionsWebSocket globally (#06)

- Create app/components/MissionsWebSocket.vue
- Memoize per-mission WebSocket instances in app.vue
- Wire to useMissionWebSocket composable
- Add unit tests
- No UI output — side-effect only component
```