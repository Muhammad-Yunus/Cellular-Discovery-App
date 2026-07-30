<script setup lang="ts">
import type { MapActions } from '~/composables/useMap'

definePageMeta({
  layout: 'home',
  title: 'Map'
})

const { scans, loading, creating, selectedScanId } = useScan()
useGPS()
useSystem()
useSettings()

const mapViewRef = ref<{ mapActions: MapActions } | null>(null)

function flyToScan(scanId: string | null) {
  if (!scanId || !mapViewRef.value) return
  const scan = scans.value.find(s => s.id === scanId)
  if (scan) {
    const map = mapViewRef.value.mapActions.getMap()
    if (map) {
      // Ensure the map container size is up‑to‑date before fitting bounds.
      map.invalidateSize()
      const SIDEBAR_WIDTH = 300 // px, matches Sidebar.vue's w-[300px]
      // fitBounds with left padding equal to half the sidebar width makes the
      // selected marker exactly the centre of the visible map area.
      map.fitBounds(
        [[scan.latitude, scan.longitude], [scan.latitude, scan.longitude]],
        {
          padding: [0, 0, 0, Math.floor(SIDEBAR_WIDTH / 2)], // top, right, bottom, left
          maxZoom: 17,
          animate: false
        }
      )
    }
  }
}

watch(() => selectedScanId, flyToScan)
</script>

<template>
  <div class="w-full h-full">
    <ClientOnly>
      <MapView
        ref="mapViewRef"
        :markers="scans"
        :selected-scan-id="selectedScanId"
      />
    </ClientOnly>

    <div
      v-if="!loading && scans.length === 0"
      class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
    >
      <div class="i-lucide-map-pin size-12 text-muted mb-3" />
      <p class="text-lg font-medium text-default">
        No Scan Available
      </p>
      <p class="text-sm text-muted mt-1">
        Start a new scan using the button in the sidebar
      </p>
    </div>

    <LoadingOverlay
      :loading="creating"
      message="Scanning..."
    />
  </div>
</template>