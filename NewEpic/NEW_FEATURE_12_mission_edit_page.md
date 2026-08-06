# Feature 12 — Mission edit page (`/missions/[id]/edit`)

| Field | Value |
|-------|-------|
| **Feature #** | 12 |
| **Title** | Mission edit page |
| **Depends on** | 10, 11 |
| **Blocks** | 18 |

---

## 1. Objective

Allow editing a mission's name and description (and optionally status via a dropdown). Read from the store; update via `updateMission`.

---

## 2. Files

### Create
- `app/pages/missions/[id]/edit.vue`

---

## 3. Implementation Steps

### Step 1 — Create `app/pages/missions/[id]/edit.vue`

```vue
<!-- app/pages/missions/[id]/edit.vue -->
<script setup lang="ts">
definePageMeta({
  layout: 'default',
  title: 'Edit mission'
})

const route = useRoute()
const router = useRouter()
const missionStore = useMissionStore()
const missionId = route.params.id as string

const mission = computed(() => missionStore.missions.find(m => m.id === missionId))

const form = reactive({
  name: '',
  description: '',
  status: 'draft' as any
})

const error = ref<string | null>(null)
const submitting = ref(false)

onMounted(() => {
  if (!mission.value) {
    missionStore.fetchMissions().then(() => {
      if (!mission.value) router.push('/missions')
    })
    return
  }
  form.name = mission.value.name
  form.description = mission.value.description ?? ''
  form.status = mission.value.status
})

async function onSubmit() {
  if (!form.name.trim()) return
  submitting.value = true
  error.value = null
  try {
    await missionStore.updateMission(missionId, {
      name: form.name.trim(),
      description: form.description.trim() || null,
      status: form.status as any
    })
    await router.push(`/missions/${missionId}`)
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-2xl p-6">
    <NuxtLink to="/missions" class="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-default">
      <span class="i-lucide-arrow-left" /> Back to missions
    </NuxtLink>

    <h1 class="mb-6 text-2xl font-bold text-default">Edit mission</h1>

    <UForm :schema="object({ name: string().min(1), description: string() })" :state="form" class="space-y-4" @submit="onSubmit">
      <UFormField name="name" label="Name" required>
        <UInput v-model="form.name" />
      </UFormField>

      <UFormField name="description" label="Description">
        <UTextarea v-model="form.description" :rows="3" />
      </UFormField>

      <UFormField name="status" label="Status">
        <USelect
          :options="['draft','active','paused','completed','cancelled']"
          v-model="form.status"
        />
      </UFormField>

      <div v-if="error" class="rounded border border-error/30 bg-error/10 p-3 text-sm text-error">
        {{ error }}
      </div>

      <div class="flex items-center gap-3">
        <UButton type="submit" icon="lucide:save" :loading="submitting" variant="solid">
          Save changes
        </UButton>
        <UButton to="/missions" variant="ghost">
          Cancel
        </UButton>
      </div>
    </UForm>
  </div>
</template>
```

---

## 4. Definition of Done

- [ ] Form pre-fills from store.
- [ ] Save calls `missionStore.updateMission`.
- [ ] Navigates back to detail page on success.
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm build` green.
- [ ] Commit message: `feat(mission-planner): add mission edit page (#12)`

---

## 5. Commit Message

```
feat(mission-planner): add mission edit page (#12)

- Create app/pages/missions/[id]/edit.vue
- Pre-fill form from store
- Save calls missionStore.updateMission
- Navigate back to detail on success
```