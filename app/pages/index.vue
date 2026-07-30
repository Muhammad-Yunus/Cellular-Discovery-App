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
    // Instantly pan and zoom the map so the selected marker is placed
    // at the centre of the viewport. We pass an explicit zoom (17) to
    // ensure the marker is prominent. Using setView avoids any drift
    // that can occur with animated flyTo.
    mapViewRef.value.mapActions.setView([scan.latitude, scan.longitude], 17)
    // Force a size recalculation to ensure the map container is properly
    // accounted for (especially after rapid UI transitions), guaranteeing
    // the marker lands exactly at the viewport centre.
    mapViewRef.value.mapActions.invalidateSize()
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