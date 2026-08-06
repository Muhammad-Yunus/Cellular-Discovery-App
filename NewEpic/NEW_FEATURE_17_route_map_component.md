# Feature 17 — Route map component (`<RouteMap>`)

| Field | Value |
|-------|-------|
| **Feature #** | 17 |
| **Title** | Route map component (Leaflet) |
| **Depends on** | 01–04, 15 |
| **Blocks** | 11 |

---

## 1. Objective

Visualize the uploaded waypoints as a polyline on a Leaflet map (reuse the existing `useMap` composable).

---

## 2. Files

### Create
- `app/components/RouteMap.vue`
- `app/components/__tests__/RouteMap.test.ts`

---

## 3. Implementation Steps

### Step 1 — Create `app/components/RouteMap.vue`

```vue
<!-- app/components/RouteMap.vue -->
<script setup lang="ts">
import { useMissionStore } from '~/stores/mission'
import { useMap } from '~/composables/useMap'

const props = defineProps<{
  missionId: string
}>()

const missionStore = useMissionStore()
const mapContainer = ref<HTMLDivElement | null>(null)
const mapId = `route-map-${Math.random().toString(36).slice(2, 9)}`

const locations = computed(() => (missionStore.missions.find(m => m.id === props.missionId) as any)?._locations ?? [])

onMounted(() => {
  if (!mapContainer.value) return
  const mapActions = useMap()
  mapActions.initMap(mapId, [-6.150676643667096, 106.89665223346297], 13)

  // Draw polyline through locations (ordered by order_index)
  const sorted = [...locations.value].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
  const latlngs = sorted.map(l => [l.latitude, l.longitude] as [number, number])
  if (latlngs.length > 1) {
    mapActions.addPolyline(latlngs)
  }

  // Add markers for each location
  sorted.forEach((loc, idx) => {
    mapActions.addMarker(
      {
        id: loc.id,
        operator: `#${idx + 1}`,
        mcc: '', mnc: '', rat: '',
        latitude: loc.latitude,
        longitude: loc.longitude,
        scan_time: loc.created_at
      } as any,
      () => {}
    )
  })

  // Fit bounds
  if (latlngs.length) {
    mapActions.getMap()?.fitBounds(latlngs, { padding: [50, 50] })
  }
})
</script>

<template>
  <div ref="mapContainer" :id="mapId" class="h-[500px] w-full rounded border border-default/10 bg-neutral-900" />
</template>
```

> **Note:** We reuse the existing `useMap` composable (used by `MapView.vue`). If the composable doesn't support `addPolyline`, add a thin wrapper or extend it later.

---

## 4. Definition of Done

- [ ] `<RouteMap>` renders a Leaflet map.
- [ ] Draws a polyline through all uploaded locations (ordered).
- [ ] Places numbered markers at each location.
- [ ] Fits bounds to show all locations.
- [ ] Unit tests pass.
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm build` green.
- [ ] Commit message: `feat(mission-planner): add RouteMap component (#17)`

---

## 5. Commit Message

```
feat(mission-planner): add RouteMap component (#17)

- Create app/components/RouteMap.vue
- Wire to existing useMap composable
- Draw polyline through locations ordered by order_index
- Add numbered markers
- Fit bounds automatically
```