<script setup lang="ts">
import type { MissionStatus5 } from '~/types/mission'
import { useCollectorMissionStore } from '~/stores/mission'
import { useCustomToast } from '~/composables/useCustomToast'
import { nextTick, watch } from 'vue'

definePageMeta({ title: 'Mission Planner' })

const toast = useCustomToast()
const missionStore = useCollectorMissionStore()
const router = useRouter()
const route = useRoute()
const deleteTargetId = ref<string | null>(null)
const deleteTargetName = ref<string>('')
const showDeleteConfirm = ref(false)

// Time range refs
const startDateTime = ref<string | null>(null)
const endDateTime = ref<string | null>(null)

// Sort options — exposed for the template
const MISSION_SORT_FIELDS = [
  { value: 'created_at', label: 'Created At' },
  { value: 'name', label: 'Name' },
  { value: 'description', label: 'Description' }
] as const

type StatusChipColor = 'default' | 'success' | 'warning' | 'info' | 'error' | 'neutral'

const statusOptions: { value: 'all' | MissionStatus5; label: string; chipColor: StatusChipColor }[] = [
  { value: 'all', label: 'ALL', chipColor: 'neutral' },
  { value: 'IDLE', label: 'IDLE', chipColor: 'default' },
  { value: 'PLANNING', label: 'PLANNING', chipColor: 'info' },
  { value: 'READY', label: 'READY', chipColor: 'info' },
  { value: 'STARTING', label: 'STARTING', chipColor: 'warning' },
  { value: 'RUNNING', label: 'RUNNING', chipColor: 'success' },
  { value: 'PAUSED', label: 'PAUSED', chipColor: 'warning' },
  { value: 'COMPLETED', label: 'COMPLETED', chipColor: 'info' },
  { value: 'STOPPED', label: 'STOPPED', chipColor: 'error' },
  { value: 'FAILED', label: 'FAILED', chipColor: 'error' }
]

// Derived state
const currentPage = computed(() => missionStore.pagination.currentPage)
const totalPages = computed(() => missionStore.pagination.totalPages)
const totalItems = computed(() => missionStore.pagination.totalItems)

// Search with debounce
let searchDebounce: ReturnType<typeof setTimeout> | null = null
const localSearch = ref('')

watch(localSearch, (val) => {
  if (searchDebounce) clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => {
    missionStore.setSearch(val)
  }, 300)
})

// Show toast whenever an error occurs
watch(() => missionStore.error, (newErr) => {
  if (newErr) {
    toast.add({ title: 'Error', description: newErr, color: 'error', icon: 'i-lucide-alert-circle' })
  }
})

// Helper to produce default time range: 1 month ago at 00:00 → today at 23:59 (local time)
function getDefaultDateRange() {
  const now = new Date()
  const start = new Date(now)
  start.setMonth(now.getMonth() - 1)
  start.setHours(0, 0, 0, 0)
  const end = new Date(now)
  end.setHours(23, 59, 0, 0)
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return { start: fmt(start), end: fmt(end) }
}

// Helper to produce default sort from sortColumn/sortDirection refs
function getDefaultSort() {
  const col = missionStore.sortColumn ?? 'created_at'
  const dir = missionStore.sortDirection ?? 'desc'
  return dir === 'asc' ? col : `-${col}`
}

// Format local datetime-local string to ISO-8601 with timezone offset
function formatLocalIsoOffset(val: string): string | null {
  const d = new Date(val)
  if (isNaN(d.getTime())) return null
  const pad = (n: number) => String(n).padStart(2, '0')
  const y = d.getFullYear()
  const m = pad(d.getMonth() + 1)
  const day = pad(d.getDate())
  const hh = pad(d.getHours())
  const mm = pad(d.getMinutes())
  const ss = pad(d.getSeconds())
  const offsetMinutes = -d.getTimezoneOffset()
  const offsetSign = offsetMinutes >= 0 ? '+' : '-'
  const absOffset = Math.abs(offsetMinutes)
  const offsetH = pad(Math.floor(absOffset / 60))
  const offsetM = pad(absOffset % 60)
  return `${y}-${m}-${day}T${hh}:${mm}:${ss}${offsetSign}${offsetH}:${offsetM}`
}

