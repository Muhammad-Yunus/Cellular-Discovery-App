<script setup lang="ts">
import { useScanStore } from '~/stores/scanStore'

const scanStore = useScanStore()
const selectedScan = computed(() => scanStore.selectedScan)

function formatTime(iso: string | undefined): string {
  if (!iso) return '-'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}
</script>

<template>
  <div class="p-3 text-sm">
    <div
      v-if="selectedScan"
      class="grid grid-cols-2 gap-x-6 gap-y-2"
    >
      <div>
        <span class="text-muted">Operator</span>
        <p class="text-default font-medium">
          {{ selectedScan.operator || '-' }}
        </p>
      </div>
      <div>
        <span class="text-muted">RAT</span>
        <p class="text-default font-medium">
          {{ selectedScan.rat || '-' }}
        </p>
      </div>
      <div>
        <span class="text-muted">MCC</span>
        <p class="text-default font-medium">
          {{ selectedScan.mcc || '-' }}
        </p>
      </div>
      <div>
        <span class="text-muted">MNC</span>
        <p class="text-default font-medium">
          {{ selectedScan.mnc || '-' }}
        </p>
      </div>
      <div class="col-span-2">
        <span class="text-muted">Scan Time</span>
        <p class="text-default font-medium">
          {{ formatTime(selectedScan.scan_time) }}
        </p>
      </div>
    </div>

    <div
      v-else
      class="flex flex-col items-center justify-center py-6 text-center"
    >
      <div class="i-lucide-radio size-6 text-muted mb-2" />
      <p class="text-sm text-muted">
        No scan selected
      </p>
      <p class="text-xs text-muted mt-1">
        Select a scan from the sidebar to view details
      </p>
    </div>
  </div>
</template>
