<script setup lang="ts">
import type { ScanSummary } from '~/types'
import { formatDateTime } from '~/utils/dateFormat'

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
 * Assigns a Nuxt-UI color key based on the RAT (Radio Access Technology).
 * Using the built-in semantic colors to ensure the badge looks correct
 * across the whole theme (e.g. 'success' → green, 'warning' → amber,
 * 'info' → cyan/blue, 'primary' → sky, 'neutral' → gray).
 */
function getRatColor(rat: string | null | undefined): string {
  if (!rat) return 'neutral'
  const normalized = rat.trim().toUpperCase()
  switch (normalized) {
    case 'GSM':
    case 'GPRS':
    case 'EDGE':
      return 'success'          // 2G → green
    case 'UMTS':
    case 'HSPA':
      return 'warning'          // 3G → amber/orange
    case 'LTE':
      return 'info'             // 4G → blue
    case 'NR':
      return 'primary'          // 5G → sky (primary accent)
    default:
      return 'neutral'          // unknown / unmapped
  }
}
</script>

<template>
  <div
    :class="[
      'cursor-pointer transition-colors rounded-md border px-2.5 py-1.5',
      selected ? 'border-primary bg-primary/10' : 'border-muted hover:bg-elevated'
    ]"
    @click="emit('select', scan.id)"
  >
    <div class="flex items-center justify-between gap-2">
      <div class="min-w-0 flex-1">
        <p class="text-sm font-medium text-default truncate leading-tight">
          {{ scan.operator || 'Unknown Operator' }}
        </p>
        <p class="text-xs text-muted leading-tight">
          MCC: {{ fmt(scan.mcc) }} / MNC: {{ fmt(scan.mnc) }}
        </p>
      </div>
       <UBadge
         :label="fmt(scan.rat) === '\u2011' ? 'N/A' : fmt(scan.rat)"
         size="xs"
         :color="getRatColor(scan.rat)"
         variant="subtle"
       />
    </div>
    <p class="mt-0.5 text-xs text-muted leading-tight">
      {{ formatDateTime(scan.scan_time) }}
    </p>
  </div>
</template>