// Validate and apply time range to store
async function updateTimeRange() {
  await nextTick()
  const start = startDateTime.value ? formatLocalIsoOffset(startDateTime.value) : null
  const end = endDateTime.value ? formatLocalIsoOffset(endDateTime.value) : null
  console.log('[Missions] updateTimeRange called:', { start, end })

  if (start && end) {
    const dStart = new Date(start)
    const dEnd = new Date(end)
    if (!isNaN(dStart.getTime()) && !isNaN(dEnd.getTime())) {
      if (dStart > dEnd) {
        console.error('Invalid time range: Start time is after end time')
        missionStore.missions = []
        missionStore.pagination.totalItems = 0
        missionStore.pagination.totalPages = 0
        missionStore.error = 'Start time cannot be after end time.'
        return
      }
    }
  }
  missionStore.setTimeRange(start, end)
}

// Sync with URL query
onMounted(async () => {
  // Set default time range (1 month ago to today) on first load
  const defaults = getDefaultDateRange()
  startDateTime.value = defaults.start
  endDateTime.value = defaults.end
  missionStore.setTimeRange(
    formatLocalIsoOffset(defaults.start),
    formatLocalIsoOffset(defaults.end)
  )

  // Set default sort (created_at desc)
  const defaultSort = getDefaultSort()
  missionStore.sortColumn = defaultSort.startsWith('-') ? defaultSort.slice(1) : defaultSort
  missionStore.sortDirection = defaultSort.startsWith('-') ? 'desc' : 'asc'

  if (route.query.search) {
    localSearch.value = route.query.search as string
    missionStore.setSearch(route.query.search as string)
  }
  if (route.query.status) {
    missionStore.setStatusFilter(route.query.status as MissionStatus5 | 'all')
  }
  await missionStore.fetchMissions()
})

        watch(() => route.query.search, (val) => {
  localSearch.value = val as string
})

// Status filter: sync to URL and always refetch
watch(() => missionStore.statusFilter, (val) => {
  if (val === 'all') {
    router.replace({ query: { ...route.query, status: undefined } })
  } else {
    router.replace({ query: { ...route.query, status: val } })
  }
  missionStore.fetchMissions()
})

// Actions
function onCreateNew() {
  router.push('/missions/new')
}

function onSortFieldChange(field: string) {
  if (missionStore.sortColumn === field) {
    // Same field clicked — flip direction
    missionStore.toggleSort(field)
  } else {
    missionStore.sortColumn = field
    missionStore.sortDirection = 'desc'
    missionStore.fetchMissions()
  }
}

function onSortDirectionToggle() {
  if (!missionStore.sortColumn) return
  missionStore.toggleSort(missionStore.sortColumn)
}

function onViewMission(id: string) {
  router.push(`/missions/${id}`)
}

function onDeleteMission(id: string) {
  const mission = missionStore.missions.find(m => m.id === id)
  deleteTargetId.value = id
  deleteTargetName.value = mission?.name ?? ''
  showDeleteConfirm.value = true
}

