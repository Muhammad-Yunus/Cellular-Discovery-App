<script setup lang="ts">
import type { ScanSummary } from '~/types'
import { formatDateTime } from '~/utils/dateFormat'
import { getOperatorLogoPath } from '~/utils/operatorLogoMap'

defineProps<{
  scan: ScanSummary
  selected?: boolean
}>()

const emit = defineEmits<{
  select: [id: string]
}>()

/**
 * Display-safe value for sidebar cards. Returns a non-breaking hyphen
 * ('-') when the value is null, undefined, or an empty string so the
 * card never renders the literal string 'undefined' or 'null'.
 */
function fmt(value: unknown): string {
  if (value === null || value === undefined || value === '') return '\u2011'
  return String(value)
}

/**
 * Assigns a Nuxt UI semantic color based on the RAT technology.
 * Used directly by UBadge `color` prop with variant="subtle".
 *
 * The supported colors come from Nuxt UI v4's built-in palette:
 *   primary | secondary | success | info | warning | error | neutral
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
  <div
    :data-scan-id="scan.id"
    :class="[
      'cursor-pointer transition-colors rounded-md border px-2.5 py-1.5',
      selected ? 'border-primary bg-primary/10' : 'border-muted hover:bg-elevated'
    ]"
    @click="emit('select', scan.id)"
  >
    <div class="flex items-stretch gap-2">
      <!-- Logo image (optional) -->
      <img
        v-if="getOperatorLogoPath(scan.operator)"
        :src="getOperatorLogoPath(scan.operator)"
        alt=""
        class="w-8 self-stretch object-contain"
      />

      <div class="flex-1 min-w-0 flex flex-col">
        <!-- Row 1: operator + badge, badge on right -->
        <div class="flex justify-between items-center mb-0.5">
          <p class="text-sm font-medium text-default truncate leading-tight">
            {{ scan.operator || 'Unknown Operator' }}
          </p>
          <UBadge
            :label="fmt(scan.rat) === '\u2011' ? 'N/A' : fmt(scan.rat)"
            size="xs"
            :color="getRatColor(scan.rat)"
            variant="subtle"
          />
        </div>

        <!-- Row 2: MCC/MNC -->
        <p class="text-xs text-muted leading-tight mb-0.5">
          MCC: {{ fmt(scan.mcc) }} / MNC: {{ fmt(scan.mnc) }}
        </p>

        <!-- Row 3: datetime, left aligned -->
        <p class="text-xs text-muted leading-tight">
          {{ formatDateTime(scan.scan_time) }}
        </p>
      </div>
    </div>
  </div>
</template>
