<script setup lang="ts">
definePageMeta({ title: 'Health' })

const {
  backendStatus,
  cliStatus,
  responseTime,
  lastCheck,
  error,
  checkNow
} = useSystem()

const cliLabel = computed(() => {
  const map: Record<string, string> = {
    ok: 'Online',
    warning: 'Warning',
    error: 'Offline',
    unknown: 'Unknown'
  }
  return map[cliStatus.value] ?? 'Unknown'
})

const timeAgo = computed(() => {
  if (!lastCheck.value) return 'Never'
  const diff = Date.now() - new Date(lastCheck.value).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 5) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  return `${Math.floor(minutes / 60)}h ago`
})
</script>

<template>
  <div class="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold text-highlighted">
        System Health
      </h1>
      <UButton
        label="Check Now"
        color="primary"
        size="sm"
        :icon="responseTime !== null ? 'i-lucide-refresh-cw' : 'i-lucide-loader-circle'"
        :class="responseTime === null ? 'animate-spin' : ''"
        @click="checkNow"
      />
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <UCard class="w-full">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-medium text-default">
              Backend
            </h2>
            <StatusBadge
              :status="backendStatus === 'checking' ? 'loading' : backendStatus === 'ok' ? 'ok' : 'error'"
              :label="backendStatus === 'ok' ? 'Online' : backendStatus === 'checking' ? 'Checking' : 'Offline'"
              :pulse="backendStatus === 'checking'"
            />
          </div>
        </template>

        <div class="space-y-3 text-sm">
          <div class="flex justify-between">
            <span class="text-muted">Response Time</span>
            <span class="text-default font-mono">{{ responseTime !== null ? `${responseTime}ms` : '-' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted">Last Check</span>
            <span class="text-default">{{ timeAgo }}</span>
          </div>
        </div>
      </UCard>

      <UCard class="w-full">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-medium text-default">
              CLI
            </h2>
            <StatusBadge
              :status="cliStatus === 'warning' ? 'warning' : cliStatus === 'error' ? 'error' : cliStatus === 'ok' ? 'ok' : 'info'"
              :label="cliLabel"
            />
          </div>
        </template>

        <div class="space-y-3 text-sm">
          <div class="flex justify-between">
            <span class="text-muted">Status</span>
            <span class="text-default">{{ cliLabel }}</span>
          </div>
        </div>
      </UCard>
    </div>

    <UAlert
      v-if="error"
      color="warning"
      icon="i-lucide-alert-triangle"
      :title="error"
      variant="soft"
    />

    <div class="text-xs text-muted text-center">
      Auto-refreshes every 30 seconds
    </div>
  </div>
</template>
