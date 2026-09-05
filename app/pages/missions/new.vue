<script setup lang="ts">
import { useCollectorMissionStore } from '~/stores/mission'
import { useCustomToast } from '~/composables/useCustomToast'
import type { MissionRecordCreate } from '~/types/mission'

definePageMeta({ title: 'New Mission' })

const toast = useCustomToast()
const missionStore = useCollectorMissionStore()
const router = useRouter()

// Form fields — only the 3 required by POST /api/v1/missions
const name = ref('')
const description = ref('')
const radiusMeters = ref(20)

const isSubmitting = ref(false)
const errors = computed(() => {
  const errs: Record<string, string> = {}
  if (!name.value.trim()) errs.name = 'Mission name is required'
  if (radiusMeters.value < 10 || radiusMeters.value > 100) {
    errs.radius_meters = 'Radius must be between 10 and 100 meters'
  }
  return errs
})
const isFormValid = computed(() => Object.keys(errors.value).length === 0)

async function onSubmit() {
  if (!isFormValid.value) return
  isSubmitting.value = true
  try {
    const input: MissionRecordCreate = {
      name: name.value.trim(),
      description: description.value.trim() || null,
      radius_meters: radiusMeters.value
    }
    const createdId = await missionStore.createMission(input)
    toast.add({
      title: 'Mission created',
      description: `"${input.name}" has been created successfully.`,
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
    router.push(`/missions/${createdId}/locations/upload`)
  } catch (e: any) {
    toast.add({
      title: 'Failed to create mission',
      description: e?.message || 'Unknown error occurred.',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    isSubmitting.value = false
  }
}

function onCancel() {
  router.back()
}
</script>

<template>
  <div class="p-4 md:p-6 max-w-xl mx-auto min-h-screen">
    <!-- Top row: Back link (left) + Breadcrumb (right) -->
    <div class="flex items-center justify-between mb-6">
      <NuxtLink to="/missions" class="text-sm text-muted hover:text-primary">
        ← Back to missions
      </NuxtLink>
      <MissionBreadcrumb current="new" />
    </div>

    <!-- Header -->
    <h1 class="text-xl font-semibold text-highlighted mb-6">New Mission</h1>

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

        <div>
          <label class="block text-sm font-medium text-muted mb-1">
            Radius (meters) <span class="text-error">*</span>
          </label>
          <UInput
            v-model.number="radiusMeters"
            type="number"
            min="10"
            max="100"
            placeholder="20"
            :class="{ 'border-error': errors.radius_meters }"
          />
          <p v-if="errors.radius_meters" class="text-xs text-error mt-1">{{ errors.radius_meters }}</p>
        </div>
      </div>

      <!-- Form actions -->
      <div class="flex items-center justify-end gap-3 pt-4 border-t border-muted">
        <UButton variant="outline" label="Cancel" @click="onCancel" />
        <UButton
          type="submit"
          label="Create Mission"
          variant="solid"
          :color="isFormValid ? 'primary' : 'neutral'"
          :loading="isSubmitting"
          :disabled="!isFormValid || isSubmitting"
          :ui="{ base: 'disabled:bg-gray-500 disabled:text-white disabled:cursor-not-allowed disabled:opacity-100' }"
          icon="i-lucide-rocket"
        />
      </div>
    </form>
  </div>
</template>
