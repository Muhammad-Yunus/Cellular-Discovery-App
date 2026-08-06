# Feature 08 — MissionCard component

| Field | Value |
|-------|-------|
| **Feature #** | 08 |
| **Title** | Reusable mission card for list page |
| **Depends on** | 02, 07 |
| **Blocks** | 09 |

---

## 1. Objective

A compact card used in the mission list (Feature 09) and optionally in other places. Shows mission name, status badge, scan count, location count, last-updated date, and a link to detail.

---

## 2. Files

### Create
- `app/components/MissionCard.vue`
- `app/components/__tests__/MissionCard.test.ts`

---

## 3. Implementation Steps

### Step 1 — Create `app/components/MissionCard.vue`

```vue
<!-- app/components/MissionCard.vue -->
<script setup lang="ts">
import type { Mission } from '~/types/mission'
import { MISSION_STATUS_COLOR, MISSION_STATUS_LABELS } from '~/types/mission'

const props = defineProps<{
  mission: Mission
}>()

const emit = defineEmits<{
  click: [id: string]
  action: [id: string, action: string]
}>()

function formatISO(iso: string): string {
  return new Date(iso).toLocaleString()
}
</script>

<template>
  <div
    class="flex items-center justify-between gap-4 rounded-lg border border-default/10 bg-default p-4 transition-colors hover:bg-accented/30 cursor-pointer"
    @click="emit('click', mission.id)"
  >
    <div class="flex min-w-0 flex-1 gap-3">
      <div class="i-lucide-rocket shrink-0 text-xl text-primary mt-0.5" aria-hidden="true" />
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <p class="truncate text-sm font-semibold text-default">{{ mission.name }}</p>
          <StatusBadge
            :status="MISSION_STATUS_COLOR[mission.status]"
            :label="MISSION_STATUS_LABELS[mission.status]"
          />
        </div>
        <p class="mt-1 truncate text-xs text-muted">
          Updated {{ formatISO(mission.updated_at) }}
        </p>
        <div class="mt-2 flex items-center gap-4 text-xs text-muted">
          <span class="flex items-center gap-1">
            <span class="i-lucide-map-pin text-base" />
            {{ mission.location_count ?? 0 }} locs
          </span>
          <span class="flex items-center gap-1">
            <span class="i-lucide-radio-tower text-base" />
            {{ mission.scan_count ?? 0 }} scans
          </span>
        </div>
      </div>
    </div>

    <div class="flex shrink-0 items-center gap-2">
      <button
        v-if="mission.status === 'draft'"
        class="i-lucide-play rounded p-1 text-primary hover:bg-accented"
        title="Start"
        @click.stop="emit('action', mission.id, 'start')"
      />
      <button
        v-if="mission.status === 'active'"
        class="i-lucide-pause rounded p-1 text-warning hover:bg-accented"
        title="Pause"
        @click.stop="emit('action', mission.id, 'pause')"
      />
      <button
        v-if="mission.status === 'paused'"
        class="i-lucide-play rounded p-1 text-success hover:bg-accented"
        title="Resume"
        @click.stop="emit('action', mission.id, 'resume')"
      />
      <button
        v-if="mission.status === 'active' || mission.status === 'paused'"
        class="i-lucide-check-circle rounded p-1 text-info hover:bg-accented"
        title="Complete"
        @click.stop="emit('action', mission.id, 'complete')"
      />
      <NuxtLink
        :to="`/missions/${mission.id}`"
        class="i-lucide-arrow-right rounded p-1 text-muted hover:text-default"
        title="View details"
        @click.stop
      />
    </div>
  </div>
</template>
```

---

## 4. Definition of Done

- [ ] `MissionCard.vue` renders mission name, status badge, counts, and links.
- [ ] Emits `click` and `action` correctly.
- [ ] No TypeScript errors.
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm build` green.
- [ ] Commit message: `feat(mission-planner): add MissionCard component (#08)`

---

## 5. Commit Message

```
feat(mission-planner): add MissionCard component (#08)

- Create app/components/MissionCard.vue
- Render mission name, status badge, location/scan counts, updated date
- Actions: start, pause, resume, complete (guarded by status)
- Link to /missions/{id}
- Emit click and action events
```