# Feature 11 — Mission detail page (`/missions/[id]`)

| Field | Value |
|-------|-------|
| **Feature #** | 11 |
| **Title** | Mission detail page with tabs |
| **Depends on** | 01–10 |
| **Blocks** | 18 |

---

## 1. Objective

A detail page showing 5 tabs: **Overview**, **Locations**, **Route**, **Scans**, **Logs**. Pulls live updates from the WebSocket.

---

## 2. Files

### Create
- `app/pages/missions/[id]/index.vue`

---

## 3. Implementation Steps

### Step 1 — Create `app/pages/missions/[id]/index.vue`

```vue
<!-- app/pages/missions/[id]/index.vue -->
<script setup lang="ts">
definePageMeta({
  layout: 'default',
  title: 'Mission detail'
})

const route = useRoute()
const missionStore = useMissionStore()
const missionId = route.params.id as string

const activeTab = ref('overview')

onMounted(async () => {
  // Ensure the mission is in store; fetch if missing.
  if (!missionStore.selectedId || missionStore.selectedId !== missionId) {
    await missionStore.fetchMissions()
  }
  if (missionStore.selectedId === missionId) {
    await missionStore.fetchLocations(missionId)
  }
})

function formatISO(iso: string): string {
  return new Date(iso).toLocaleString()
}
</script>

<template>
  <div class="flex h-full flex-col gap-6 p-6">
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <NuxtLink to="/missions" class="mb-2 inline-flex items-center gap-1 text-sm text-muted hover:text-default">
          <span class="i-lucide-arrow-left" /> Back to missions
        </NuxtLink>
        <div v-if="missionStore.selectedMission" class="flex items-center gap-3">
          <h1 class="text-2xl font-bold text-default">{{ missionStore.selectedMission.name }}</h1>
          <StatusBadge
            :status="['draft','active','paused','completed','cancelled'] as any"
            :label="missionStore.selectedMission.status"
          />
        </div>
        <p v-if="missionStore.selectedMission" class="text-sm text-muted">
          Created {{ formatISO(missionStore.selectedMission.created_at) }} · Last updated {{ formatISO(missionStore.selectedMission.updated_at) }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <UButton
          v-if="missionStore.selectedMission?.status === 'draft'"
          icon="lucide:play"
          @click="missionStore.startMission(missionId)"
        >
          Start
        </UButton>
        <UButton
          v-if="missionStore.selectedMission?.status === 'active'"
          icon="lucide:pause"
          @click="missionStore.pauseMission(missionId)"
        >
          Pause
        </UButton>
        <UButton
          v-if="missionStore.selectedMission?.status === 'paused'"
          icon="lucide:play"
          @click="missionStore.resumeMission(missionId)"
        >
          Resume
        </UButton>
        <UButton
          v-if="missionStore.selectedMission?.status === 'active' || missionStore.selectedMission?.status === 'paused'"
          icon="lucide:check-circle"
          @click="missionStore.completeMission(missionId)"
        >
          Complete
        </UButton>
        <UButton to="/missions" variant="ghost">
          Back
        </UButton>
      </div>
    </div>

    <!-- Tabs -->
    <UTabs :items="['overview','locations','route','scans','logs']" v-model="activeTab" />

    <!-- Overview tab -->
    <div v-if="activeTab === 'overview'" class="rounded border border-default/10 bg-default p-6">
      <div v-if="!missionStore.selectedMission" class="text-muted">Loading…</div>
      <template v-else>
        <dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt class="text-xs text-muted">Status</dt>
            <dd class="text-sm font-medium text-default">{{ missionStore.selectedMission.status }}</dd>
          </div>
          <div>
            <dt class="text-xs text-muted">Locations</dt>
            <dd class="text-sm font-medium text-default">{{ missionStore.selectedMission.location_count ?? 0 }}</dd>
          </div>
          <div>
            <dt class="text-xs text-muted">Scans</dt>
            <dd class="text-sm font-medium text-default">{{ missionStore.selectedMission.scan_count ?? 0 }}</dd>
          </div>
          <div>
            <dt class="text-xs text-muted">Center</dt>
            <dd class="text-sm font-medium text-default">
              {{ [missionStore.selectedMission.center_lat, missionStore.selectedMission.center_lon].filter(Boolean).join(', ') || '—' }}
            </dd>
          </div>
          <div class="sm:col-span-2">
            <dt class="text-xs text-muted">Description</dt>
            <dd class="text-sm text-default">{{ missionStore.selectedMission.description || '—' }}</dd>
          </div>
        </dl>
      </template>
    </div>

    <!-- Locations tab -->
    <div v-if="activeTab === 'locations'" class="rounded border border-default/10 bg-default p-6">
      <div class="mb-4 flex items-center justify-between">
        <p class="text-sm text-muted">Uploaded waypoints</p>
        <NuxtLink :to="`/missions/${missionId}/locations/upload`">
          <UButton icon="lucide:upload" size="sm">Upload CSV</UButton>
        </NuxtLink>
      </div>
      <LocationList :mission-id="missionId" />
    </div>

    <!-- Route tab -->
    <div v-if="activeTab === 'route'" class="rounded border border-default/10 bg-default p-6">
      <RouteMap :mission-id="missionId" />
    </div>

    <!-- Scans tab -->
    <div v-if="activeTab === 'scans'" class="rounded border border-default/10 bg-default p-6">
      <p class="text-sm text-muted">Scans collected under this mission (live).</p>
      <UButton :to="`/missions/${missionId}/locations/upload`" variant="link">
        Download scans CSV
      </UButton>
      <!-- Placeholder: full scan table will be added when service returns scans -->
      <div class="mt-4 text-sm text-muted">No scans yet.</div>
    </div>

    <!-- Logs tab -->
    <div v-if="activeTab === 'logs'" class="rounded border border-default/10 bg-default p-6">
      <p class="text-sm text-muted">Live mission logs streamed via WebSocket.</p>
      <div class="mt-4 font-mono text-xs text-muted">No logs yet.</div>
    </div>
  </div>
</template>
```

> **Note:** `<LocationList>` and `<RouteMap>` components will be built in Features 15 and 17; this page imports them and assumes they exist.

---

## 4. Definition of Done

- [ ] `/missions/[id]` loads mission detail from store.
- [ ] 5 tabs render (Overview, Locations, Route, Scans, Logs).
- [ ] Start/pause/resume/complete buttons wired to store actions.
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm build` green.
- [ ] Commit message: `feat(mission-planner): add mission detail page (#11)`

---

## 5. Commit Message

```
feat(mission-planner): add mission detail page (#11)

- Create app/pages/missions/[id]/index.vue
- 5 tabs: overview, locations, route, scans, logs
- Status actions: start, pause, resume, complete
- Wire LocationList and RouteMap placeholders
- WebSocket updates handled by global MissionsWebSocket component
```