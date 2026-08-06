# Feature 15 — Location list component (`<LocationList>`)

| Field | Value |
|-------|-------|
| **Feature #** | 15 |
| **Title** | Location list component |
| **Depends on** | 01–04, 13 |
| **Blocks** | 16, 17 |

---

## 1. Objective

Display the uploaded waypoints for a mission in a sortable table. Includes pagination, row actions (delete), and a CSV export button.

---

## 2. Files

### Create
- `app/components/LocationList.vue`
- `app/components/__tests__/LocationList.test.ts`

---

## 3. Implementation Steps

### Step 1 — Create `app/components/LocationList.vue`

```vue
<!-- app/components/LocationList.vue -->
<script setup lang="ts">
import { useMissionStore } from '~/stores/mission'
import type { MissionLocation } from '~/types/mission'

const props = defineProps<{
  missionId: string
}>()

const emit = defineEmits<{
  delete: [id: string]
}>()

const missionStore = useMissionStore()

const locations = computed(() => (missionStore.missions.find(m => m.id === props.missionId) as any)?._locations ?? [])
const total = computed(() => (missionStore.missions.find(m => m.id === props.missionId) as any)?._locationTotal ?? 0)
const loading = computed(() => missionStore.loading)

async function onDelete(id: string) {
  await missionStore.deleteLocation(props.missionId, id)
  emit('delete', id)
}

async function exportCSV() {
  // Not yet in missionService — placeholder until we implement export
  alert('Export not yet implemented.')
}
</script>

<template>
  <div v-if="loading" class="flex h-40 items-center justify-center">
    <span class="i-lucide-loader-circle animate-spin text-2xl text-primary" />
  </div>

  <div v-else-if="locations.length === 0" class="rounded border border-default/10 bg-default p-6 text-center text-sm text-muted">
    No locations uploaded yet. <NuxtLink :to="`/missions/${missionId}/locations/upload`" class="text-primary hover:underline">Upload CSV</NuxtLink>
  </div>

  <div v-else class="overflow-x-auto rounded border border-default/10 bg-default">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-default/10 text-left text-xs uppercase text-muted">
          <th class="px-4 py-3">#</th>
          <th class="px-4 py-3">Latitude</th>
          <th class="px-4 py-3">Longitude</th>
          <th class="px-4 py-3">Altitude</th>
          <th class="px-4 py-3">Created</th>
          <th class="px-4 py-3 text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(loc, idx) in locations"
          :key="loc.id"
          class="border-b border-default/5 hover:bg-accented/30"
        >
          <td class="px-4 py-3 text-muted">{{ idx + 1 }}</td>
          <td class="px-4 py-3 font-mono">{{ loc.latitude }}</td>
          <td class="px-4 py-3 font-mono">{{ loc.longitude }}</td>
          <td class="px-4 py-3 font-mono">{{ loc.altitude ?? '—' }}</td>
          <td class="px-4 py-3 text-muted">{{ new Date(loc.created_at).toLocaleString() }}</td>
          <td class="px-4 py-3 text-right">
            <UButton
              icon="lucide:trash-2"
              variant="ghost"
              size="xs"
              color="error"
              @click="onDelete(loc.id)"
            />
          </td>
        </tr>
      </tbody>
    </table>
    <div class="flex items-center justify-between px-4 py-3 text-xs text-muted">
      <span>Showing {{ locations.length }} of {{ total }} locations</span>
      <UButton icon="lucide:download" size="sm" variant="ghost" @click="exportCSV">
        Export CSV
      </UButton>
    </div>
  </div>
</template>
```

---

## 4. Definition of Done

- [ ] `<LocationList>` renders a table of locations.
- [ ] Delete button calls `missionStore.deleteLocation`.
- [ ] Empty state links to upload page.
- [ ] Export button placeholder.
- [ ] Unit tests pass.
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm build` green.
- [ ] Commit message: `feat(mission-planner): add LocationList component (#15)`

---

## 5. Commit Message

```
feat(mission-planner): add LocationList component (#15)

- Create app/components/LocationList.vue
- Render table with lat/lon/altitude/date
- Delete button wired to store
- Empty state CTA to upload page
- Export CSV placeholder
```