<script setup lang="ts">
import type { MissionStatus5 } from '~/types/mission'
import { useCollectorMissionStore } from '~/stores/mission'
import { useCustomToast } from '~/composables/useCustomToast'

definePageMeta({ title: 'Mission Planner' })

const toast = useCustomToast()
const missionStore = useCollectorMissionStore()
const router = useRouter()
const route = useRoute()

const statusOptions = ['all', 'draft', 'active', 'paused', 'completed', 'cancelled']

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

// Status filter sync - only update URL when leaving the component
const isUpdatingFromUrl = ref(false)
watch(() => route.query.status, (val) => {
  if (val && !isUpdatingFromUrl.value) {
    isUpdatingFromUrl.value = true
    missionStore.setStatusFilter(val as MissionStatus5 | 'all')
    setTimeout(() => { isUpdatingFromUrl.value = false }, 100)
  }
}, { immediate: true })

watch(() => missionStore.statusFilter, (val) => {
  if (!isUpdatingFromUrl.value) {
    isUpdatingFromUrl.value = true
    if (val === 'all') {
      router.replace({ query: { ...route.query, status: undefined } })
    } else {
      router.replace({ query: { ...route.query, status: val } })
    }
    setTimeout(() => { isUpdatingFromUrl.value = false }, 100)
  }
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

async function onDeleteMission(id: string) {
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
  }
}

function onPageChange(page: number) {
  missionStore.setPage(page)
}

// Helpers
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
    draft: { color: 'neutral', label: 'Draft' },
    active: { color: 'success', label: 'Active' },
    paused: { color: 'warning', label: 'Paused' },
    completed: { color: 'info', label: 'Completed' },
    cancelled: { color: 'error', label: 'Cancelled' }
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
      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-plus"
          label="New Mission"
          @click="onCreateNew"
        />
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
          :options="statusOptions"
          v-model="missionStore.statusFilter"
          class="w-full"
        />
      </div>

      <!-- Results count -->
      <div class="ml-auto text-sm text-muted pb-1">
        {{ totalItems }} mission{{ totalItems !== 1 ? 's' : '' }}
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
      <p class="text-lg font-medium text-highlighted">No missions yet</p>
      <p class="text-sm mt-1">Create your first mission to get started</p>
      <UButton
        icon="i-lucide-plus"
        label="New Mission"
        class="mt-4"
        @click="onCreateNew"
      />
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
            <p class="text-xs text-muted mt-0.5">
              {{ mission.location_count ?? 0 }} locations
            </p>
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

        <!-- Timestamps -->
        <div class="flex items-center gap-4 text-xs text-muted mb-3">
          <span>Created: {{ formatDate(mission.created_at) }}</span>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2 pt-3 border-t border-muted">
          <UButton
            size="xs"
            variant="ghost"
            icon="i-lucide-eye"
            label="View"
            @click="onViewMission(mission.id)"
          />
          <UButton
            size="xs"
            variant="ghost"
            icon="i-lucide-play"
            label="Start"
            :disabled="mission.status !== 'draft' && mission.status !== 'paused'"
            @click="missionStore.patchMissionStatus(mission.id, 'start')"
          />
          <UButton
            size="xs"
            variant="ghost"
            icon="i-lucide-pause"
            label="Pause"
            :disabled="mission.status !== 'active'"
            @click="missionStore.patchMissionStatus(mission.id, 'pause')"
          />
          <UButton
            size="xs"
            variant="ghost"
            icon="i-lucide-check"
            label="Complete"
            :disabled="mission.status !== 'active' && mission.status !== 'paused'"
            @click="missionStore.patchMissionStatus(mission.id, 'complete')"
          />
          <UButton
            size="xs"
            variant="ghost"
            icon="i-lucide-flag"
            label="Cancel"
            :disabled="mission.status === 'completed' || mission.status === 'cancelled'"
            @click="missionStore.patchMissionStatus(mission.id, 'cancel')"
          />
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
  </div>
</template>
