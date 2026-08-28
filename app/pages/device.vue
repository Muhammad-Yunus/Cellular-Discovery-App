<script setup lang="ts">
import { getDeviceStatus } from '~/services/device.service'
import type { DeviceStatus } from '~/types/device'

definePageMeta({ title: 'Device' })

const status = ref<DeviceStatus | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const lastUpdated = ref<Date | null>(null)

async function fetchStatus() {
  loading.value = true
  error.value = null
  try {
    status.value = await getDeviceStatus()
    lastUpdated.value = new Date()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to fetch device status'
  } finally {
    loading.value = false
  }
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

function usageColor(percent: number): string {
  if (percent < 50) return 'bg-success'
  if (percent < 80) return 'bg-warning'
  return 'bg-error'
}

function statusColor(s: string): 'success' | 'warning' | 'error' | 'neutral' {
  switch (s) {
    case 'active':
    case 'online': return 'success'
    case 'inactive':
    case 'offline': return 'warning'
    case 'error': return 'error'
    default: return 'neutral'
  }
}

// Auto-refresh every 60 seconds
let timer: ReturnType<typeof setInterval> | null = null

function startAutoRefresh() {
  fetchStatus()
  timer = setInterval(fetchStatus, 60_000)
}

function stopAutoRefresh() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

onMounted(startAutoRefresh)
onUnmounted(stopAutoRefresh)
</script>

<template>
  <div class="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold text-highlighted">
          Device Monitoring
        </h1>
        <p class="text-sm text-muted mt-1">
          Real-time status of connected hardware and system metrics
        </p>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-xs text-muted hidden sm:inline">
          Auto-refresh: 1m
        </span>
        <UButton
          color="primary"
          size="sm"
          :icon="loading ? 'i-lucide-loader-circle' : 'i-lucide-refresh-cw'"
          @click="fetchStatus"
        >
          <template #icon="{ className }">
            <UIcon
              :name="loading ? 'i-lucide-loader-circle' : 'i-lucide-refresh-cw'"
              :class="[className, { 'animate-spin': loading }]"
            />
          </template>
          Refresh
        </UButton>
      </div>
    </div>

    <!-- Health Summary -->
    <div
      v-if="status"
      class="flex flex-wrap items-center gap-3 text-sm"
    >
      <div class="flex items-center gap-2">
        <span class="inline-block w-2 h-2 rounded-full bg-success" />
        <span class="text-default">
          {{ status.metadata.health_summary.active }} active
        </span>
      </div>
      <span class="text-muted">|</span>
      <div class="flex items-center gap-2">
        <span class="inline-block w-2 h-2 rounded-full bg-warning" />
        <span class="text-default">
          {{ status.metadata.health_summary.missing }} missing
        </span>
      </div>
      <span class="text-muted">|</span>
      <div class="flex items-center gap-2">
        <span class="inline-block w-2 h-2 rounded-full bg-error" />
        <span class="text-default">
          {{ status.metadata.health_summary.error }} error
        </span>
      </div>
      <span class="text-muted ml-auto">
        Updated: {{ lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never' }}
      </span>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !status" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <USkeleton v-for="i in 4" :key="i" class="h-48 w-full" />
    </div>

    <!-- Error State -->
    <UAlert
      v-else-if="error"
      color="error"
      icon="i-lucide-alert-circle"
      title="Failed to load device status"
      :description="error"
      variant="soft"
      class="mb-4"
    >
      <template #footer>
        <UButton
          label="Retry"
          color="neutral"
          variant="outline"
          size="sm"
          @click="fetchStatus"
        />
      </template>
    </UAlert>

    <!-- 2x2 Card Grid -->
    <div v-else-if="status" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <!-- Machine Card (top-left) -->
      <UCard class="w-full">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-medium text-default">
              System Resources
            </h2>
            <StatusBadge
              status="info"
              label="Passif RF Service"
            />
          </div>
        </template>
        <div class="space-y-3 text-sm">
          <!-- CPU -->
          <div>
            <div class="flex justify-between mb-1">
              <span class="text-muted">CPU Usage</span>
              <span class="text-default font-mono">{{ status.machine.cpu_percent.toFixed(1) }}%</span>
            </div>
            <div class="h-2 bg-neutral-700 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all"
                :class="usageColor(status.machine.cpu_percent)"
                :style="{ width: `${status.machine.cpu_percent}%` }"
              />
            </div>
          </div>

          <!-- Memory -->
          <div>
            <div class="flex justify-between mb-1">
              <span class="text-muted">Memory</span>
              <span class="text-default font-mono">
                {{ (status.machine.memory_used_mb / 1024).toFixed(1) }}GB / {{ (status.machine.memory_total_mb / 1024).toFixed(1) }}GB
              </span>
            </div>
            <div class="h-2 bg-neutral-700 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all"
                :class="usageColor(status.machine.memory_percent)"
                :style="{ width: `${status.machine.memory_percent}%` }"
              />
            </div>
          </div>

          <!-- Disk -->
          <div>
            <div class="flex justify-between mb-1">
              <span class="text-muted">Disk</span>
              <span class="text-default font-mono">
                {{ status.machine.disk_used_gb.toFixed(1) }}GB / {{ status.machine.disk_total_gb.toFixed(1) }}GB
              </span>
            </div>
            <div class="h-2 bg-neutral-700 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all"
                :class="usageColor(status.machine.disk_percent)"
                :style="{ width: `${status.machine.disk_percent}%` }"
              />
            </div>
          </div>

          <!-- Extra metrics -->
          <div class="grid grid-cols-2 gap-2 pt-2">
            <div>
              <span class="text-muted text-xs">Temperature</span>
              <p class="text-default font-mono">{{ status.machine.temperature_c.toFixed(1) }}°C</p>
            </div>
            <div>
              <span class="text-muted text-xs">Uptime</span>
              <p class="text-default font-mono">{{ formatUptime(status.machine.uptime_seconds) }}</p>
            </div>
            <div>
              <span class="text-muted text-xs">Load Avg</span>
              <p class="text-default font-mono">{{ status.machine.load_avg_1m.toFixed(2) }}</p>
            </div>
            <div>
              <span class="text-muted text-xs">Version</span>
              <p class="text-default font-mono">{{ status.metadata.collector_version }}</p>
            </div>
          </div>
        </div>
      </UCard>

      <!-- GPS Card -->
      <UCard class="w-full">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-medium text-default">
              GPS Module
            </h2>
            <StatusBadge
              :status="statusColor(status.gps.status)"
              :label="status.gps.status.charAt(0).toUpperCase() + status.gps.status.slice(1)"
            />
          </div>
        </template>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-muted">Device</span>
            <span class="text-default font-mono">{{ status.gps.type }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted">Coordinates</span>
            <span class="text-default font-mono text-xs">{{ status.gps.latitude?.toFixed(6) ?? 'N/A' }}, {{ status.gps.longitude?.toFixed(6) ?? 'N/A' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted">Satellites</span>
            <span class="text-default font-mono">{{ status.gps.satellites ?? 'N/A' }}</span>
          </div>
          <!-- Mini Map Preview -->
          <div
            v-if="status.gps.latitude && status.gps.longitude"
            class="mt-3 h-32 rounded-md overflow-hidden bg-neutral-800"
          >
            <ClientOnly>
              <MiniMap
                :lat="status.gps.latitude"
                :lon="status.gps.longitude"
              />
            </ClientOnly>
          </div>
        </div>
      </UCard>

      <!-- SDR Card (bottom-left) -->
      <UCard class="w-full">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-medium text-default">
              SDR (Software Defined Radio)
            </h2>
            <StatusBadge
              :status="statusColor(status.sdr.status)"
              :label="status.sdr.status.charAt(0).toUpperCase() + status.sdr.status.slice(1)"
            />
          </div>
        </template>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-muted">Device</span>
            <span class="text-default font-mono">{{ status.sdr.type }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted">Status</span>
            <span class="text-default">{{ status.sdr.message }}</span>
          </div>
        </div>
      </UCard>

      <!-- Network Card -->
      <UCard class="w-full">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-medium text-default">
              Network
            </h2>
            <StatusBadge
              :status="statusColor(status.network.status)"
              :label="status.network.status.charAt(0).toUpperCase() + status.network.status.slice(1)"
            />
          </div>
        </template>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-muted">Status</span>
            <span class="text-default">{{ status.network.status === 'online' ? 'Connected' : 'Disconnected' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted">IP Address</span>
            <span class="text-default font-mono">{{ status.network.ip_address }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted">Gateway</span>
            <span class="text-default font-mono">{{ status.network.gateway }}</span>
          </div>
          <div>
            <span class="text-muted text-xs">DNS Servers</span>
            <div class="flex flex-wrap gap-1 mt-1">
              <UBadge
                v-for="(dns, i) in status.network.dns"
                :key="i"
                color="neutral"
                variant="subtle"
                size="sm"
                class="font-mono"
              >
                {{ dns }}
              </UBadge>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="text-center py-16 text-muted"
    >
      <span class="i-lucide-activity text-4xl mb-3 block" />
      <p>No device data available</p>
    </div>
  </div>
</template>
