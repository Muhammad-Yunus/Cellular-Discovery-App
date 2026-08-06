<script setup lang="ts">
import { useMissionStore } from '~/stores/missionStore'
import { useCustomToast } from '~/composables/useCustomToast'
import type { MissionCreateInput } from '~/types/mission'

definePageMeta({ title: 'New Mission' })

const toast = useCustomToast()
const missionStore = useMissionStore()
const router = useRouter()

// Form fields
const name = ref('')
const description = ref('')
const coordinateFrame = ref<'wgs84' | 'utm'>('wgs84')
const plannedStartAt = ref('')
const plannedEndAt = ref('')
const waypointCount = ref(1)

// Waypoints
interface WaypointForm {
  sequence: number
  latitude: string
  longitude: string
  altitude: string
  speed?: string
  holdTime?: string
  action?: string
  notes?: string
}

const waypoints = ref<WaypointForm[]>([
  { sequence: 0, latitude: '', longitude: '', altitude: '', notes: '' }
])

// Type-safe waypoint access
function wpAt(i: number): WaypointForm {
  return waypoints.value[i]!
}

const isSubmitting = ref(false)

// Validation
const errors = computed(() => {
  const errs: Record<string, string> = {}
  if (!name.value.trim()) errs.name = 'Mission name is required'
  for (let i = 0; i < waypoints.value.length; i++) {
    const wp = waypoints.value[i]!
    if (!wp.latitude || isNaN(Number(wp.latitude))) {
      errs[`wp_${i}_lat`] = 'Valid latitude required'
    }
    if (!wp.longitude || isNaN(Number(wp.longitude))) {
      errs[`wp_${i}_lon`] = 'Valid longitude required'
    }
    if (!wp.altitude || isNaN(Number(wp.altitude))) {
      errs[`wp_${i}_alt`] = 'Valid altitude required'
    }
  }
  return errs
})

const isFormValid = computed(() => {
  return Object.keys(errors.value).length === 0
})

// Waypoint management
function addWaypoint() {
  const seq = waypoints.value.length
  waypoints.value.push({
    sequence: seq,
    latitude: '',
    longitude: '',
    altitude: '',
    notes: ''
  })
}

function removeWaypoint(index: number) {
  if (waypoints.value.length <= 1) return
  waypoints.value.splice(index, 1)
  // Renumber sequences
  waypoints.value.forEach((wp, i) => { wp.sequence = i })
}

function moveWaypoint(index: number, direction: 'up' | 'down') {
  if (direction === 'up' && index > 0) {
    const item = waypoints.value[index]!
    const prev = waypoints.value[index - 1]!
    waypoints.value[index - 1] = item
    waypoints.value[index] = prev
    waypoints.value.forEach((wp, i) => { wp.sequence = i })
  } else if (direction === 'down' && index < waypoints.value.length - 1) {
    const item = waypoints.value[index]!
    const next = waypoints.value[index + 1]!
    waypoints.value[index + 1] = item
    waypoints.value[index] = next
    waypoints.value.forEach((wp, i) => { wp.sequence = i })
  }
}

