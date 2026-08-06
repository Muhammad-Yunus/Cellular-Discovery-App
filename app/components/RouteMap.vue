// app/components/RouteMap.vue
//
// Visualises uploaded mission locations as a polyline + numbered markers
// on a Leaflet map. Reuses the existing `useMap` composable so tile
// loading, dark/light themes, and marker behaviour stay consistent with
// `MapView.vue`.
//
// Locations are pulled from the collector mission store (`~/stores/mission`)
// and ordered by `order_index` (falling back to array order).

<script setup lang="ts">
import { useCollectorMissionStore } from '~/stores/mission'
import { useMap } from '~/composables/useMap'

const props = defineProps<{
  missionId: string
}>()

const missionStore = useCollectorMissionStore()
const mapContainer = ref<HTMLDivElement | null>(null)
const mapId = `route-map-${Math.random().toString(36).slice(2, 9)}`

const locations = computed(() => missionStore.locations)

onMounted(() => {
  if (!mapContainer.value) return

  const mapActions = useMap()
  mapActions.initMap(
    mapId,
    [-6.150676643667096, 106.89665223346297],
    13
  )

  // Sort by order_index so the polyline reflects the intended route.
  const sorted = [...locations.value].sort(
    (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
  )

  const latlngs = sorted.map(l => [l.latitude, l.longitude] as [number, number])
  if (latlngs.length > 1) {
    mapActions.addPolyline(latlngs)
  }

  // Add a numbered marker for each location.
  sorted.forEach((loc, idx) => {
    mapActions.addMarker(
      {
        id: loc.id,
        operator: `#${idx + 1}`,
        mcc: '',
        mnc: '',
        rat: '',
        latitude: loc.latitude,
        longitude: loc.longitude,
        scan_time: loc.created_at ?? new Date().toISOString()
      } as any,
      () => {}
    )
  })

  // Fit bounds to show every location.
  if (latlngs.length) {
    mapActions.getMap()?.fitBounds(latlngs, { padding: [50, 50] })
  }
})
</script>

<template>
  <div
    ref="mapContainer"
    :id="mapId"
    data-testid="route-map"
    class="h-[500px] w-full rounded border border-default/10 bg-neutral-900"
  />
</template>