<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  status?: string
  startTime?: number | null
  endTime?: number | null
  wsConnected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  status: 'PENDING',
  startTime: null,
  endTime: null,
  wsConnected: false
})

const statusType = computed(() => {
  const type = props.status
  if (type === 'ACTIVE') return 'active'
  if (type === 'COMPLETED') return 'completed'
  if (type === 'FAILED') return 'failed'
  return 'pending'
})

const statusColor = computed(() => {
  switch (statusType.value) {
    case 'active': return 'text-green-600 dark:text-green-400'
    case 'completed': return 'text-blue-600 dark:text-blue-400'
    case 'failed': return 'text-red-600 dark:text-red-400'
    default: return 'text-gray-500 dark:text-gray-400'
  }
})

const statusLabel = computed(() => {
  switch (statusType.value) {
    case 'active': return 'ACTIVE'
    case 'completed': return 'COMPLETED'
    case 'failed': return 'FAILED'
    default: return 'PENDING'
  }
})

const elapsedText = computed(() => {
  if (statusType.value !== 'active' || !props.startTime) return null

  const start = props.startTime * 1000
  const now = Date.now()
  const diff = now - start

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m elapsed`
  }
  return `${minutes}m elapsed`
})

const completionText = computed(() => {
  if (!props.endTime) return null

  const date = new Date(props.endTime * 1000)
  return date.toLocaleString()
})
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center gap-2">
      <span
        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
        :class="statusColor"
      >
        {{ statusLabel }}
      </span>
      <span
        v-if="elapsedText"
        class="text-sm text-gray-500 dark:text-gray-400"
      >
        {{ elapsedText }}
      </span>
      <span
        v-if="completionText"
        class="text-sm text-gray-500 dark:text-gray-400"
      >
        Completed: {{ completionText }}
      </span>
    </div>
    <div
      v-if="wsConnected"
      class="flex items-center gap-1 text-xs text-green-600 dark:text-green-400"
    >
      <span class="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      <span>Connected</span>
    </div>
  </div>
</template>
