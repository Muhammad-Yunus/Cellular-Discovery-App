<script setup lang="ts">
import { useMap } from '~/composables/useMap'

const props = withDefaults(defineProps<{
  lat: number
  lon: number
  zoom?: number
}>(), {
  zoom: 13
})

const mapContainer = ref<HTMLDivElement | null>(null)
const mapId = `mini-map-${Math.random().toString(36).slice(2, 9)}`
const mapActions = useMap()
let deviceMarker: import('leaflet').Marker | null = null

onMounted(() => {
  if (!mapContainer.value) return
  mapActions.initMap(mapId, [props.lat, props.lon], props.zoom)
  
  // Add marker for device location
  const L = (window as unknown as Record<string, unknown>).L as typeof import('leaflet')
  deviceMarker = L.marker([props.lat, props.lon]).addTo(mapActions.getMap()!)
    .bindPopup(`<div style="font-size:12px;"><strong>Device Location</strong><br>Lat: ${props.lat.toFixed(6)}<br>Lon: ${props.lon.toFixed(6)}</div>`)
})

onUnmounted(() => {
  deviceMarker?.remove()
  mapActions.destroy()
})
</script>

<template>
  <div
    ref="mapContainer"
    :id="mapId"
    class="w-full h-full"
  />
</template>
