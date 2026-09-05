<script setup lang="ts">
import type { MissionLog } from '~/types'
import { getMissionLogs } from '~/services/scan.service'
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  missionId: string
}>()

const emit = defineEmits<{
  (e: 'data-loaded'): void
  (e: 'refresh'): void
}>()

// State
const logs = ref<MissionLog[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const currentPage = ref(1)
const pageSize = ref(10)
const hasMore = ref(true)
const scrollContainerRef = ref<HTMLElement | null>(null)

// Event handlers for external refresh
const handleLogRefresh = () => resetAndLoad()
const handleLogWSRefresh = () => loadMore()

async function loadPage(page: number, append = false): Promise<void> {
  console.log(`[MissionLogList] loadPage called: page=${page}, append=${append}`)
  
  if (loading.value) {
    console.log('[MissionLogList] Already loading, skipping')
    return
  }
  
  loading.value = true
  error.value = null

  try {
    const newLogs = await getMissionLogs(props.missionId, {
      page,
      page_size: pageSize.value
    })

    if (!Array.isArray(newLogs)) {
      throw new Error('Invalid response format')
    }

    console.log(`[MissionLogList] Loaded ${newLogs.length} logs for page ${page}`)

    if (append) {
      logs.value = [...logs.value, ...newLogs]
    } else {
      logs.value = newLogs
    }

    // Update page number (next page to load)
    currentPage.value = page + 1

    // Check if we got fewer items than requested (end of data)
    hasMore.value = newLogs.length >= pageSize.value
    console.log(`[MissionLogList] hasMore=${hasMore.value}, currentPage=${currentPage.value}`)

    emit('data-loaded')
  } catch (e: any) {
    error.value = e?.message ?? 'Failed to load logs'
    console.error('[MissionLogList] Error loading logs:', e)
    if (!append) {
      logs.value = []
    }
  } finally {
    loading.value = false
  }
}

function resetAndLoad(): void {
  console.log('[MissionLogList] resetAndLoad called')
  logs.value = []
  currentPage.value = 1
  hasMore.value = true
  error.value = null
  loadPage(1, false)
}

function loadMore(): void {
  console.log(`[MissionLogList] loadMore called: hasMore=${hasMore.value}, loading=${loading.value}, currentPage=${currentPage.value}`)
  if (hasMore.value && !loading.value) {
    loadPage(currentPage.value, true)
  }
}

function onScroll(): void {
  const container = scrollContainerRef.value
  if (!container) return

  const { scrollHeight, scrollTop, clientHeight } = container
  const isAtBottom = scrollHeight - scrollTop - clientHeight < 10

  console.log(`[MissionLogList] Scroll event: scrollTop=${scrollTop}, scrollHeight=${scrollHeight}, clientHeight=${clientHeight}, isAtBottom=${isAtBottom}`)

  if (isAtBottom && hasMore.value && !loading.value) {
    console.log('[MissionLogList] At bottom, calling loadMore')
    loadMore()
  }
}

// Lifecycle
onMounted(() => {
  console.log('[MissionLogList] Component mounted')
  resetAndLoad()

  // Setup scroll listener after DOM is ready
  setTimeout(() => {
    const container = scrollContainerRef.value
    console.log('[MissionLogList] Container ref:', container)
    
    if (container) {
      container.addEventListener('scroll', onScroll)
      console.log('[MissionLogList] Scroll listener added')
      
      // Debug: log container properties
      console.log('[MissionLogList] Container info:', {
        scrollHeight: container.scrollHeight,
        clientHeight: container.clientHeight,
        scrollTop: container.scrollTop,
        maxHeight: window.getComputedStyle(container).maxHeight
      })
    }
  }, 100)

  window.addEventListener('refresh-log-list', handleLogRefresh)
  window.addEventListener('ws-log-entry', handleLogWSRefresh)
})

onUnmounted(() => {
  const container = scrollContainerRef.value
  if (container) {
    container.removeEventListener('scroll', onScroll)
  }

  window.removeEventListener('refresh-log-list', handleLogRefresh)
  window.removeEventListener('ws-log-entry', handleLogWSRefresh)
})
</script>

<template>
  <div class="space-y-4">
    <!-- Header -->
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

    <!-- Loading state (initial) -->
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

    <!-- Log list (scrollable) -->
    <div
      v-else
      ref="scrollContainerRef"
      class="border border-muted rounded-md bg-primary/5"
      style="max-height: 500px; overflow-y: auto;"
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
              'bg-success/10 text-success': ['started', 'start', 'starting', 'visited'].includes(log.event_type.toLowerCase()),
              'bg-error/10 text-error': ['failed', 'error', 'failure', 'stopped', 'stop'].includes(log.event_type.toLowerCase()),
              'bg-warning/10 text-warning': ['paused', 'pause', 'warn', 'warning'].includes(log.event_type.toLowerCase()),
              'bg-info/10 text-info': ['completed', 'complete', 'finished', 'info', 'information', 'resumed', 'resume'].includes(log.event_type.toLowerCase()),
              'bg-primary/10 text-primary': ['debug'].includes(log.event_type.toLowerCase()),
              'bg-neutral/10 text-muted': true
            }"
          >
            <Icon
              :name="[
                'started', 'start', 'starting'
              ].includes(log.event_type.toLowerCase()) ? 'lucide:play' :
              ['completed', 'complete', 'finished'].includes(log.event_type.toLowerCase()) ? 'lucide:check-circle' :
              ['failed', 'error', 'failure'].includes(log.event_type.toLowerCase()) ? 'lucide:x-circle' :
              ['paused', 'pause'].includes(log.event_type.toLowerCase()) ? 'lucide:pause' :
              ['resumed', 'resume'].includes(log.event_type.toLowerCase()) ? 'lucide:play' :
              ['info', 'information'].includes(log.event_type.toLowerCase()) ? 'lucide:info' :
              ['warn', 'warning'].includes(log.event_type.toLowerCase()) ? 'lucide:alert-triangle' :
              ['debug'].includes(log.event_type.toLowerCase()) ? 'lucide:bug' :
              ['visited'].includes(log.event_type.toLowerCase()) ? 'lucide:map-pin-check' :
              ['stopped', 'stop'].includes(log.event_type.toLowerCase()) ? 'lucide:square' :
              'lucide:file-text'"
              class="size-4"
              aria-hidden="true"
            />
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide"
                :class="{
                  'bg-success/10 text-success': ['started', 'start', 'starting', 'visited'].includes(log.event_type.toLowerCase()),
                  'bg-error/10 text-error': ['failed', 'error', 'failure', 'stopped', 'stop'].includes(log.event_type.toLowerCase()),
                  'bg-warning/10 text-warning': ['paused', 'pause', 'warn', 'warning'].includes(log.event_type.toLowerCase()),
                  'bg-info/10 text-info': ['completed', 'complete', 'finished', 'info', 'information', 'resumed', 'resume'].includes(log.event_type.toLowerCase()),
                  'bg-primary/10 text-primary': ['debug'].includes(log.event_type.toLowerCase()),
                  'bg-neutral/10 text-muted': true
                }"
              >
                {{ log.event_type }}
              </span>
              <span class="text-xs text-muted font-mono">
                {{ new Date(log.timestamp).toLocaleString() }}
              </span>
            </div>
            <p class="mt-1 text-sm text-default">
              {{ log.message }}
            </p>
          </div>

          <!-- Line number -->
          <span class="hidden sm:block text-xs text-muted font-mono shrink-0">
            #{{ index + 1 }}
          </span>
        </div>
      </div>

      <!-- Loading more indicator -->
      <div v-if="loading && logs.length > 0" class="py-3 text-center text-muted text-sm border-t border-muted/30">
        <span class="i-lucide-loader text-sm animate-spin inline-block mr-2" />
        Loading more logs...
      </div>

      <!-- End message -->
      <div v-if="!hasMore && logs.length > 0" class="py-3 text-center text-muted text-sm border-t border-muted/30">
        No more logs
      </div>
    </div>
  </div>
</template>
