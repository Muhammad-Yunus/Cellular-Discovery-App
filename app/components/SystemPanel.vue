<script setup lang="ts">
import { useSystemStore } from '~/stores/systemStore'

const systemStore = useSystemStore()

function statusColor(status: string): string {
  switch (status) {
    case 'ok': return 'success'
    case 'warning': return 'warning'
    case 'error':
    case 'unavailable': return 'error'
    default: return 'neutral'
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'ok': return 'Online'
    case 'unavailable': return 'Offline'
    case 'checking': return 'Checking...'
    case 'warning': return 'Warning'
    case 'error': return 'Error'
    default: return 'Unknown'
  }
}

function formatTimestamp(iso: string | null): string {
  if (!iso) return '-'
  try {
    const d = new Date(iso)
    return d.toLocaleString()
  } catch {
    return iso
  }
}
</script>

<template>
  <div class="p-3 text-sm">
    <div class="grid grid-cols-2 gap-x-6 gap-y-2">
      <div>
        <span class="text-muted">Backend Status</span>
        <div class="flex items-center gap-2 mt-0.5">
          <span
            class="inline-block w-2 h-2 rounded-full"
            :class="{
              'bg-success': systemStore.backendStatus === 'ok',
              'bg-error': systemStore.backendStatus === 'unavailable',
              'bg-warning animate-pulse': systemStore.backendStatus === 'checking'
            }"
          />
          <span class="text-default font-medium">{{ statusLabel(systemStore.backendStatus) }}</span>
        </div>
      </div>
      <div>
        <span class="text-muted">CLI Status</span>
        <div class="flex items-center gap-2 mt-0.5">
          <UBadge
            :color="statusColor(systemStore.cliStatus)"
            variant="solid"
            size="xs"
            :label="statusLabel(systemStore.cliStatus)"
          />
        </div>
      </div>
      <div>
        <span class="text-muted">Response Time</span>
        <p class="text-default font-mono font-medium">
          {{ systemStore.responseTime !== null ? `${systemStore.responseTime}ms` : '-' }}
        </p>
      </div>
      <div>
        <span class="text-muted">Last Check</span>
        <p class="text-default font-mono font-medium">
          {{ formatTimestamp(systemStore.lastCheck) }}
        </p>
      </div>
    </div>

    <div
      v-if="systemStore.error"
      class="mt-3 px-3 py-2 rounded-md bg-error/10 border border-error/30 text-error text-xs"
    >
      {{ systemStore.error }}
    </div>
  </div>
</template>
