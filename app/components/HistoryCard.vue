<script setup lang="ts">
import type { ScanSummary } from '~/types'

defineProps<{
  scan: ScanSummary
  selected?: boolean
}>()

const emit = defineEmits<{
  select: [id: string]
}>()

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
  <UCard
    :class="[
      'cursor-pointer transition-colors',
      selected ? 'border-primary bg-primary/10' : 'border-muted hover:bg-elevated'
    ]"
    size="xs"
    @click="emit('select', scan.id)"
  >
    <div class="flex items-center justify-between gap-2">
      <div class="min-w-0 flex-1">
        <p class="text-sm font-medium text-default truncate">
          {{ scan.operator || 'Unknown Operator' }}
        </p>
        <p class="text-xs text-muted">
          MCC: {{ scan.mcc }} / MNC: {{ scan.mnc }}
        </p>
      </div>
      <UBadge
        :label="scan.rat || 'N/A'"
        size="xs"
        color="neutral"
        variant="subtle"
      />
    </div>
    <p class="mt-1 text-xs text-muted">
      {{ formatTime(scan.scan_time) }}
    </p>
  </UCard>
</template>
