<script setup lang="ts">
import type { MapActions } from '~/composables/useMap'
import type { ScanSummary } from '~/types'

definePageMeta({
  layout: 'home',
  title: 'Map'
})

const { scans, loading, creating, selectedScanId, selectScan } = useScan()
useGPS()
useSystem()
useSettings()

const mapViewRef = ref<{ mapActions: MapActions } | null>(null)

function flyToScan(scanId: string | null, _old: string | null) {
  if (!scanId || !mapViewRef.value) return
  const scan = scans.value.find(s => s.id === scanId)
  if (scan) {
    const map = mapViewRef.value.mapActions.getMap()
    if (map) {
      // Ensure the map container size is up‑to‑date before fitting bounds.
      map.invalidateSize()
      const SIDEBAR_WIDTH = 300 // px, matches Sidebar.vue's w-[300px]
      // First fit bounds to the marker without any padding.
      map.fitBounds(
        [[scan.latitude, scan.longitude], [scan.latitude, scan.longitude]],
        { maxZoom: 17, animate: false }
      )
      // Then pan to the left by half the sidebar width to give the marker room.
      map.panBy([SIDEBAR_WIDTH / 2, 0], { animate: false })
    }
  }
}

watch(selectedScanId, (scanId, _old) => flyToScan(scanId, _old))

function onMarkerClick(scan: ScanSummary) {
  if (!scan) return
  // Selecting the scan in the store will cause the sidebar to highlight the
  // matching item and the map to open the popup via the two‑way binding.
  selectScan(scan.id)
}
</script>

<template>
  <div class="w-full h-full">
    <ClientOnly>
      <MapView
        ref="mapViewRef"
        :markers="scans"
        :selected-scan-id="selectedScanId"
        @marker-click="onMarkerClick"
      />
    </ClientOnly>

    <div
      v-if="!loading && scans.length === 0"
      class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
    >
      <Icon name="lucide:radio-tower" class="text-primary text-6xl mb-6" aria-hidden="true" />
      <p class="text-2xl font-bold text-default">
        Cellular Discovery
      </p>
      <p class="text-base text-muted mt-2">
        Discovering and monitoring LTE, UMTS, and GSM network
      </p>
    </div>

    <LoadingOverlay
      :loading="creating"
      message="Scanning..."
    />
  </div>
</template>