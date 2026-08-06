# Feature 10 — Mission create page (`/missions/create`)

| Field | Value |
|-------|-------|
| **Feature #** | 10 |
| **Title** | Mission create page |
| **Depends on** | 01–08 |
| **Blocks** | 12 |

---

## 1. Objective

A form to create a new mission with a name and optional description. On success, navigate to the new mission's detail page.

---

## 2. Files

### Create
- `app/pages/missions/create.vue`

---

## 3. Implementation Steps

### Step 1 — Create `app/pages/missions/create.vue`

```vue
<!-- app/pages/missions/create.vue -->
<script setup lang="ts">
definePageMeta({
  layout: 'default',
  title: 'Create mission'
})

const route = useRouter()
const missionStore = useMissionStore()

const form = reactive({
  name: '',
  description: ''
})
const error = ref<string | null>(null)
const submitting = ref(false)

async function onSubmit() {
  if (!form.name.trim()) return
  submitting.value = true
  error.value = null
  try {
    const mission = await missionStore.createMission({
      name: form.name.trim(),
      description: form.description.trim() || null
    })
    await route.push(`/missions/${mission.id}`)
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

    <h1 class="mb-6 text-2xl font-bold text-default">Create mission</h1>

    <UForm :schema="object({ name: string().min(1), description: string() })" :state="form" class="space-y-4" @submit="onSubmit">
      <UFormField name="name" label="Name" required>
        <UInput v-model="form.name" placeholder="e.g. Jakarta South Survey" />
      </UFormField>

      <UFormField name="description" label="Description">
        <UTextarea v-model="form.description" placeholder="Optional description…" :rows="3" />
      </UFormField>

      <div v-if="error" class="rounded border border-error/30 bg-error/10 p-3 text-sm text-error">
        {{ error }}
      </div>

      <div class="flex items-center gap-3">
        <UButton type="submit" icon="lucide:rocket" :loading="submitting" variant="solid">
          Create mission
        </UButton>
        <UButton to="/missions" variant="ghost">
          Cancel
        </UButton>
      </div>
    </UForm>
  </div>
</template>
```

> Zod schema via `object({ ... })` uses the imported `string` helper from `@nuxt/ui` form schema. If the project uses a different schema engine, adapt accordingly.

---

## 4. Definition of Done

- [ ] Form validates required name.
- [ ] On success, navigates to `/missions/{id}`.
- [ ] Error shows on submit failure.
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm build` green.
- [ ] Commit message: `feat(mission-planner): add mission create page (#10)`

---

## 5. Commit Message

```
feat(mission-planner): add mission create page (#10)

- Create app/pages/missions/create.vue
- UForm with name (required) and description fields
- On submit call missionStore.createMission
- Navigate to /missions/{id} on success
- Error display on failure
```