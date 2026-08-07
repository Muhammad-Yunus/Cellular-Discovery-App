<script setup lang="ts">
import type { MissionLog } from '~/types'
import { getMissionLogs } from '~/services/scan.service'
import { ref, onMounted } from 'vue'

const props = defineProps<{
  missionId: string
}>()

const logs = ref<MissionLog[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

function getEventTypeColor(eventType: string): string {
  const lower = eventType.toLowerCase()
  if (lower === 'started' || lower === 'start' || lower === 'starting') return 'success'
  if (lower === 'completed' || lower === 'complete' || lower === 'finished') return 'info'
  if (lower === 'failed' || lower === 'error' || lower === 'failure') return 'error'
  if (lower === 'paused' || lower === 'pause') return 'warning'
  if (lower === 'resumed' || lower === 'resume') return 'primary'
  if (lower === 'info' || lower === 'information') return 'info'
  if (lower === 'warn' || lower === 'warning') return 'warning'
  if (lower === 'debug') return 'neutral'
  return 'neutral'
}

function getEventTypeIcon(eventType: string): string {
  const lower = eventType.toLowerCase()
  if (lower === 'started' || lower === 'start' || lower === 'starting') return 'lucide:play'
  if (lower === 'completed' || lower === 'complete' || lower === 'finished') return 'lucide:check-circle'
  if (lower === 'failed' || lower === 'error' || lower === 'failure') return 'lucide:x-circle'
  if (lower === 'paused' || lower === 'pause') return 'lucide:pause'
  if (lower === 'resumed' || lower === 'resume') return 'lucide:resume'
  if (lower === 'info' || lower === 'information') return 'lucide:info'
  if (lower === 'warn' || lower === 'warning') return 'lucide:alert-triangle'
  if (lower === 'debug') return 'lucide:bug'
  return 'lucide:file-text'
}

async function fetchLogs() {
  loading.value = true
  error.value = null
  try {
    logs.value = await getMissionLogs(props.missionId)
  } catch (e: any) {
    error.value = e?.message ?? 'Failed to load logs'
  } finally {
    loading.value = false
  }
}

onMounted(fetchLogs)
</script>

<template>
  <div class="space-y-4">
    <!-- Filters -->
    <div class="px-4 py-3 border border-muted rounded-md bg-primary/5">
      <div class="flex items-center gap-4 flex-wrap">
        <div class="flex-1 min-w-[200px]">
          <label class="block text-sm font-medium text-muted mb-1">Mission Logs</label>
          <p class="text-xs text-muted">
            Event timeline for mission {{ missionId }}
          </p>
        </div>
      </div>
    </div>

    <!-- Error state -->
    <div v-if="error" class="p-4 rounded-md bg-error/10 border border-error/30 text-sm text-error">
      {{ error }}
    </div>

    <!-- Loading state -->
    <div v-if="loading && logs.length === 0" class="py-12 text-center text-muted">
      <span class="i-lucide-loader text-2xl animate-spin inline-block mb-2" />
      <p>Loading logs…</p>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="!loading && logs.length === 0"
      class="flex flex-col items-center justify-center py-16 text-muted border border-muted rounded-md bg-primary/5"
    >
      <span class="i-lucide-file-text text-4xl mb-3" />
      <p>No logs available for this mission.</p>
    </div>

    <!-- Log list -->
    <div
      v-else
      class="border border-muted rounded-md bg-primary/5 overflow-hidden"
    >
      <div class="divide-y divide-muted/30">
        <div
          v-for="(log, index) in logs"
          :key="index"
          class="flex items-start gap-4 p-4 hover:bg-default/50 transition-colors"
        >
          <!-- Event icon -->
          <div
            class="shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
            :class="{
              'bg-success/10 text-success': getEventTypeColor(log.event_type) === 'success',
              'bg-error/10 text-error': getEventTypeColor(log.event_type) === 'error',
              'bg-warning/10 text-warning': getEventTypeColor(log.event_type) === 'warning',
              'bg-info/10 text-info': getEventTypeColor(log.event_type) === 'info',
              'bg-primary/10 text-primary': getEventTypeColor(log.event_type) === 'primary',
              'bg-neutral/10 text-muted': getEventTypeColor(log.event_type) === 'neutral'
            }"
          >
            <Icon :name="getEventTypeIcon(log.event_type)" class="size-4" aria-hidden="true" />
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <!-- Header: type + timestamp -->
            <div class="flex items-center gap-2 flex-wrap">
              <span
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide"
                :class="{
                  'bg-success/10 text-success': getEventTypeColor(log.event_type) === 'success',
                  'bg-error/10 text-error': getEventTypeColor(log.event_type) === 'error',
                  'bg-warning/10 text-warning': getEventTypeColor(log.event_type) === 'warning',
                  'bg-info/10 text-info': getEventTypeColor(log.event_type) === 'info',
                  'bg-primary/10 text-primary': getEventTypeColor(log.event_type) === 'primary',
                  'bg-neutral/10 text-muted': getEventTypeColor(log.event_type) === 'neutral'
                }"
              >
                {{ log.event_type }}
              </span>
              <span class="text-xs text-muted font-mono">
                {{ new Date(log.timestamp).toLocaleString() }}
              </span>
            </div>
            <!-- Message -->
            <p class="mt-1 text-sm text-default">
              {{ log.message }}
            </p>
          </div>

          <!-- Line number (desktop) -->
          <span class="hidden sm:block text-xs text-muted font-mono shrink-0">
            #{{ index + 1 }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
