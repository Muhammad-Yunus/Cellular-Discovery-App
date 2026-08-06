# NEW_FEATURE_10: Mission Detail Page (pages/missions/[id]/index.vue)

## Objective
Create the mission detail page with 5 tabs: Locations, Route, Scans, Logs, and Settings.

## API Endpoints Touched
- `GET /api/v1/missions/{id}`
- `GET /api/v1/missions/{id}/locations`
- `GET /api/v1/missions/{id}/route`
- `GET /api/v1/missions/{id}/scans`
- `GET /api/v1/missions/{id}/logs`

## Files to Create / Modify

| File | Action |
|------|--------|
| `app/pages/missions/[id]/index.vue` | CREATE - Mission detail page |

## How to Implement

Create `app/pages/missions/[id]/index.vue`:

```vue
<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const missionId = route.params.id as string

const missionStore = useMissionStore()
const activeTab = ref<'locations' | 'route' | 'scans' | 'logs' | 'settings'>('locations')

const tabs = [
  { id: 'locations' as const, label: 'Locations', icon: 'lucide:map-pin' },
  { id: 'route' as const, label: 'Route', icon: 'lucide:route' },
  { id: 'scans' as const, label: 'Scans', icon: 'lucide:radar' },
  { id: 'logs' as const, label: 'Logs', icon: 'lucide:file-text' },
  { id: 'settings' as const, label: 'Settings', icon: 'lucide:settings' }
]

onMounted(async () => {
  try {
    await missionStore.fetchMission(missionId)
    await Promise.all([
      missionStore.fetchLocations(missionId),
      missionStore.fetchRoute(missionId),
      missionStore.fetchLogs(missionId)
    ])
  } catch (e) {
    console.error('Failed to load mission', e)
  }
})

function navigateBack() {
  router.push('/missions')
}

function navigateToEdit() {
  router.push(`/missions/${missionId}/edit`)
}

function navigateToLocations() {
  router.push(`/missions/${missionId}/locations`)
}

function navigateToUpload() {
  router.push(`/missions/${missionId}/locations/upload`)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <UButton
          icon="lucide:arrow-left"
          variant="ghost"
          size="sm"
          @click="navigateBack"
        />
        <div>
          <h1 class="text-2xl font-bold text-default">
            {{ missionStore.selectedMission?.name ?? 'Loading...' }}
          </h1>
          <p class="text-muted mt-1">
            {{ missionStore.selectedMission?.location_count ?? 0 }} locations
          </p>
        </div>
      </div>
      <div class="flex gap-2">
        <UButton
          icon="lucide:pencil"
          label="Edit"
          variant="outline"
          @click="navigateToEdit"
        />
        <UButton
          icon="lucide:upload"
          label="Upload Locations"
          @click="navigateToUpload"
        />
      </div>
    </div>

    <!-- Tabs -->
    <UTabs :items="tabs" v-model="activeTab" class="border-b">
      <template #item="{ item }">
        <div class="flex items-center gap-2">
          <Icon :name="item.icon" class="size-4" />
          {{ item.label }}
        </div>
      </template>
    </UTabs>

    <!-- Tab Content -->
    <div class="min-h-[400px]">
      <!-- Locations Tab -->
      <div v-if="activeTab === 'locations'">
        <LocationList
          :mission-id="missionId"
          :locations="missionStore.locations"
          :loading="missionStore.locationsLoading"
          @update="() => missionStore.fetchLocations(missionId)"
          @delete="() => missionStore.fetchLocations(missionId)"
        />
      </div>

      <!-- Route Tab -->
      <div v-if="activeTab === 'route'">
        <RouteMap
          v-if="missionStore.route"
          :route="missionStore.route"
          :mission-id="missionId"
        />
        <div v-else-if="missionStore.routeLoading" class="flex justify-center py-12">
          <Icon name="lucide:loader" class="size-8 animate-spin text-muted" />
        </div>
        <div v-else class="text-center py-12 text-muted">
          No route data available
        </div>
      </div>

      <!-- Scans Tab -->
      <div v-if="activeTab === 'scans'">
        <p class="text-muted">Mission-specific scan history will be displayed here</p>
      </div>

      <!-- Logs Tab -->
      <div v-if="activeTab === 'logs'">
        <MissionLogs
          :logs="missionStore.logs"
          :loading="missionStore.logsLoading"
        />
      </div>

      <!-- Settings Tab -->
      <div v-if="activeTab === 'settings'">
        <MissionSettings
          :mission="missionStore.selectedMission"
          @update="() => missionStore.fetchMission(missionId)"
        />
      </div>
    </div>
  </div>
</template>
```

## Unit Tests Required
- Test tab switching
- Test data loading
- Test navigation handlers

## E2E Tests Required
- `tests/e2e/missions/detail.spec.ts`
  - Verify page loads with mission data
  - Verify tabs switch correctly
  - Verify locations tab shows data
  - Verify route tab shows map
  - Verify back button works

## Dependencies
- Feature 03 (service)
- Feature 04 (store)
- Feature 08 (MissionCard)
- Feature 13 (LocationList component - to be created)
- Feature 17 (RouteMap component - to be created)

## Definition of Done
- [ ] TypeScript compiles without errors
- [ ] All 5 tabs render correctly
- [ ] Data loads on mount
- [ ] Navigation works
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Commit message: `feat(mission-planner): add mission detail page (#10)`
