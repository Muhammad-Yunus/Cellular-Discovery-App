<!-- app/pages/missions/[id]/index.vue -->
<script setup lang="ts">
import { onMounted, onUnmounted, watch, ref } from 'vue'
import MissionTimeline from '~/components/MissionTimeline.vue'
definePageMeta({
  layout: 'default',
  title: 'Mission detail'
})

const route = useRoute()
const router = useRouter()
const missionId = route.params.id as string

const missionStore = useCollectorMissionStore()
const toast = useCustomToast()

// Tabs
type TabKey = 'locations' | 'route' | 'scans' | 'logs'
const activeTab = ref<TabKey>('locations')

const tabs: { key: TabKey; label: string; icon: string }[] = [
  { key: 'locations', label: 'Locations', icon: 'lucide:map-pin' },
  { key: 'route', label: 'Route', icon: 'lucide:route' },
  { key: 'scans', label: 'Tower Scans', icon: 'lucide:radar' },
  { key: 'logs', label: 'Logs', icon: 'lucide:file-text' }
]

onMounted(async () => {
  // Always load the mission matching the URL path from
  // GET /missions/{mission_id} so the detail view shows the correct
  // record rather than the last-inserted mission in the cached list.
  try {
    await missionStore.fetchMissionById(missionId)
    await missionStore.fetchLocations(missionId)
  } catch (e: any) {
    if (e?.status === 404) {
      toast.add({
        title: 'Mission not found',
        description: e?.message ?? 'The mission does not exist.',
        color: 'error',
        icon: 'i-lucide-alert-circle'
      })
      router.replace('/missions')
    }
  }
})

// If the user navigates between /missions/{a} -> /missions/{b} without
// remounting, refetch for the new id.
watch(
  () => missionId,
  async (newId) => {
    if (!newId) return
    if (missionStore.selectedMissionId === newId) return
    try {
      await missionStore.fetchMissionById(newId)
      await missionStore.fetchLocations(newId)
    } catch (e: any) {
      if (e?.status === 404) {
        toast.add({
          title: 'Mission not found',
          description: e?.message ?? 'The mission does not exist.',
          color: 'error',
          icon: 'i-lucide-alert-circle'
        })
        router.replace('/missions')
      }
    }
  }
)

// ── Polling state ─────────────────────────────────────────────────────────
const POLLING_INTERVAL_MS = 5000 // 5 seconds
let missionPollTimer: ReturnType<typeof setTimeout> | null = null
let locationsPollTimer: ReturnType<typeof setTimeout> | null = null
let routePollTimer: ReturnType<typeof setTimeout> | null = null
let scansPollTimer: ReturnType<typeof setTimeout> | null = null
let logsPollTimer: ReturnType<typeof setTimeout> | null = null

/** Get current mission status from store */
function getMissionStatus(): string {
  return missionStore.selectedMission?.status ?? ''
}

/** Check if mission is currently running */
function isRunning(): boolean {
  return getMissionStatus() === 'RUNNING'
}

/**
 * Poll mission detail. Always called when status is RUNNING.
 */
async function pollMission() {
  if (!isRunning()) return
  try {
    await missionStore.fetchMissionById(missionId)
  } catch (e) {
    // Silently ignore polling errors to avoid spamming the console
    console.debug('[poll] mission detail failed:', e)
  }
  // Schedule next poll
  missionPollTimer = setTimeout(pollMission, POLLING_INTERVAL_MS)
}

/**
 * Poll locations tab data. Only when tab is active AND mission is running.
 */
async function pollLocations() {
  if (!isRunning() || activeTab.value !== 'locations') return
  try {
    await missionStore.fetchLocations(missionId)
  } catch (e) {
    console.debug('[poll] locations failed:', e)
  }
  locationsPollTimer = setTimeout(pollLocations, POLLING_INTERVAL_MS)
}

/**
 * Poll route tab data. Only when tab is active AND mission is running.
 */
