<script setup lang="ts">
import { useScanStore } from '~/stores/scanStore'
import { formatDateTime } from '~/utils/dateFormat'
import { getOperatorLogoPath } from '~/utils/operatorLogoMap'

const scanStore = useScanStore()
const selectedScan = computed(() => scanStore.selectedScan)

/**
 * Display-safe value. Returns a non-breaking hyphen ('-') when the
 * value is null, undefined, or an empty string so the panel never
 * renders the literal string 'undefined' or 'null'.
 */
function fmt(value: unknown): string {
  if (value === null || value === undefined || value === '') return '\u2011'
  return String(value)
}
</script>

<template>
<div class="p-3 text-sm">
  <div v-if="selectedScan" class="grid grid-cols-3 gap-x-6 gap-y-2">
    <!-- Operator (col1) -->
    <div class="col-start-1">
      <span class="text-muted">Operator</span>
      <p class="text-default font-medium">{{ fmt(selectedScan.operator) }}</p>
    </div>

    <!-- RAT (col2) -->
    <div class="col-start-2">
      <span class="text-muted">RAT</span>
      <p class="text-default font-medium">{{ fmt(selectedScan.rat) }}</p>
    </div>

    <!-- Logo (col3) -->
    <div class="col-start-3 flex justify-center items-center">
      <img
        v-if="getOperatorLogoPath(selectedScan.operator)"
        :src="getOperatorLogoPath(selectedScan.operator)"
        alt="Operator logo"
        class="w-15 h-15 object-contain"
      >
    </div>

    <!-- MCC (col1) -->
    <div class="col-start-1">
      <span class="text-muted">MCC</span>
      <p class="text-default font-medium">{{ fmt(selectedScan.mcc) }}</p>
    </div>

    <!-- MNC (col2) -->
    <div class="col-start-2">
      <span class="text-muted">MNC</span>
      <p class="text-default font-medium">{{ fmt(selectedScan.mnc) }}</p>
    </div>

    <!-- Scan Time (col1‑2) -->
    <div class="col-span-2 col-start-1">
      <span class="text-muted">Scan Time</span>
      <p class="text-default font-medium">{{ formatDateTime(selectedScan.scan_time) }}</p>
    </div>
  </div>

  <div v-else class="flex flex-col items-center justify-center py-6 text-center">
    <div class="i-lucide-radio size-6 text-muted mb-2" />
    <p class="text-sm text-muted">No scan selected</p>
    <p class="text-xs text-muted mt-1">Select a scan from the sidebar to view details</p>
  </div>
</div>
</template>
