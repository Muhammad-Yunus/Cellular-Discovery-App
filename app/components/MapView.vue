<template>
  <div
    :id="mapId"
    ref="mapContainer"
    class="w-full h-full"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import type { ScanSummary } from '~/types'

const props = withDefaults(defineProps<{
  markers?: ScanSummary[]
  center?: [number, number]
  zoom?: number
}>(), {
  markers: () => [],
  zoom: 17
})

const emit = defineEmits<{
  click: [latlng: { lat: number, lng: number }]
  markerClick: [scan: ScanSummary]
}>()

const runtimeConfig = useRuntimeConfig()
const mapContainer = ref<HTMLDivElement | null>(null)
const mapId = `map-${Math.random().toString(36).slice(2, 9)}`

const mapActions = useMap()

provide(MapKey, mapActions)

function getCenter(): [number, number] {
  if (props.center) return props.center
  return [
    Number(runtimeConfig.public.defaultLat) || -6.150676643667096,
    Number(runtimeConfig.public.defaultLon) || 106.89665223346297
  ]
}

onMounted(() => {
  if (!mapContainer.value) return
  mapActions.initMap(mapId, getCenter(), props.zoom)
  props.markers.forEach(m => mapActions.addMarker(m))

  mapActions.getMap()?.on('click', (e: { latlng: { lat: number, lng: number } }) => {
    emit('click', e.latlng)
  })
})

watch(() => props.markers, (markers) => {
  mapActions.clearMarkers()
  markers.forEach(m => mapActions.addMarker(m))
}, { deep: true })

onUnmounted(() => {
  mapActions.destroy()
})

defineExpose({ mapActions })
</script>
