# NEW_FEATURE_11: Mission Edit Page (pages/missions/[id]/edit.vue)

## Objective
Create a page for editing mission details (name, description, status).

## API Endpoints Touched
- `GET /api/v1/missions/{id}`
- `PATCH /api/v1/missions/{id}`

## Files to Create / Modify

| File | Action |
|------|--------|
| `app/pages/missions/[id]/edit.vue` | CREATE - Mission edit page |

## How to Implement

Create `app/pages/missions/[id]/edit.vue`:

```vue
<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const missionId = route.params.id as string

const missionStore = useMissionStore()
const { add: showToast } = useCustomToast()

const loading = ref(false)
const saving = ref(false)

const form = reactive({
  name: '',
  description: '',
  status: 'planning' as 'planning' | 'active' | 'completed' | 'archived'
})

onMounted(async () => {
  loading.value = true
  try {
    const mission = await missionStore.fetchMission(missionId)
    form.name = mission.name
    form.description = mission.description || ''
    form.status = mission.status
  } catch (e) {
    showToast({
      title: 'Failed to load mission',
      color: 'error'
    })
    router.push('/missions')
  } finally {
    loading.value = false
  }
})

async function handleSave() {
  if (!form.name.trim()) {
    showToast({
      title: 'Name is required',
      color: 'error'
    })
    return
  }
  
  saving.value = true
  try {
    await missionStore.updateMission(missionId, {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      status: form.status
    })
    showToast({
      title: 'Mission Updated',
      color: 'success'
    })
    router.push(`/missions/${missionId}`)
  } catch (e: any) {
    showToast({
      title: 'Failed to update mission',
      description: e.message,
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

function handleCancel() {
  router.push(`/missions/${missionId}`)
}
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <UButton
        icon="lucide:arrow-left"
        variant="ghost"
        size="sm"
        @click="handleCancel"
      />
      <div>
        <h1 class="text-2xl font-bold text-default">Edit Mission</h1>
        <p class="text-muted mt-1">Update mission details</p>
      </div>
    </div>

    <LoadingOverlay :loading="loading" />

    <UCard v-if="!loading">
      <UForm
        :state="form"
        class="space-y-4"
        @submit="handleSave"
      >
        <UFormField label="Mission Name" name="name">
          <UInput v-model="form.name" placeholder="Enter mission name" />
        </UFormField>

        <UFormField label="Description" name="description">
          <UTextarea
            v-model="form.description"
            placeholder="Optional description"
            :rows="4"
          />
        </UFormField>

        <UFormField label="Status" name="status">
          <USelect
            v-model="form.status"
            :options="[
              { label: 'Planning', value: 'planning' },
              { label: 'Active', value: 'active' },
              { label: 'Completed', value: 'completed' },
              { label: 'Archived', value: 'archived' }
            ]"
          />
        </UFormField>

        <div class="flex justify-end gap-2 pt-4">
          <UButton
            variant="ghost"
            label="Cancel"
            @click="handleCancel"
          />
          <UButton
            type="submit"
            label="Save Changes"
            :loading="saving"
            icon="lucide:save"
          />
        </div>
      </UForm>
    </UCard>
  </div>
</template>
```

## Unit Tests Required
- Test form loading
- Test form validation
- Test save functionality
- Test cancel navigation

## E2E Tests Required
- `tests/e2e/missions/edit.spec.ts`
  - Verify page loads with mission data
  - Verify form fields are populated
  - Verify save updates mission
  - Verify cancel navigates back

## Dependencies
- Feature 03 (service)
- Feature 04 (store)

## Definition of Done
- [ ] TypeScript compiles without errors
- [ ] Form loads with mission data
- [ ] Save functionality works
- [ ] Validation works
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Commit message: `feat(mission-planner): add mission edit page (#11)`
