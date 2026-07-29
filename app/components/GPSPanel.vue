<script setup lang="ts">
import { useGpsStore } from '~/stores/gpsStore'

const gpsStore = useGpsStore()
</script>

<template>
  <div class="p-3 text-sm">
    <div
      v-if="gpsStore.provider"
      class="grid grid-cols-2 gap-x-6 gap-y-2"
    >
      <div>
        <span class="text-muted">Latitude</span>
        <p class="text-default font-mono font-medium">
          {{ gpsStore.latitude.toFixed(6) }}
        </p>
      </div>
      <div>
        <span class="text-muted">Longitude</span>
        <p class="text-default font-mono font-medium">
          {{ gpsStore.longitude.toFixed(6) }}
        </p>
      </div>
      <div>
        <span class="text-muted">Provider</span>
        <p class="text-default font-medium capitalize">
          {{ gpsStore.provider }}
        </p>
      </div>
      <div>
        <span class="text-muted">Status</span>
        <p class="text-default font-medium">
          <span
            class="inline-block w-2 h-2 rounded-full mr-1.5"
            :class="gpsStore.connected ? 'bg-success' : 'bg-warning'"
          />
          {{ gpsStore.connected ? 'Connected' : 'Disconnected' }}
        </p>
      </div>
    </div>

    <div
      v-else
      class="flex flex-col items-center justify-center py-6 text-center"
    >
      <div class="i-lucide-satellite size-6 text-muted mb-2 animate-pulse" />
      <p class="text-sm text-muted">
        Waiting for GPS...
      </p>
      <p class="text-xs text-muted mt-1">
        GPS data will appear once a connection is established
      </p>
    </div>
  </div>
</template>
