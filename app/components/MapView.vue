<template>
  <div
    :id="mapId"
    ref="mapContainer"
    class="w-full h-full bg-neutral-900"
  >
    <slot />
    <FloatingScanButton />
  </div>
</template>

<script setup lang="ts">
import type { ScanSummary } from '~/types'

const props = withDefaults(defineProps<{
  markers?: ScanSummary[]
  center?: [number, number]
  zoom?: number
  selectedScanId?: string | null
}>(), {
  markers: () => [],
  zoom: 17,
  selectedScanId: null
})

const emit = defineEmits<{
  click: [latlng: { lat: number, lng: number }]
  markerClick: [scan: ScanSummary]
}>()

const activeMarkerId = ref<string | null>(props.selectedScanId)

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

function syncSelectedPopup() {
  if (!props.selectedScanId) {
    mapActions.closeAllPopups()
    return
  }
  mapActions.openPopupFor(props.selectedScanId)
}

/**
 * Sync the pulsing animation on the marker that matches the selected scan.
 * Removes the highlight from any previously highlighted marker.
 */
function updateMarkerHighlight() {
  if (activeMarkerId.value && activeMarkerId.value !== props.selectedScanId) {
    mapActions.setMarkerActive(activeMarkerId.value, false)
  }
  if (props.selectedScanId) {
    mapActions.setMarkerActive(props.selectedScanId, true)
  }
  activeMarkerId.value = props.selectedScanId ?? null
}

onMounted(() => {
  if (!mapContainer.value) return
  mapActions.initMap(mapId, getCenter(), props.zoom)
  props.markers.forEach(m => mapActions.addMarker(m))
  syncSelectedPopup()
  updateMarkerHighlight()

  mapActions.getMap()?.on('click', (e: { latlng: { lat: number, lng: number } }) => {
    emit('click', e.latlng)
  })
})

watch(() => props.markers, (markers) => {
  mapActions.clearMarkers()
  markers.forEach(m => mapActions.addMarker(m))
  syncSelectedPopup()
  updateMarkerHighlight()
}, { deep: true })

watch(() => props.selectedScanId, () => {
  syncSelectedPopup()
  updateMarkerHighlight()
})

onUnmounted(() => {
  mapActions.destroy()
})

defineExpose({ mapActions })
</script>
