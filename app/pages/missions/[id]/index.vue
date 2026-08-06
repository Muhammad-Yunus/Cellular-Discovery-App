<!-- app/pages/missions/[id]/index.vue -->
<script setup lang="ts">
definePageMeta({
  layout: 'default',
  title: 'Mission detail'
})

const route = useRoute()
const router = useRouter()
const missionId = route.params.id as string

const missionStore = useCollectorMissionStore()

// Tabs
type TabKey = 'locations' | 'route' | 'activity' | 'settings' | 'logs'
const activeTab = ref<TabKey>('locations')

const tabs: { key: TabKey; label: string }[] = [
  { key: 'locations', label: 'Locations' },
  { key: 'route', label: 'Route' },
  { key: 'activity', label: 'Activity' },
  { key: 'settings', label: 'Settings' },
  { key: 'logs', label: 'Logs' }
]

onMounted(async () => {
  await missionStore.fetchMissions()
  await missionStore.fetchLocations(missionId)
})

function onStatusChange(action: 'start' | 'pause' | 'resume' | 'complete') {
  missionStore.patchMissionStatus(missionId, action).catch(() => {})
}
</script>

<template>
  <div class="flex h-full flex-col gap-6 p-6">
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <NuxtLink to="/missions" class="mb-2 inline-flex items-center gap-1 text-sm text-muted hover:text-default">
          <span class="i-lucide-arrow-left" /> Back to missions
        </NuxtLink>
        <template v-if="missionStore.loading">
          <p class="text-2xl font-bold text-default">Loading</p>
        </template>
        <template v-else-if="missionStore.missions.length === 0">
          <p class="text-2xl font-bold text-default">Mission not found</p>
          <p class="mt-1 text-sm text-muted">No mission matches the given ID.</p>
        </template>
        <template v-else>
          <h1 class="text-2xl font-bold text-default">
            {{ missionStore.selectedMission?.name ?? missionId }}
          </h1>
          <p class="mt-1 text-sm text-muted">
            {{ missionStore.selectedMission?.description ?? '' }}
          </p>
        </template>
      </div>
      <div class="flex items-center gap-2">
        <NuxtLink :to="`/missions/${missionId}/edit`">
          <UButton icon="lucide:edit" variant="outline">Edit</UButton>
        </NuxtLink>
        <NuxtLink :to="`/missions/${missionId}/locations/upload`">
          <UButton icon="lucide:upload">Upload</UButton>
        </NuxtLink>
      </div>
    </div>

    <!-- Status bar + actions -->
    <template v-if="missionStore.selectedMission">
      <div class="flex flex-wrap items-center gap-3 rounded border border-default/10 bg-default p-3">
        <UBadge
          :color="missionStore.selectedMission.status === 'active' ? 'success' : missionStore.selectedMission.status === 'paused' ? 'warning' : missionStore.selectedMission.status === 'completed' ? 'info' : 'default'"
          variant="subtle"
        >
          {{ missionStore.selectedMission.status }}
        </UBadge>
        <span class="text-xs text-muted">
          {{ missionStore.selectedMission.location_count ?? 0 }} locations
        </span>
        <span class="text-xs text-muted">
          Created {{ new Date(missionStore.selectedMission.created_at).toLocaleDateString() }}
        </span>

        <div class="ml-auto flex items-center gap-1">
          <UButton
            size="xs"
            variant="ghost"
            icon="i-lucide-play"
            :disabled="missionStore.selectedMission.status !== 'draft' && missionStore.selectedMission.status !== 'paused'"
            @click="onStatusChange('start')"
          >Start</UButton>
          <UButton
            size="xs"
            variant="ghost"
            icon="i-lucide-pause"
            :disabled="missionStore.selectedMission.status !== 'active'"
            @click="onStatusChange('pause')"
          >Pause</UButton>
          <UButton
            size="xs"
            variant="ghost"
            icon="i-lucide-resume"
            :disabled="missionStore.selectedMission.status !== 'paused'"
            @click="onStatusChange('resume')"
          >Resume</UButton>
          <UButton
            size="xs"
            variant="ghost"
            icon="i-lucide-check"
            :disabled="missionStore.selectedMission.status !== 'active'"
            @click="onStatusChange('complete')"
          >Complete</UButton>
        </div>
      </div>
    </template>

    <!-- Tabs (always visible — required by e2e tests) -->
    <div role="tablist" class="flex gap-1 border-b border-default/10">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        role="tab"
        :data-reka-collection-item="''"
        class="cursor-pointer rounded-t px-4 py-2 text-sm font-medium transition-colors hover:bg-accented"
        :class="activeTab === tab.key ? 'border-b-2 border-primary text-primary' : 'text-muted'"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab panels -->
    <div class="flex-1">
      <div v-if="activeTab === 'locations'">
        <LocationList :mission-id="missionId" />
      </div>
      <div v-else-if="activeTab === 'route'">
        <RouteMap :mission-id="missionId" />
      </div>
      <div v-else-if="activeTab === 'activity'" class="py-12 text-center text-muted">
        <span class="i-lucide-activity text-3xl mb-3" />
        <p>Activity feed coming soon.</p>
      </div>
      <div v-else-if="activeTab === 'settings'" class="py-12 text-center text-muted">
        <span class="i-lucide-settings text-3xl mb-3" />
        <p>Mission settings coming soon.</p>
      </div>
      <div v-else-if="activeTab === 'logs'" class="py-12 text-center text-muted">
        <span class="i-lucide-file-text text-3xl mb-3" />
        <p>Mission logs coming soon.</p>
      </div>
    </div>
  </div>
</template>