// Submit
async function onSubmit() {
  if (!isFormValid.value) return

  isSubmitting.value = true
  try {
    const input: MissionCreateInput = {
      name: name.value.trim(),
      description: description.value.trim() || undefined,
      status: 'IDLE',
      coordinate_frame: coordinateFrame.value,
      planned_start_at: plannedStartAt.value || null,
      planned_end_at: plannedEndAt.value || null,
      waypoints: waypoints.value.map(wp => {
        const w: import('~/types/mission').WaypointCreateInput = {
          sequence: wp.sequence,
          latitude: Number(wp.latitude),
          longitude: Number(wp.longitude),
          altitude: Number(wp.altitude)
        }
        if (wp.speed) w.speed = Number(wp.speed)
        if (wp.holdTime) w.hold_time = Number(wp.holdTime)
        if (wp.action) w.action = wp.action as import('~/types/mission').WaypointCreateInput['action']
        if (wp.notes) w.notes = wp.notes
        return w
      })
    }

    await missionStore.createMission(input)
    toast.add({
      title: 'Mission created',
      description: `"${input.name}" has been created successfully.`,
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
    router.push('/missions')
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
  <div class="p-4 md:p-6 max-w-3xl mx-auto min-h-screen">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <NuxtLink to="/missions" class="text-sm text-muted hover:text-primary mb-2 inline-block">
          ← Back to missions
        </NuxtLink>
        <h1 class="text-xl font-semibold text-highlighted">New Mission</h1>
      </div>
    </div>

    <!-- Form -->
    <form @submit.prevent="onSubmit" class="space-y-6">
      <!-- Basic info -->
      <div class="bg-elevated border border-muted rounded-lg p-4 space-y-4">
        <h2 class="font-medium text-highlighted">Basic Information</h2>

        <div>
          <label class="block text-sm font-medium text-muted mb-1">
            Mission Name <span class="text-error">*</span>
          </label>
          <UInput
            v-model="name"
            placeholder="Enter mission name..."
            :class="{ 'border-error': errors.name }"
          />
          <p v-if="errors.name" class="text-xs text-error mt-1">{{ errors.name }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-muted mb-1">Description</label>
          <UTextarea
            v-model="description"
            placeholder="Optional mission description..."
            :rows="3"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-muted mb-1">
              Coordinate Frame
            </label>
            <USelect
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
            <label class="block text-sm font-medium text-muted mb-1">Planned Start</label>
            <UInput
              v-model="plannedStartAt"
              type="datetime-local"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-muted mb-1">Planned End</label>
          <UInput
            v-model="plannedEndAt"
            type="datetime-local"
          />
        </div>
      </div>

      <!-- Waypoints -->
      <div class="bg-elevated border border-muted rounded-lg p-4 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="font-medium text-highlighted">Waypoints</h2>
          <UButton
            size="sm"
            variant="ghost"
            icon="i-lucide-plus"
            label="Add Waypoint"
            @click="addWaypoint"
          />
        </div>

        <div class="space-y-3">
          <div
            v-for="(wp, index) in waypoints"
            :key="index"
            class="border border-muted rounded-md p-3 space-y-3"
          >
            <!-- Waypoint header -->
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-highlighted">
                Waypoint {{ index + 1 }}
              </span>
              <div class="flex items-center gap-1">
                <UButton
                  size="xs"
                  variant="ghost"
                  icon="i-lucide-arrow-up"
                  :disabled="index === 0"
                  @click="moveWaypoint(index, 'up')"
                />
                <UButton
                  size="xs"
                  variant="ghost"
                  icon="i-lucide-arrow-down"
                  :disabled="index === waypoints.length - 1"
                  @click="moveWaypoint(index, 'down')"
                />
                <UButton
                  size="xs"
                  variant="ghost"
                  color="error"
                  icon="i-lucide-trash-2"
                  :disabled="waypoints.length <= 1"
                  @click="removeWaypoint(index)"
                />
              </div>
            </div>

            <!-- Coordinates -->
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block text-xs text-muted mb-1">Latitude</label>
                <UInput
                  v-model="wp.latitude"
                  type="number"
                  step="any"
                  placeholder="-6.200"
                  :class="{ 'border-error': errors[`wp_${index}_lat`] }"
                />
                <p v-if="errors[`wp_${index}_lat`]" class="text-xs text-error mt-0.5">{{ errors[`wp_${index}_lat`] }}</p>
              </div>
              <div>
                <label class="block text-xs text-muted mb-1">Longitude</label>
                <UInput
                  v-model="wp.longitude"
                  type="number"
                  step="any"
                  placeholder="106.800"
                  :class="{ 'border-error': errors[`wp_${index}_lon`] }"
                />
                <p v-if="errors[`wp_${index}_lon`]" class="text-xs text-error mt-0.5">{{ errors[`wp_${index}_lon`] }}</p>
              </div>
              <div>
                <label class="block text-xs text-muted mb-1">Altitude (m)</label>
                <UInput
                  v-model="wp.altitude"
                  type="number"
                  step="any"
                  placeholder="100"
                  :class="{ 'border-error': errors[`wp_${index}_alt`] }"
                />
                <p v-if="errors[`wp_${index}_alt`]" class="text-xs text-error mt-0.5">{{ errors[`wp_${index}_alt`] }}</p>
              </div>
            </div>

            <!-- Optional fields -->
            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block text-xs text-muted mb-1">Speed (m/s)</label>
                <UInput v-model="wp.speed" type="number" step="any" />
              </div>
              <div>
                <label class="block text-xs text-muted mb-1">Hold Time (s)</label>
                <UInput v-model="wp.holdTime" type="number" step="any" />
              </div>
              <div>
                <label class="block text-xs text-muted mb-1">Action</label>
                <USelect
                  v-model="wp.action"
                  :items="['survey', 'scan', 'hover', 'photo', 'video', 'sensor_read']"
                  placeholder="None"
                />
              </div>
            </div>

            <div>
              <label class="block text-xs text-muted mb-1">Notes</label>
              <UInput v-model="wp.notes" placeholder="Optional notes..." />
            </div>
          </div>
        </div>

        <UButton
          variant="ghost"
          icon="i-lucide-plus"
          label="Add Another Waypoint"
          class="w-full"
          @click="addWaypoint"
        />
      </div>

      <!-- Form actions -->
      <div class="flex items-center justify-end gap-3 pt-4 border-t border-muted">
        <UButton
          variant="outline"
          label="Cancel"
          @click="onCancel"
        />
        <UButton
          type="submit"
          label="Create Mission"
          :loading="isSubmitting"
          :disabled="!isFormValid || isSubmitting"
          icon="i-lucide-plane"
        />
      </div>
    </form>
  </div>
</template>
