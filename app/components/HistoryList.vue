<script setup lang="ts">
import type { ScanSummary } from '~/types'

defineProps<{
  scans: ScanSummary[]
  loading: boolean
  selectedId: string | null
}>()

const emit = defineEmits<{
  selectScan: [id: string]
}>()
</script>

<template>
  <div class="space-y-2">
    <div
      v-if="loading"
      class="space-y-2"
    >
      <USkeleton
        v-for="i in 5"
        :key="i"
        class="h-20 w-full rounded-lg"
      />
    </div>

    <div
      v-else-if="scans.length === 0"
      class="flex flex-col items-center justify-center py-8 text-center"
    >
      <div class="i-lucide-database size-8 text-muted mb-2" />
      <p class="text-sm text-muted">
        No Scan History
      </p>
      <p class="text-xs text-muted mt-1">
        Start a new scan to see results here
      </p>
    </div>

    <div
      v-else
      class="space-y-2"
    >
      <HistoryCard
        v-for="scan in scans"
        :key="scan.id"
        :scan="scan"
        :selected="scan.id === selectedId"
        @select="emit('selectScan', $event)"
      />
    </div>
  </div>
</template>
