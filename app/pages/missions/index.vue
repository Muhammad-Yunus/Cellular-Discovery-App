<script setup lang="ts">
import type { MissionStatus5 } from '~/types/mission'
import { useCollectorMissionStore } from '~/stores/mission'
import { useCustomToast } from '~/composables/useCustomToast'

definePageMeta({ title: 'Mission Planner' })

const toast = useCustomToast()
const missionStore = useCollectorMissionStore()
const router = useRouter()
const route = useRoute()
const deleteTargetId = ref<string | null>(null)
const deleteTargetName = ref<string>('')
const showDeleteConfirm = ref(false)

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

// Sync with URL query
onMounted(async () => {
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

// Error toast
watch(() => missionStore.error, (err) => {
  if (err) {
    toast.add({
      title: 'Error',
      description: err,
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
})

// Actions
function onCreateNew() {
  router.push('/missions/new')
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
  return status === 'IDLE' || status === 'READY' || status === 'STOPPED' || status === 'FAILED'
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

function getStatusBadgeProps(status: MissionStatus5) {
  const map: Record<MissionStatus5, { color: 'success' | 'warning' | 'error' | 'info' | 'primary' | 'neutral' | 'default'; label: string }> = {
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
    <div class="flex items-center justify-between mb-6">
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

      <!-- New Mission button (aligned right in a new row) -->
      <div class="ml-auto w-full flex justify-end mt-3">
        <UButton
          icon="i-lucide-plus"
          label="New Mission"
          @click="onCreateNew"
        />
      </div>
    </div>

    <!-- Content -->
    <template v-if="missionStore.loading">
      <div class="space-y-3">
        <USkeleton v-for="i in 5" :key="i" class="h-20 w-full" />
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
      <template v-if="missionStore.statusFilter === 'all' && !localSearch">
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
          <span class="ml-auto">{{ mission.location_count ?? 0 }} locations</span>
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
              color="error"
              icon="i-lucide-trash-2"
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