async function pollRoute() {
  if (!isRunning() || activeTab.value !== 'route') return
  try {
    await missionStore.fetchRoute(missionId)
  } catch (e) {
    console.debug('[poll] route failed:', e)
  }
  routePollTimer = setTimeout(pollRoute, POLLING_INTERVAL_MS)
}

/**
 * Poll scans tab data. Only when tab is active AND mission is running.
 */
async function pollScans() {
  if (!isRunning() || activeTab.value !== 'scans') return
  try {
    window.dispatchEvent(new CustomEvent('refresh-scan-list'))
  } catch (e) {
    console.debug('[poll] scans failed:', e)
  }
  scansPollTimer = setTimeout(pollScans, POLLING_INTERVAL_MS)
}

/**
 * Poll logs tab data. Only when tab is active AND mission is running.
 */
async function pollLogs() {
  if (!isRunning() || activeTab.value !== 'logs') return
  try {
    window.dispatchEvent(new CustomEvent('refresh-log-list'))
  } catch (e) {
    console.debug('[poll] logs failed:', e)
  }
  logsPollTimer = setTimeout(pollLogs, POLLING_INTERVAL_MS)
}

/**
 * Start polling for mission detail when status changes to RUNNING.
 * Also start polling for active tab data.
 */
function startPolling() {
  // Clear any existing timers
  if (missionPollTimer) clearTimeout(missionPollTimer)
  if (locationsPollTimer) clearTimeout(locationsPollTimer)
  if (routePollTimer) clearTimeout(routePollTimer)
  if (scansPollTimer) clearTimeout(scansPollTimer)
  if (logsPollTimer) clearTimeout(logsPollTimer)

  // Start mission detail polling
  pollMission()

  // Start polling for active tab if running
  if (isRunning()) {
    switch (activeTab.value) {
      case 'locations':
        pollLocations()
        break
      case 'route':
        pollRoute()
        break
      case 'scans':
        pollScans()
        break
      case 'logs':
        pollLogs()
        break
    }
  }
}

/**
 * Stop all polling timers.
 */
function stopPolling() {
  if (missionPollTimer) {
    clearTimeout(missionPollTimer)
    missionPollTimer = null
  }
  if (locationsPollTimer) {
    clearTimeout(locationsPollTimer)
    locationsPollTimer = null
  }
  if (routePollTimer) {
    clearTimeout(routePollTimer)
    routePollTimer = null
  }
  if (scansPollTimer) {
    clearTimeout(scansPollTimer)
    scansPollTimer = null
  }
  if (logsPollTimer) {
    clearTimeout(logsPollTimer)
    logsPollTimer = null
  }
}

// Watch mission status to start/stop polling
let previousStatus = getMissionStatus()
watch(
  () => getMissionStatus(),
  (newStatus) => {
    // Stop polling if mission is no longer running
    if (previousStatus === 'RUNNING' && newStatus !== 'RUNNING') {
      stopPolling()
    }
    // Start polling if mission just became running
    if (newStatus === 'RUNNING' && previousStatus !== 'RUNNING') {
      startPolling()
    }
    previousStatus = newStatus
  }
)

// Watch active tab to start/stop tab-specific polling
watch(
  () => activeTab.value,
  (newTab, oldTab) => {
    // Stop polling for old tab if it was active and mission is running
    if (isRunning() && oldTab === 'locations') {
      if (locationsPollTimer) {
        clearTimeout(locationsPollTimer)
        locationsPollTimer = null
      }
    }
    if (isRunning() && oldTab === 'route') {
      if (routePollTimer) {
        clearTimeout(routePollTimer)
        routePollTimer = null
      }
    }
    if (isRunning() && oldTab === 'scans') {
      if (scansPollTimer) {
        clearTimeout(scansPollTimer)
        scansPollTimer = null
      }
    }
    if (isRunning() && oldTab === 'logs') {
      if (logsPollTimer) {
        clearTimeout(logsPollTimer)
        logsPollTimer = null
      }
    }

    // Start polling for new tab if mission is running
    if (isRunning()) {
      switch (newTab) {
        case 'locations':
          pollLocations()
          break
        case 'route':
          pollRoute()
          break
        case 'scans':
          pollScans()
          break
        case 'logs':
          pollLogs()
          break
      }
    }
  }
)

