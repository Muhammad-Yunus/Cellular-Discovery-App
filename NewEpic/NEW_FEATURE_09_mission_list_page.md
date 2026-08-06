# Feature 09 — Mission list page (`/missions`)

| Field | Value |
|-------|-------|
| **Feature #** | 09 |
| **Title** | Mission list page at `/missions` |
| **Depends on** | 01–08 |
| **Blocks** | 18 |

---

## 1. Objective

A paginated list of missions with search, status filter, sort, and a link to create a new mission.

---

## 2. Files

### Create
- `app/pages/missions/index.vue`
- `tests/e2e/missions/list.spec.ts` (placeholder — filled in Feature 18)

---

## 3. Implementation Steps

### Step 1 — Create `app/pages/missions/index.vue`

```vue
<!-- app/pages/missions/index.vue -->
<script setup lang="ts">
definePageMeta({
  layout: 'default',
  title: 'Missions'
})

const missionStore = useMissionStore()
const uiStore = useUiStore()

// Expose the store methods via reactive refs to the template
const search = ref(missionStore.search)
watch(() => missionStore.search, v => { search.value = v })

onMounted(() => {
  missionStore.fetchMissions()
})
</script>

<template>
  <div class="flex h-full flex-col gap-6 p-6">
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-default">Missions</h1>
        <p class="text-sm text-muted">Plan and monitor cellular survey missions.</p>
      </div>
      <UButton to="/missions/create" icon="lucide:plus">
        New mission
      </UButton>
    </div>

    <!-- Filters -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
      <UInput
        v-model="search"
        placeholder="Search mission..."
        icon="lucide:search"
        class="w-full sm:w-64"
        @change="missionStore.setSearch(search)"
      />
      <USelect
        :options="['all', 'draft', 'active', 'paused', 'completed', 'cancelled']"
        :value="missionStore.statusFilter"
        placeholder="Filter status"
        @update:value="(v: any) => missionStore.setStatusFilter(v)"
      />
      <USelect
        :options="['-created_at', 'created_at', '-name', 'name']"
        :value="missionStore.sort"
        placeholder="Sort"
        @update:value="(v: any) => missionStore.setSort(v)"
      />
    </div>

    <!-- List -->
    <div v-if="missionStore.loading" class="flex h-40 items-center justify-center">
      <span class="i-lucide-loader-circle animate-spin text-2xl text-primary" />
    </div>

    <div v-else-if="missionStore.error" class="rounded border border-error/30 bg-error/10 p-4 text-sm text-error">
      {{ missionStore.error }}
    </div>

    <div v-else-if="missionStore.missions.length === 0" class="flex flex-1 flex-col items-center justify-center gap-4 py-20 text-center">
      <span class="i-lucide-rocket text-5xl text-muted" aria-hidden="true" />
      <div>
        <p class="text-lg font-semibold text-default">No missions yet</p>
        <p class="text-sm text-muted">Create your first mission to get started.</p>
      </div>
      <UButton to="/missions/create" variant="solid">
        Create mission
      </UButton>
    </div>

    <div v-else class="flex flex-1 flex-col gap-3">
      <MissionCard
        v-for="mission in missionStore.missions"
        :key="mission.id"
        :mission="mission"
        @click="(id) => missionStore.setSelectedId(id)"
        @action="(id, action) => {
          if (action === 'start') missionStore.startMission(id)
          if (action === 'pause') missionStore.pauseMission(id)
          if (action === 'resume') missionStore.resumeMission(id)
          if (action === 'complete') missionStore.completeMission(id)
        }"
      />
    </div>

    <!-- Pagination -->
    <UPagination
      v-if="missionStore.pagination.totalPages > 1"
      :page="missionStore.pagination.currentPage"
      :total="missionStore.pagination.totalPages"
      :per-page="missionStore.pagination.limit"
      class="mt-4"
      @change="(page) => missionStore.setPage(page)"
    />
  </div>
</template>
```

---

## 4. Definition of Done

- [ ] `/missions` renders list with MissionCard.
- [ ] Search, status filter, and sort trigger `fetchMissions`.
- [ ] Pagination updates via `missionStore.setPage`.
- [ ] Empty state shows CTA to create.
- [ ] Loading/error states render.
- [ ] Start/pause/resume/complete buttons call store actions.
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm build` green.
- [ ] Commit message: `feat(mission-planner): add mission list page (#09)`

---

## 5. Commit Message

```
feat(mission-planner): add mission list page (#09)

- Create app/pages/missions/index.vue
- Wire MissionCard, UInput, USelect, UButton, UPagination
- Search, status filter, sort all call missionStore actions
- Empty state CTA to /missions/create
- Actions: start, pause, resume, complete per card
```