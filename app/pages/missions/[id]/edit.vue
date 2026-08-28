<!-- app/pages/missions/[id]/edit.vue -->
<script setup lang="ts">
import { useCollectorMissionStore } from '~/stores/mission'
import { useCustomToast } from '~/composables/useCustomToast'
import type { MissionRecordUpdate } from '~/types/mission'

definePageMeta({
  layout: 'default',
  title: 'Edit mission'
})

const route = useRoute()
const router = useRouter()
const missionStore = useCollectorMissionStore()
const toast = useCustomToast()
const missionId = route.params.id as string

// Editable form fields. radius_meters is intentionally read-only
// (they are set when the mission is created and are not part of PATCH payload).
const name = ref('')
const description = ref('')

const isSubmitting = ref(false)

const errors = computed(() => {
  const errs: Record<string, string> = {}
  if (!name.value.trim()) errs.name = 'Mission name is required'
  return errs
})
const isFormValid = computed(() => Object.keys(errors.value).length === 0)

onMounted(async () => {
  // Always load the mission that matches the URL path.
  try {
    await missionStore.fetchMissionById(missionId)
  } catch (e) {
    toast.add({
      title: 'Failed to load mission',
      description: (e as Error).message,
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
    router.push('/missions')
    return
  }
  if (!missionStore.selectedMission) {
    router.push('/missions')
    return
  }
  const m = missionStore.selectedMission
  name.value = m.name
  description.value = m.description ?? ''
})

async function onSubmit() {
  if (!isFormValid.value) return
  isSubmitting.value = true
  try {
    const input: MissionRecordUpdate = {
      name: name.value.trim(),
      description: description.value.trim() || null
    }
    await missionStore.updateMission(missionId, input)
    toast.add({
      title: 'Mission updated',
      description: `"${input.name}" has been updated successfully.`,
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
    await router.push(`/missions/${missionId}`)
  } catch (e) {
    toast.add({
      title: 'Failed to update mission',
      description: (e as Error).message,
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    isSubmitting.value = false
  }
}

function onCancel() {
  router.push(`/missions/${missionId}`)
}
</script>

<template>
  <div class="p-4 md:p-6 max-w-xl mx-auto min-h-screen">
    <!-- Top row: Back link (left) + Breadcrumb (right) -->
    <div class="flex items-center justify-between mb-6">
      <NuxtLink :to="`/missions/${missionId}`" class="text-sm text-muted hover:text-primary">
        ← Back
      </NuxtLink>
      <MissionBreadcrumb
        current="edit"
        :mission-id="missionId"
        :mission-name="missionStore.selectedMission?.name"
      />
    </div>

    <!-- Header -->
    <h1 class="text-xl font-semibold text-highlighted mb-6">Edit Mission</h1>

    <!-- Form -->
    <form @submit.prevent="onSubmit" class="space-y-5">
      <div class="bg-elevated border border-muted rounded-lg p-4 space-y-4">
        <div>
          <label class="block text-sm font-medium text-muted mb-1">
            Mission Name <span class="text-error">*</span>
          </label>
          <UInput
            v-model="name"
            placeholder="e.g. Jakarta South Survey"
            class="w-full"
            :class="{ 'border-error': errors.name }"
          />
          <p v-if="errors.name" class="text-xs text-error mt-1">{{ errors.name }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-muted mb-1">Description</label>
          <UTextarea
            v-model="description"
            placeholder="Optional mission description…"
            :rows="3"
            class="w-full"
          />
        </div>

        <!-- Read-only metadata chips. radius_meters is not editable
             editable here; they are set at mission creation. -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-muted mb-1">
              Radius (meters)
            </label>
            <div
              v-if="missionStore.selectedMission"
              class="inline-flex items-center gap-2 rounded-md border border-default/15 bg-default px-3 py-2 text-sm text-default"
            >
              <Icon name="lucide:radius" class="text-base shrink-0 text-muted" aria-hidden="true" />
              <span class="font-mono">{{ missionStore.selectedMission.radius_meters ?? 0 }}</span>
              <span class="text-muted">m</span>
            </div>
            <div v-else class="h-10" />
          </div>
        </div>
      </div>

      <!-- Form actions -->
      <div class="flex items-center justify-end gap-3 pt-4 border-t border-muted">
        <UButton variant="outline" label="Cancel" @click="onCancel" />
        <UButton
          type="submit"
          label="Save Changes"
          variant="solid"
          :color="isFormValid ? 'primary' : 'neutral'"
          :loading="isSubmitting"
          :disabled="!isFormValid || isSubmitting"
          :ui="{ base: 'disabled:bg-gray-500 disabled:text-white disabled:cursor-not-allowed disabled:opacity-100' }"
          icon="i-lucide-save"
        />
      </div>
    </form>
  </div>
</template>
