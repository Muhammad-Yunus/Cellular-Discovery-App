# Feature 16 — Location list page (`/missions/[id]/locations`)

| Field | Value |
|-------|-------|
| **Feature #** | 16 |
| **Title** | Location list page |
| **Depends on** | 01–15 |
| **Blocks** | 18 |

---

## 1. Objective

A full page showing uploaded locations for a mission, with add/upload CTAs and a route view link.

---

## 2. Files

### Create
- `app/pages/missions/[id]/locations/index.vue`

---

## 3. Implementation Steps

### Step 1 — Create page

```vue
<!-- app/pages/missions/[id]/locations/index.vue -->
<script setup lang="ts">
definePageMeta({
  layout: 'default',
  title: 'Locations'
})

const route = useRoute()
const missionId = route.params.id as string

const missionStore = useMissionStore()

onMounted(async () => {
  await missionStore.fetchMissions()
  await missionStore.fetchLocations(missionId)
})
</script>

<template>
  <div class="flex h-full flex-col gap-6 p-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <NuxtLink to="/missions" class="mb-2 inline-flex items-center gap-1 text-sm text-muted hover:text-default">
          <span class="i-lucide-arrow-left" /> Back to missions
        </NuxtLink>
        <h1 class="text-2xl font-bold text-default">Locations</h1>
        <p class="text-sm text-muted">Waypoints for this mission.</p>
      </div>
      <div class="flex items-center gap-2">
        <NuxtLink :to="`/missions/${missionId}/locations/upload`">
          <UButton icon="lucide:upload">Upload CSV</UButton>
        </NuxtLink>
        <NuxtLink :to="`/missions/${missionId}`">
          <UButton to="/missions" variant="ghost">Back</UButton>
        </NuxtLink>
      </div>
    </div>

    <LocationList :mission-id="missionId" />
  </div>
</template>
```

---

## 4. Definition of Done

- [ ] Page mounts and fetches locations.
- [ ] `<LocationList>` renders inside.
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm build` green.
- [ ] Commit message: `feat(mission-planner): add location list page (#16)`

---

## 5. Commit Message

```
feat(mission-planner): add location list page (#16)

- Create app/pages/missions/[id]/locations/index.vue
- Fetch mission & locations on mount
- Render <LocationList> component
```