onMounted(async () => {
  // Always load the mission matching the URL path from
  // GET /missions/{mission_id} so the detail view shows the correct
  // record rather than the last-inserted mission in the cached list.
  try {
    await missionStore.fetchMissionById(missionId)
    await missionStore.fetchLocations(missionId)
  } catch (e: any) {
    if (e?.status === 404) {
      toast.add({
        title: 'Mission not found',
        description: e?.message ?? 'The mission does not exist.',
        color: 'error',
        icon: 'i-lucide-alert-circle'
      })
      router.replace('/missions')
      return
    }
  }

  // Start polling if mission is already running
  if (isRunning()) {
    startPolling()
  }
})

// Clean up polling timers on unmount
onUnmounted(() => {
  stopPolling()
})

function canStart(status: string): boolean {
  return status === 'READY'
}
function canPause(status: string): boolean {
  return status === 'RUNNING'
}
function canResume(status: string): boolean {
  return status === 'PAUSED'
}
function canStop(status: string): boolean {
  return status === 'STARTING' || status === 'RUNNING' || status === 'PAUSED'
}
function canPlan(status: string, locationCount: number): boolean {
  return status === 'IDLE' && locationCount > 0
}
function isTerminal(status: string): boolean {
  return status === 'COMPLETED'
}
function getStatusBadgeProps(status: string) {
  const map: Record<string, { color: string; label: string }> = {
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

const pendingActionFor = ref<string | null>(null)
function isActionPending(): boolean {
  if (!missionStore.saving || pendingActionFor.value === null) return false
  return pendingActionFor.value.startsWith(missionId + ':')
}

async function onStatusChange(action: 'start' | 'pause' | 'resume' | 'stop') {
  const key = `${missionId}:${action}`
  pendingActionFor.value = key
  try {
    const result = await missionStore.patchMissionStatus(missionId, action)
    // Surface the server response message in a toast instead of a popup alert.
    // `result` is the MissionRecord returned by /missions/{id}/{action}.
    const serverMessage =
      (result as any)?.message ??
      (result as any)?.detail ??
      (result as any)?.status_message ??
      `Mission ${action} request succeeded.`
    toast.add({
      title: `Mission ${action}`,
      description: String(serverMessage),
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
    // Status badge will auto-update via fetchMissions() inside the store.
  } catch (e: any) {
    const status = e?.status ?? e?.response?.status
    const isConflict = status === 409
    const errMessage =
      (e?.data?.detail as string | undefined) ??
      (e?.response?.data?.detail as string | undefined) ??
      (typeof e?.message === 'string' ? e.message : null) ??
      'Unknown error'
    toast.add({
      title: `Mission ${action} failed`,
      description: isConflict
        ? 'Action not allowed — the mission is not in a state that supports this action.'
        : errMessage,
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    if (pendingActionFor.value === key) pendingActionFor.value = null
  }
}

async function onPlan() {
  const key = `${missionId}:plan`
  pendingActionFor.value = key
  try {
    await missionStore.planMission(missionId)
    toast.add({
      title: 'Mission plan requested',
      description: 'The mission is being planned.',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
  } catch (e: any) {
    const status = e?.status ?? e?.response?.status
    const isConflict = status === 409
    const errMessage =
      (e?.data?.detail as string | undefined) ??
      (e?.response?.data?.detail as string | undefined) ??
      (typeof e?.message === 'string' ? e.message : null) ??
      'Unknown error'
    toast.add({
      title: 'Plan failed',
      description: isConflict
        ? 'Plan failed — the mission is not in a state that supports this action, or it has no locations.'
        : errMessage,
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    if (pendingActionFor.value === key) pendingActionFor.value = null
  }
}
</script>

<template>
  <div class="p-4 md:p-6 max-w-7xl mx-auto min-h-screen flex flex-col gap-6">
    <!-- Top row: Back link (left) + Breadcrumb (right) -->
    <div class="flex items-center justify-between">
      <NuxtLink to="/missions" class="text-sm text-muted hover:text-primary">
        ← Back to missions
      </NuxtLink>
      <MissionBreadcrumb
        current="detail"
        :mission-id="missionId"
        :mission-name="missionStore.selectedMission?.name"
      />
    </div>

    <!-- Main content: left sidebar (mission detail + actions) + right panel (tabs) -->
    <div class="flex gap-4 items-start flex-1 min-h-0">
      <!-- Left sidebar: stacked cards (detail + actions) -->
      <div class="w-80 shrink-0 flex flex-col gap-4 overflow-y-auto max-h-full">
        <!-- Card 1: Mission detail -->
        <div class="border border-default/10 bg-elevated rounded-lg p-4 space-y-4">
          <!-- Title -->
          <div>
            <template v-if="missionStore.loading && !missionStore.selectedMission">
              <p class="text-xl font-bold text-default">Loading</p>
            </template>
            <template v-else-if="!missionStore.loading && !missionStore.selectedMission">
              <p class="text-xl font-bold text-default">Mission not found</p>
              <p class="mt-1 text-sm text-muted">No mission matches.</p>
            </template>
            <template v-else>
              <div class="flex items-center justify-between gap-2">
                <h1 class="text-xl font-bold text-default">
                  {{ missionStore.selectedMission?.name ?? missionId }}
                </h1>
                <NuxtLink :to="`/missions/${missionId}/edit`">
                  <UButton
                    icon="lucide:edit"
                    variant="ghost"
                    size="sm"
                    aria-label="Edit mission"
                  />
                </NuxtLink>
              </div>
              <p class="mt-1 text-xs text-muted">
                {{ missionStore.selectedMission?.description ?? '' }}
              </p>
            </template>
          </div>

          <!-- Status bar -->
          <template v-if="missionStore.selectedMission">
            <div class="flex flex-col gap-2 rounded border border-default/10 bg-default p-3 text-xs">
              <div class="flex items-center gap-2">
                <UBadge
                  :color="getStatusBadgeProps(missionStore.selectedMission.status).color"
                  variant="subtle"
                  size="sm"
                >
                  {{ getStatusBadgeProps(missionStore.selectedMission.status).label }}
                </UBadge>
                <span class="text-muted">Created {{ new Date(missionStore.selectedMission.created_at).toLocaleString('en-GB', { hour12: false }) }}</span>
              </div>
              <div
                class="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/5 px-2 py-1 text-xs text-default"
                :title="`${missionStore.selectedMission.visited_locations ?? 0} of ${missionStore.selectedMission.location_count ?? missionStore.selectedMission.total_locations ?? 0} locations visited (${(missionStore.selectedMission.progress_percent ?? 0).toFixed(1)}%)`"
              >
                <Icon name="lucide:map-pin" class="size-3 text-muted" aria-hidden="true" />
                <span class="font-mono">
                  {{ missionStore.selectedMission.visited_locations ?? 0 }} / {{ missionStore.selectedMission.location_count ?? missionStore.selectedMission.total_locations ?? 0 }}
                  <span v-if="missionStore.selectedMission.progress_percent !== undefined">({{ missionStore.selectedMission.progress_percent.toFixed(1) }}%)</span>
                </span>
                <span class="text-muted">locations</span>
              </div>
              <div class="flex flex-wrap gap-2">
                <div
                  class="inline-flex items-center gap-1.5 rounded-md border border-default/15 bg-elevated px-2 py-1 text-xs text-default"
                  title="Search radius (meters)"
                >
                  <Icon name="lucide:radius" class="size-3 shrink-0 text-muted" aria-hidden="true" />
                  <span class="font-mono">{{ missionStore.selectedMission.radius_meters ?? 0 }}</span>
                  <span class="text-muted">m</span>
                </div>
                <div
                  class="inline-flex items-center gap-1.5 rounded-md border border-default/15 bg-elevated px-2 py-1 text-xs text-default"
                  title="TTY serial port"
                >
                  <Icon name="lucide:usb" class="size-3 shrink-0 text-muted" aria-hidden="true" />
                  <span class="font-mono">{{ missionStore.selectedMission.tty_port || '—' }}</span>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- Card 2: Action buttons -->
        <div class="border border-default/10 bg-elevated rounded-lg p-4">
          <div class="flex flex-wrap gap-3">
            <UButton
              v-if="canPlan(missionStore.selectedMission?.status, missionStore.selectedMission?.location_count ?? missionStore.selectedMission?.total_locations ?? 0)"
              size="md"
              variant="solid"
              color="info"
              icon="i-lucide-map"
              :loading="isActionPending()"
              :disabled="isActionPending()"
              @click="onPlan()"
              class="shadow-md hover:shadow-lg transition-all"
            >Plan Mission</UButton>
            <UButton
              v-if="canStart(missionStore.selectedMission?.status)"
              size="md"
              variant="solid"
              color="success"
              icon="i-lucide-play"
              :loading="isActionPending()"
              :disabled="isActionPending()"
              @click="onStatusChange('start')"
              class="shadow-md hover:shadow-lg transition-all"
            >Start Mission</UButton>
            <UButton
              v-if="canPause(missionStore.selectedMission?.status)"
              size="md"
              variant="solid"
              color="warning"
              icon="i-lucide-pause"
              :loading="isActionPending()"
              :disabled="isActionPending()"
              @click="onStatusChange('pause')"
              class="shadow-md hover:shadow-lg transition-all"
            >Pause Mission</UButton>
            <UButton
              v-if="canResume(missionStore.selectedMission?.status)"
              size="md"
              variant="solid"
              color="info"
              icon="i-lucide-play"
              :loading="isActionPending()"
              :disabled="isActionPending()"
              @click="onStatusChange('resume')"
              class="shadow-md hover:shadow-lg transition-all"
            >Resume Mission</UButton>
            <UButton
              v-if="canStop(missionStore.selectedMission?.status)"
              size="md"
              variant="solid"
              color="error"
              icon="i-lucide-square"
              :loading="isActionPending()"
              :disabled="isActionPending()"
              @click="onStatusChange('stop')"
              class="shadow-md hover:shadow-lg transition-all"
            >Stop Mission</UButton>
            <span
              v-if="isTerminal(missionStore.selectedMission?.status)"
              class="text-xs text-muted italic self-center"
            >Terminal</span>
          </div>
        </div>

        <!-- Card 3: Mission lifecycle timeline -->
        <MissionTimeline
          v-if="missionStore.selectedMission"
          :status="missionStore.selectedMission.status"
        />
      </div>

      <!-- Right: Tabs + Tab panels -->
      <div class="flex-1 flex flex-col gap-4 min-w-0">
        <!-- Tabs -->
        <div role="tablist" class="flex gap-1 border-b border-default/10">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            role="tab"
            :data-reka-collection-item="''"
            class="inline-flex items-center gap-1.5 cursor-pointer rounded-t px-4 py-2 text-sm font-medium transition-colors hover:bg-accented"
            :class="activeTab === tab.key ? 'border-b-2 border-primary text-primary' : 'text-muted'"
            @click="activeTab = tab.key"
          >
            <Icon :name="tab.icon" class="size-3.5 shrink-0" aria-hidden="true" />
            {{ tab.label }}
          </button>
        </div>

        <!-- Tab panels -->
        <div class="flex-1 min-h-0">
          <div
            v-if="activeTab === 'locations'"
            class="h-full"
          >
            <LocationList :mission-id="missionId" />
          </div>
          <!-- Route tab: bezel-less map, fills the available height. -->
          <div
            v-else-if="activeTab === 'route'"
            class="h-full overflow-hidden"
          >
            <RouteMap :mission-id="missionId" />
          </div>
          <!-- Tower Scans tab -->
          <div
            v-else-if="activeTab === 'scans'"
            class="h-full overflow-y-auto"
          >
            <MissionScanList :mission-id="missionId" @data-loaded="startPolling" />
          </div>
          <div
            v-else-if="activeTab === 'logs'"
            class="h-full overflow-y-auto"
          >
            <MissionLogList :mission-id="missionId" @data-loaded="startPolling" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
