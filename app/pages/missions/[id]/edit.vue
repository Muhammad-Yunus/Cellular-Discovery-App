<!-- app/pages/missions/[id]/edit.vue -->
<script setup lang="ts">
definePageMeta({
  layout: 'default',
  title: 'Edit mission'
})

const route = useRoute()
const router = useRouter()
const missionStore = useCollectorMissionStore()
const missionId = route.params.id as string

const form = reactive({
  name: '',
  description: '',
  status: 'draft' as any
})

const error = ref<string | null>(null)
const submitting = ref(false)

onMounted(() => {
  if (!missionStore.selectedMission) {
    missionStore.fetchMissions().then(() => {
      if (!missionStore.selectedMission) router.push('/missions')
    })
    return
  }
  form.name = missionStore.selectedMission.name
  form.description = missionStore.selectedMission.description ?? ''
  form.status = missionStore.selectedMission.status
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

    <form @submit.prevent="onSubmit">
      <div class="space-y-4">
        <div>
          <label class="mb-1 block text-sm font-medium text-default">Name</label>
          <UInput v-model="form.name" />
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-default">Description</label>
          <UTextarea v-model="form.description" :rows="3" />
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-default">Status</label>
          <USelect
            :options="['draft','active','paused','completed','cancelled']"
            v-model="form.status"
          />
        </div>

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
      </div>
    </form>
  </div>
</template>
