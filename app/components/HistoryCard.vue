<script setup lang="ts">
import type { ScanSummary } from '~/types'

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

function formatTime(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString()
  } catch {
    return iso
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
        color="neutral"
        variant="subtle"
      />
    </div>
    <p class="mt-0.5 text-xs text-muted leading-tight">
      {{ formatTime(scan.scan_time) }}
    </p>
  </div>
</template>