async function confirmDelete() {
  const id = deleteTargetId.value
  if (!id) return
  try {
    await missionStore.deleteMission(id)
    toast.add({
      title: 'Mission deleted',
      description: 'The mission has been removed.',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
  } catch (e: any) {
    toast.add({
      title: 'Delete failed',
      description: e?.message || 'Could not delete mission.',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    showDeleteConfirm.value = false
    deleteTargetId.value = null
    deleteTargetName.value = ''
  }
}

function onPageChange(page: number) {
  missionStore.setPage(page)
}

// Helpers
function disabledBtnClass(_disabled?: boolean) {
  // No-op: lifecycle buttons now use v-if rules instead of :disabled styles.
  return ''
}

// ── Mission lifecycle button rules (see backend API rules) ─────────────────
// start   : allowed from IDLE, READY, STOPPED, FAILED
// pause   : allowed only from RUNNING
// resume  : allowed only from PAUSED
// stop    : allowed from STARTING, RUNNING, PAUSED
// terminal: COMPLETED, STOPPED, FAILED — no actions (except STOPPED/FAILED can restart)
function canStart(status: MissionStatus5): boolean {
  return status === 'READY'
}
function canPause(status: MissionStatus5): boolean {
  return status === 'RUNNING'
}
function canResume(status: MissionStatus5): boolean {
  return status === 'PAUSED'
}
function canStop(status: MissionStatus5): boolean {
  return status === 'STARTING' || status === 'RUNNING' || status === 'PAUSED'
}
function isTerminal(status: MissionStatus5): boolean {
  return status === 'COMPLETED'
}
// delete: only allowed when mission is not actively running/planning/starting/paused/completed
function canDelete(status: MissionStatus5): boolean {
  return status === 'IDLE' || status === 'STOPPED' || status === 'FAILED'
}

// Track which (mission, action) is currently in flight so per-card buttons
// can show their own loading state without disabling every card globally.
const pendingActionFor = ref<string | null>(null)
function isActionPending(missionId: string): boolean {
  // While one action is in flight, block other actions on the same card.
  if (!missionStore.saving || pendingActionFor.value === null) return false
  return pendingActionFor.value.startsWith(missionId + ':')
}

async function onAction(missionId: string, action: 'start' | 'pause' | 'resume' | 'stop') {
  const key = `${missionId}:${action}`
  pendingActionFor.value = key
  try {
    await missionStore.patchMissionStatus(missionId, action)
    toast.add({
      title: humanAction(action) + ' succeeded',
      description: `Mission is now ${humanResult(action)}.`,
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
  } catch (e: any) {
    // 409 = status mismatch on backend; anything else = generic failure.
    const status = e?.status ?? e?.response?.status
    const isConflict = status === 409
    toast.add({
      title: isConflict ? 'Action not allowed' : 'Action failed',
      description:
        e?.message
        || (isConflict
          ? 'The mission is not in a state that allows this action. Please refresh and try again.'
          : 'Could not update the mission. Please try again.'),
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    if (pendingActionFor.value === key) pendingActionFor.value = null
  }
}

function humanAction(action: 'start' | 'pause' | 'resume' | 'stop'): string {
  return action.charAt(0).toUpperCase() + action.slice(1)
}
function humanResult(action: 'start' | 'pause' | 'resume' | 'stop'): string {
  if (action === 'start') return 'starting'
  if (action === 'pause') return 'paused'
  if (action === 'resume') return 'running'
  return 'stopped'
}

function formatDate(isoStr: string): string {
  if (!isoStr) return '—'
  return new Date(isoStr).toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
function formatDateTimeInput(val: string | null): string {
  if (!val) return '—'
  return new Date(val).toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}
// True when a time range has been explicitly set by the user
const isTimeRangeActive = computed(() => Boolean(startDateTime.value && endDateTime.value))

function getStatusBadgeProps(status: MissionStatus5) {
  const map: Record<MissionStatus5, { color: 'success' | 'warning' | 'error' | 'info' | 'primary' | 'neutral'; label: string }> = {
    IDLE: { color: 'neutral', label: 'IDLE' },
    PLANNING: { color: 'info', label: 'PLANNING' },
    READY: { color: 'info', label: 'READY' },
    STARTING: { color: 'warning', label: 'STARTING' },
    RUNNING: { color: 'success', label: 'RUNNING' },
    PAUSED: { color: 'warning', label: 'PAUSED' },
    COMPLETED: { color: 'info', label: 'COMPLETED' },
    STOPPED: { color: 'error', label: 'STOPPED' },
    FAILED: { color: 'error', label: 'FAILED' }
  }
  return map[status] ?? { color: 'neutral', label: status }
}
</script>

<template>
  <div class="p-4 md:p-6 max-w-5xl mx-auto min-h-screen">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-xl font-semibold text-highlighted">Mission Planner</h1>
        <p class="text-sm text-muted mt-1">
          Plan, track, and execute drone missions
        </p>
      </div>
      <!-- Breadcrumb -->
      <div class="flex items-center gap-2 text-sm text-muted">
        <NuxtLink to="/" class="flex items-center gap-1 text-primary hover:text-accented transition-colors">
          <Icon name="lucide:home" class="text-base shrink-0" aria-hidden="true" />
          Home
        </NuxtLink>
        <span class="text-muted">›</span>
        <span class="flex items-center gap-1 text-highlighted">
          <Icon name="lucide:rocket" class="text-base shrink-0" aria-hidden="true" />
          Mission Planner
        </span>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-primary/5 border border-muted rounded-md p-4 mb-6 flex flex-wrap gap-4 items-end">
      <!-- Search -->
      <div class="flex-1 min-w-[200px]">
        <label class="block text-sm font-medium text-muted mb-1">Search</label>
        <UInput
          v-model="localSearch"
          icon="i-lucide-search"
          placeholder="Search missions..."
          class="w-full"
        />
      </div>

      <!-- Status filter -->
      <div class="min-w-[160px]">
        <label class="block text-sm font-medium text-muted mb-1">Status</label>
        <USelect
          :items="statusOptions"
          v-model="missionStore.statusFilter"
          value-key="value"
          class="w-full"
        >
          <template #default="{ modelValue }">
            <span
              v-if="modelValue && modelValue !== 'all'"
              :class="[
                'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wide',
                statusOptions.find(s => s.value === modelValue)?.chipColor === 'success' && 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
                statusOptions.find(s => s.value === modelValue)?.chipColor === 'warning' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
                statusOptions.find(s => s.value === modelValue)?.chipColor === 'error' && 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
                statusOptions.find(s => s.value === modelValue)?.chipColor === 'info' && 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
                statusOptions.find(s => s.value === modelValue)?.chipColor === 'default' && 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
                statusOptions.find(s => s.value === modelValue)?.chipColor === 'neutral' && 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
              ]"
            >
              {{ statusOptions.find(s => s.value === modelValue)?.label }}
            </span>
            <span v-else-if="modelValue === 'all'">ALL</span>
            <span v-else class="text-muted">Select status</span>
          </template>
          <template #item-label="{ item }">
            <span
              :class="[
                'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wide',
                item.chipColor === 'success' && 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
                item.chipColor === 'warning' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
                item.chipColor === 'error' && 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
                item.chipColor === 'info' && 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
                item.chipColor === 'default' && 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
                item.chipColor === 'neutral' && 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
              ]"
            >
              {{ item.label }}
            </span>
          </template>
        </USelect>
      </div>

      <!-- Time range -->
      <div class="min-w-[180px]">
        <label class="block text-sm font-medium text-muted mb-1">Start Time</label>
        <UInput
          :model-value="startDateTime ?? ''"
          type="datetime-local"
          class="w-full"
          @update:model-value="(v: string) => { startDateTime = v || null; updateTimeRange() }"
        />
      </div>
      <div class="min-w-[180px]">
        <label class="block text-sm font-medium text-muted mb-1">End Time</label>
        <UInput
          :model-value="endDateTime ?? ''"
          type="datetime-local"
          class="w-full"
          @update:model-value="(v: string) => { endDateTime = v || null; updateTimeRange() }"
        />
      </div>
    </div>

    <!-- Sort + Action row -->
    <div class="flex items-center justify-between mb-4">
      <!-- Sort group (left-aligned) -->
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-muted">Sort</span>
        <UButtonGroup size="sm" color="neutral" variant="outline">
          <UButton
            v-for="field in MISSION_SORT_FIELDS"
            :key="field.value"
            :color="missionStore.sortColumn === field.value ? 'primary' : 'neutral'"
            :variant="missionStore.sortColumn === field.value ? 'solid' : 'ghost'"
            :title="`Sort by ${field.label}`"
            @click="onSortFieldChange(field.value)"
          >
            <span class="text-xs font-semibold uppercase">{{ field.label }}</span>
          </UButton>
        </UButtonGroup>
        <UButton
          :icon="missionStore.sortDirection === 'asc' ? 'i-lucide-arrow-down-wide-narrow' : 'i-lucide-arrow-up-narrow-wide'"
          size="sm"
          color="neutral"
          variant="outline"
          :title="missionStore.sortDirection === 'asc' ? 'Ascending — click for newest first' : 'Descending — click for oldest first'"
          @click="onSortDirectionToggle"
        >
          <span class="ml-1 text-xs font-semibold uppercase">{{ missionStore.sortDirection }}</span>
        </UButton>
      </div>
      <!-- New Mission button (right-aligned) -->
      <UButton
        icon="i-lucide-plus"
        label="New Mission"
        @click="onCreateNew"
      />
    </div>

    <!-- Content -->
    <template v-if="missionStore.loading">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="i in 6"
          :key="i"
          class="bg-elevated border border-muted rounded-lg p-4"
        >
          <!-- Header row: title + status badge -->
          <div class="flex items-start justify-between mb-3 gap-2">
            <USkeleton class="h-5 w-2/3" />
            <USkeleton class="h-5 w-16 rounded-md" />
          </div>
          <!-- Description -->
          <USkeleton class="h-4 w-full mb-1" />
          <USkeleton class="h-4 w-5/6 mb-3" />
          <!-- Timestamps + locations count -->
          <div class="flex items-center gap-4 mb-3">
            <USkeleton class="h-3 w-32" />
            <USkeleton class="h-3 w-20 ml-auto" />
          </div>
          <!-- Actions row -->
          <div class="flex items-center gap-2 pt-3 border-t border-muted">
            <USkeleton class="h-6 w-14 rounded" />
            <USkeleton class="h-6 w-14 rounded" />
            <USkeleton class="h-6 w-14 rounded ml-auto" />
          </div>
        </div>
      </div>
    </template>

    <UAlert
      v-else-if="missionStore.error"
      color="error"
      icon="i-lucide-alert-circle"
      title="Failed to load missions"
      :description="missionStore.error"
      variant="soft"
    >
      <template #footer>
        <UButton
          label="Retry"
          variant="outline"
          @click="missionStore.fetchMissions()"
        />
      </template>
    </UAlert>

    <!-- Empty state -->
    <div
      v-else-if="missionStore.missions.length === 0"
      class="flex flex-col items-center justify-center py-16 text-muted"
    >
      <span class="i-lucide-plane text-4xl mb-3" />
      <template v-if="isTimeRangeActive && !localSearch && missionStore.statusFilter === 'all'">
        <p class="text-lg font-medium text-highlighted">
          No missions found for time range {{ formatDateTimeInput(startDateTime) }} to {{ formatDateTimeInput(endDateTime) }}
        </p>
        <p class="text-sm mt-1">Try adjusting your time range filter</p>
      </template>
      <template v-else-if="isTimeRangeActive && localSearch && missionStore.statusFilter === 'all'">
        <p class="text-lg font-medium text-highlighted">
          No missions found for time range {{ formatDateTimeInput(startDateTime) }} to {{ formatDateTimeInput(endDateTime) }} and search keyword "{{ localSearch }}"
        </p>
        <p class="text-sm mt-1">Try adjusting your time range or search keywords</p>
      </template>
      <template v-else-if="isTimeRangeActive && !localSearch && missionStore.statusFilter !== 'all'">
        <p class="text-lg font-medium text-highlighted">
          No missions found for time range {{ formatDateTimeInput(startDateTime) }} to {{ formatDateTimeInput(endDateTime) }} and status {{ missionStore.statusFilter }}
        </p>
        <p class="text-sm mt-1">Try adjusting your time range or status filter</p>
      </template>
      <template v-else-if="isTimeRangeActive && localSearch && missionStore.statusFilter !== 'all'">
        <p class="text-lg font-medium text-highlighted">
          No missions found for time range {{ formatDateTimeInput(startDateTime) }} to {{ formatDateTimeInput(endDateTime) }} and status {{ missionStore.statusFilter }} and search keyword "{{ localSearch }}"
        </p>
        <p class="text-sm mt-1">Try adjusting your time range, status filter, or search keywords</p>
      </template>
      <template v-else-if="missionStore.statusFilter === 'all' && !localSearch">
        <p class="text-lg font-medium text-highlighted">No missions yet</p>
        <p class="text-sm mt-1">Create your first mission to get started</p>
        <UButton
          icon="i-lucide-plus"
          label="New Mission"
          class="mt-4"
          @click="onCreateNew"
        />
      </template>
      <template v-else-if="localSearch && missionStore.statusFilter !== 'all'">
        <p class="text-lg font-medium text-highlighted">
          No missions found for status {{ missionStore.statusFilter }} and search keyword "{{ localSearch }}"
        </p>
        <p class="text-sm mt-1">Try adjusting your filters or search keywords</p>
      </template>
      <template v-else-if="localSearch">
        <p class="text-lg font-medium text-highlighted">
          No missions found for search keyword "{{ localSearch }}"
        </p>
        <p class="text-sm mt-1">Try a different search keyword</p>
      </template>
      <template v-else>
        <p class="text-lg font-medium text-highlighted">
          No missions found for status {{ missionStore.statusFilter }}
        </p>
        <p class="text-sm mt-1">Try a different status filter</p>
      </template>
    </div>

    <!-- Mission grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="mission in missionStore.missions"
        :key="mission.id"
        class="bg-elevated border border-muted rounded-lg p-4 hover:border-accented transition-colors"
      >
        <!-- Header row -->
        <div class="flex items-start justify-between mb-3">
          <div class="flex-1 min-w-0">
            <h3
              class="font-medium text-highlighted truncate cursor-pointer hover:text-primary"
              @click="onViewMission(mission.id)"
            >
              {{ mission.name }}
            </h3>
          </div>
          <UBadge
            :color="getStatusBadgeProps(mission.status).color"
            variant="subtle"
            size="sm"
          >
            {{ getStatusBadgeProps(mission.status).label }}
          </UBadge>
        </div>

        <!-- Description -->
        <p
          v-if="mission.description"
          class="text-sm text-muted mb-3 line-clamp-2"
        >
          {{ mission.description }}
        </p>
        <p
          v-else
          class="text-sm text-muted mb-3 italic"
        >
          no description
        </p>

        <!-- Timestamps + locations count -->
        <div class="flex items-center gap-4 text-xs text-muted mb-3">
          <span>Created: {{ formatDate(mission.created_at) }}</span>
          <div
            class="ml-auto inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/5 px-2 py-1 text-xs text-default"
            :title="`${mission.visited_locations ?? 0} of ${mission.location_count ?? mission.total_locations ?? 0} locations visited (${(mission.progress_percent ?? 0).toFixed(1)}%)`"
          >
            <Icon name="lucide:map-pin" class="size-3.5 shrink-0 text-muted" aria-hidden="true" />
            <span class="font-mono">
              {{ mission.visited_locations ?? 0 }} / {{ mission.location_count ?? mission.total_locations ?? 0 }}
              <span v-if="mission.progress_percent !== undefined">({{ mission.progress_percent.toFixed(1) }}%)</span>
            </span>
            <span class="text-muted">locations</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2 pt-3 border-t border-muted">
          <UButton
            size="xs"
            variant="ghost"
            color="info"
            icon="i-lucide-eye"
            label="View"
            @click="onViewMission(mission.id)"
          />
          <!-- Start: allowed from IDLE, READY, STOPPED, FAILED -->
          <UButton
            v-if="canStart(mission.status)"
            size="xs"
            variant="ghost"
            color="success"
            icon="i-lucide-play"
            label="Start"
            :loading="missionStore.saving && pendingActionFor === mission.id + ':start'"
            :disabled="isActionPending(mission.id)"
            @click="onAction(mission.id, 'start')"
          />
          <!-- Pause: allowed only from RUNNING -->
          <UButton
            v-if="canPause(mission.status)"
            size="xs"
            variant="ghost"
            color="warning"
            icon="i-lucide-pause"
            label="Pause"
            :loading="missionStore.saving && pendingActionFor === mission.id + ':pause'"
            :disabled="isActionPending(mission.id)"
            @click="onAction(mission.id, 'pause')"
          />
          <!-- Resume: allowed only from PAUSED -->
          <UButton
            v-if="canResume(mission.status)"
            size="xs"
            variant="ghost"
            color="primary"
            icon="i-lucide-play"
            label="Resume"
            :loading="missionStore.saving && pendingActionFor === mission.id + ':resume'"
            :disabled="isActionPending(mission.id)"
            @click="onAction(mission.id, 'resume')"
          />
          <!-- Stop: allowed from STARTING, RUNNING, PAUSED -->
          <UButton
            v-if="canStop(mission.status)"
            size="xs"
            variant="ghost"
            color="error"
            icon="i-lucide-square"
            label="Stop"
            :loading="missionStore.saving && pendingActionFor === mission.id + ':stop'"
            :disabled="isActionPending(mission.id)"
            @click="onAction(mission.id, 'stop')"
          />
          <!-- Terminal status hint: shows nothing actionable -->
          <span
            v-if="isTerminal(mission.status)"
            class="text-xs text-muted italic ml-1"
          >
            Terminal — no actions
          </span>
          <div class="ml-auto flex items-center gap-1">
            <UButton
              size="xs"
              variant="ghost"
              :color="canDelete(mission.status) ? 'error' : 'neutral'"
              icon="i-lucide-trash-2"
              title="Delete mission (only available when IDLE, STOPPED or FAILED)"
              :disabled="!canDelete(mission.status)"
              @click="onDeleteMission(mission.id)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div
      v-if="totalPages > 1"
      class="flex justify-center mt-6"
    >
      <UPagination
        :page="currentPage"
        :total="totalItems"
        :items-per-page="missionStore.pagination.limit"
        @update:page="onPageChange"
      />
    </div>

    <!-- Delete Confirmation Popup -->
    <div
      v-if="showDeleteConfirm"
      class="fixed inset-0 z-[1300] flex items-center justify-center p-4"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/50 backdrop-blur-sm"
        @click="showDeleteConfirm = false"
      />
      <!-- Popup -->
      <div class="relative bg-default border border-muted rounded-lg shadow-lg w-full max-w-sm p-5">
        <div class="flex items-start gap-3">
          <div class="shrink-0 w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
            <Icon name="lucide:alert-triangle" class="text-red-500 text-lg shrink-0" aria-hidden="true" />
          </div>
          <div>
            <h3 class="text-sm font-semibold text-highlighted">Delete Mission</h3>
            <p class="text-xs text-muted mt-1">
              Are you sure you want to delete
              <span class="text-red-500 font-semibold">{{ deleteTargetName }}</span>
              mission? This action cannot be undone.
            </p>
          </div>
        </div>
        <div class="flex items-center justify-end gap-2 mt-5">
          <UButton
            size="xs"
            variant="ghost"
            label="Cancel"
            @click="showDeleteConfirm = false"
          />
          <UButton
            size="xs"
            color="error"
            label="Delete"
            :loading="false"
            @click="confirmDelete"
          />
        </div>
      </div>
    </div>
  </div>
</template>
