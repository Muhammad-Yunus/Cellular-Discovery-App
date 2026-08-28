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

/**
 * Assigns a Nuxt UI semantic color based on the RAT technology.
 * Used directly by UBadge `color` prop with variant="subtle".
 */
function getRatColor(rat: string | null | undefined): 'success' | 'warning' | 'info' | 'primary' | 'neutral' {
  if (!rat) return 'neutral' // unknown/neutral
  const normalized = rat.trim().toUpperCase()
  switch (normalized) {
    case 'GSM':
    case 'GPRS':
    case 'EDGE':
      return 'success'      // 2G
    case 'UMTS':
    case 'HSPA':
      return 'warning'      // 3G
    case 'LTE':
      return 'info'         // 4G
    case 'NR':
      return 'primary'      // 5G
    default:
      return 'neutral'
  }
}
</script>

<template>
<div class="p-3 text-sm relative">
  <div v-if="selectedScan" class="grid grid-cols-5 gap-x-4 gap-y-2 items-start">
    <!-- Column 1: Operator, MCC, MNC -->
    <div class="flex flex-col gap-2">
      <div>
        <span class="text-muted text-xs">Operator</span>
        <p class="text-default font-medium">{{ fmt(selectedScan.operator) }}</p>
      </div>
      <div>
        <span class="text-muted text-xs">MCC</span>
        <p class="text-default font-medium">{{ fmt(selectedScan.mcc) }}</p>
      </div>
      <div>
        <span class="text-muted text-xs">MNC</span>
        <p class="text-default font-medium">{{ fmt(selectedScan.mnc) }}</p>
      </div>
    </div>

    <!-- Column 2: EARFCN, Frequency, RAT -->
    <div class="flex flex-col gap-2">
      <div>
        <span class="text-muted text-xs">EARFCN</span>
        <p class="text-default font-medium">{{ fmt(selectedScan.earfcn) }}</p>
      </div>
      <div>
        <span class="text-muted text-xs">Frequency</span>
        <p class="text-default font-medium">
          {{ selectedScan.frequency_mhz ? `${selectedScan.frequency_mhz} MHz` : '\u2011' }}
        </p>
      </div>
      <div>
        <span class="text-muted text-xs mb-0.5">RAT</span>
        <UBadge
          :label="fmt(selectedScan.rat) === '\u2011' ? 'N/A' : fmt(selectedScan.rat)"
          size="xs"
          :color="getRatColor(selectedScan.rat)"
          variant="subtle"
          class="mt-0.5"
        />
      </div>
    </div>

    <!-- Column 3: RSRP, RSRQ, SNR -->
    <div class="flex flex-col gap-2">
      <div>
        <span class="text-muted text-xs">RSRP</span>
        <p class="text-default font-medium">{{ fmt(selectedScan.rsrp) }}</p>
      </div>
      <div>
        <span class="text-muted text-xs">RSRQ</span>
        <p class="text-default font-medium">{{ fmt(selectedScan.rsrq) }}</p>
      </div>
      <div>
        <span class="text-muted text-xs">SNR</span>
        <p class="text-default font-medium">{{ fmt(selectedScan.snr) }}</p>
      </div>
    </div>

    <!-- Column 4: PCI, Scan Time -->
    <div class="flex flex-col gap-2">
      <div>
        <span class="text-muted text-xs">PCI</span>
        <p class="text-default font-medium">{{ fmt(selectedScan.pci) }}</p>
      </div>
      <div>
        <span class="text-muted text-xs">Scan Time</span>
        <p class="text-default font-medium text-xs">{{ formatDateTime(selectedScan.scan_time) }}</p>
      </div>
    </div>

    <!-- Column 5: Logo -->
    <div class="flex items-start justify-end">
      <div v-if="getOperatorLogoPath(selectedScan.operator)" class="flex-shrink-0">
        <img
          :src="getOperatorLogoPath(selectedScan.operator)"
          alt="Operator logo"
          class="w-12 h-12 object-contain opacity-80"
        >
      </div>
      <div v-else class="i-lucide-radio size-5 text-muted" />
    </div>
  </div>

  <div v-else class="flex flex-col items-center justify-center py-6 text-center">
    <div class="i-lucide-radio size-6 text-muted mb-2" />
    <p class="text-sm text-muted">No scan selected</p>
    <p class="text-xs text-muted mt-1">Select a scan from the sidebar to view details</p>
  </div>
</div>
</template>
