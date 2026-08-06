<script setup lang="ts">
import type { Mission, MissionUpdateInput } from '~/types/mission'
import { useMissionStore } from '~/stores/missionStore'
import { useCustomToast } from '~/composables/useCustomToast'

const props = defineProps<{
  mission: Mission
  readonly?: boolean
}>()

const emit = defineEmits<{
  update: []
  delete: []
}>()

const toast = useCustomToast()
const store = useMissionStore()

// Form fields (only edit mode)
const name = ref(props.mission.name)
const description = ref(props.mission.description ?? '')
const coordinateFrame = ref(props.mission.coordinate_frame)
const plannedStartAt = ref(props.mission.planned_start_at ?? '')
const plannedEndAt = ref(props.mission.planned_end_at ?? '')

const isSubmitting = ref(false)
const errors = ref<Record<string, string>>({})

function validate(): boolean {
  const errs: Record<string, string> = {}
  if (!name.value.trim()) errs.name = 'Mission name is required'
  errors.value = errs
  return Object.keys(errs).length === 0
}

async function save() {
  if (props.readonly) return
  if (!validate()) return

  isSubmitting.value = true
  try {
    const input: MissionUpdateInput = {
      name: name.value.trim(),
      description: description.value.trim() || undefined,
      coordinate_frame: coordinateFrame.value,
      planned_start_at: plannedStartAt.value || null,
      planned_end_at: plannedEndAt.value || null
    }

    await store.updateMission(props.mission.id, input)
    toast.add({
      title: 'Mission updated',
      description: `"${input.name}" has been saved.`,
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
    emit('update')
  } catch (e: any) {
    toast.add({
      title: 'Save failed',
      description: e?.message || 'Could not save mission.',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    isSubmitting.value = false
  }
}

async function deleteMission() {
  if (props.readonly) return
  if (!confirm(`Are you sure you want to delete "${props.mission.name}"?`)) return

  try {
    await store.deleteMission(props.mission.id)
    toast.add({
      title: 'Mission deleted',
      description: 'The mission has been removed.',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
    emit('delete')
  } catch (e: any) {
    toast.add({
      title: 'Delete failed',
      description: e?.message || 'Could not delete mission.',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}

function formatDate(isoStr: string | null | undefined): string {
  if (!isoStr) return '—'
  return new Date(isoStr).toLocaleString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getStatusLabel(status: Mission['status']): string {
  const labels: Record<Mission['status'], string> = {
    draft: 'Draft',
    planned: 'Planned',
    approved: 'Approved',
    in_progress: 'In Progress',
    paused: 'Paused',
    completed: 'Completed',
    failed: 'Failed',
    cancelled: 'Cancelled'
  }
  return labels[status] ?? status
}
</script>

<template>
  <div class="space-y-4">
    <!-- Basic info -->
    <div class="space-y-3">
      <div>
        <label class="block text-sm font-medium text-muted mb-1">
          Mission Name <span v-if="!readonly" class="text-error">*</span>
        </label>
        <UInput
          v-if="!readonly"
          v-model="name"
          :class="{ 'border-error': errors.name }"
          placeholder="Enter mission name..."
        />
        <div v-else class="text-default font-medium">{{ mission.name }}</div>
        <p v-if="errors.name" class="text-xs text-error mt-1">{{ errors.name }}</p>
      </div>

      <div>
        <label class="block text-sm font-medium text-muted mb-1">Description</label>
        <UTextarea
          v-if="!readonly"
          v-model="description"
          :rows="3"
          placeholder="Optional description..."
        />
        <div v-else class="text-muted text-sm">
          {{ mission.description || '—' }}
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-muted mb-1">Coordinate Frame</label>
          <div v-if="!readonly" class="text-default">{{ coordinateFrame }}</div>
          <USelect
            v-else
            v-model="coordinateFrame"
            :items="[
              { label: 'WGS84 (lat/lon)', value: 'wgs84' },
              { label: 'UTM', value: 'utm' }
            ]"
            label-key="label"
            value-key="value"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-muted mb-1">Status</label>
          <div class="text-default">{{ getStatusLabel(mission.status) }}</div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-muted mb-1">Planned Start</label>
          <UInput
            v-if="!readonly"
            v-model="plannedStartAt"
            type="datetime-local"
          />
          <div v-else class="text-muted text-sm">{{ formatDate(mission.planned_start_at) }}</div>
        </div>
        <div>
          <label class="block text-sm font-medium text-muted mb-1">Planned End</label>
          <UInput
            v-if="!readonly"
            v-model="plannedEndAt"
            type="datetime-local"
          />
          <div v-else class="text-muted text-sm">{{ formatDate(mission.planned_end_at) }}</div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div v-if="!readonly" class="flex items-center gap-3 pt-4 border-t border-muted">
      <UButton
        label="Save Changes"
        icon="i-lucide-check"
        :loading="isSubmitting"
        @click="save"
      />
      <UButton
        label="Delete Mission"
        color="error"
        variant="ghost"
        @click="deleteMission"
      />
    </div>
  </div>
</template>
