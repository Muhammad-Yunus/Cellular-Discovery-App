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

onMounted(() => {
  if (!mapContainer.value) return
  mapActions.initMap(mapId, [props.lat, props.lon], props.zoom)
})

onUnmounted(() => {
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
