<script setup lang="ts">
import type { Mission, WaypointCreateInput } from '~/types/mission'
import { useMissionStore } from '~/stores/missionStore'
import { useCustomToast } from '~/composables/useCustomToast'

const props = defineProps<{
  mission: Mission
  readonly?: boolean
}>()

const emit = defineEmits<{
  update: []
}>()

const toast = useCustomToast()
const store = useMissionStore()

interface LocalWaypoint {
  sequence: number
  latitude: string
  longitude: string
  altitude: string
  speed?: string
  holdTime?: string
  action?: string
  notes?: string
}

const localWaypoints = ref<LocalWaypoint[]>(
  (props.mission.waypoints ?? []).map(wp => ({
    sequence: wp.sequence,
    latitude: String(wp.latitude),
    longitude: String(wp.longitude),
    altitude: String(wp.altitude),
    ...(wp.speed ? { speed: String(wp.speed) } : {}),
    ...(wp.hold_time ? { holdTime: String(wp.hold_time) } : {}),
    ...(wp.action ? { action: wp.action } : {}),
    ...(wp.notes ? { notes: wp.notes } : {})
  }))
)

const newWaypointErrors = ref<Record<number, string>>({})

function addWaypoint() {
  localWaypoints.value.push({
    sequence: localWaypoints.value.length,
    latitude: '',
    longitude: '',
    altitude: ''
  })
}

function removeWaypoint(index: number) {
  if (props.readonly) return
  localWaypoints.value.splice(index, 1)
  localWaypoints.value.forEach((wp, i) => { wp.sequence = i })
}

function moveWaypoint(index: number, direction: 'up' | 'down') {
  if (props.readonly) return
  if (direction === 'up' && index > 0) {
    const item = localWaypoints.value[index]!
    const prev = localWaypoints.value[index - 1]!
    localWaypoints.value[index - 1] = item
    localWaypoints.value[index] = prev
    localWaypoints.value.forEach((wp, i) => { wp.sequence = i })
  } else if (direction === 'down' && index < localWaypoints.value.length - 1) {
    const item = localWaypoints.value[index]!
    const next = localWaypoints.value[index + 1]!
    localWaypoints.value[index + 1] = item
    localWaypoints.value[index] = next
    localWaypoints.value.forEach((wp, i) => { wp.sequence = i })
  }
}

function validateWaypoint(index: number): boolean {
  const wp = localWaypoints.value[index]!
  const errors: Record<number, string> = {}

  if (!wp.latitude || isNaN(Number(wp.latitude))) {
    errors[index] = 'Valid latitude required'
  }
  if (!wp.longitude || isNaN(Number(wp.longitude))) {
    errors[index] = 'Valid longitude required'
  }
  if (!wp.altitude || isNaN(Number(wp.altitude))) {
    errors[index] = 'Valid altitude required'
  }

  newWaypointErrors.value = errors
  return Object.keys(errors).length === 0
}

function hasError(index: number): boolean {
  return index in newWaypointErrors.value
}

function getError(index: number): string | undefined {
  return newWaypointErrors.value[index]
}

async function saveWaypoints() {
  if (props.readonly) return

  // Validate all waypoints
  let valid = true
  localWaypoints.value.forEach((_, i) => {
    if (!validateWaypoint(i)) valid = false
  })
  if (!valid) return

  try {
    const payloads = localWaypoints.value.map(wp => {
      const payload: WaypointCreateInput = {
        sequence: wp.sequence,
        latitude: Number(wp.latitude),
        longitude: Number(wp.longitude),
        altitude: Number(wp.altitude)
      }
      if (wp.speed) payload.speed = Number(wp.speed)
      if (wp.holdTime) payload.hold_time = Number(wp.holdTime)
      if (wp.action) payload.action = wp.action as WaypointCreateInput['action']
      if (wp.notes) payload.notes = wp.notes
      return payload
    })

    // Delete existing and recreate
    await store.replaceWaypoints(props.mission.id, payloads)
    toast.add({
      title: 'Waypoints saved',
      description: `${payloads.length} waypoints updated.`,
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
    emit('update')
  } catch (e: any) {
    toast.add({
      title: 'Save failed',
      description: e?.message || 'Could not save waypoints.',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}
</script>

<template>
  <div class="space-y-4">
    <div
      v-if="mission.waypoints.length === 0"
      class="text-sm text-muted py-4 text-center"
    >
      No waypoints added yet
    </div>

    <div v-for="(wp, index) in localWaypoints" :key="index" class="border border-muted rounded-lg p-3 space-y-3">
      <!-- Waypoint header -->
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-highlighted">
          Waypoint {{ index + 1 }}
        </span>
        <div v-if="!readonly" class="flex items-center gap-1">
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
            :disabled="index === localWaypoints.length - 1"
            @click="moveWaypoint(index, 'down')"
          />
          <UButton
            size="xs"
            variant="ghost"
            color="error"
            icon="i-lucide-trash-2"
            :disabled="readonly || localWaypoints.length <= 1"
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
            :disabled="readonly"
            :class="{ 'border-error': hasError(index) && getError(index)?.includes('latitude') }"
          />
        </div>
        <div>
          <label class="block text-xs text-muted mb-1">Longitude</label>
          <UInput
            v-model="wp.longitude"
            type="number"
            step="any"
            :disabled="readonly"
            :class="{ 'border-error': hasError(index) && getError(index)?.includes('longitude') }"
          />
        </div>
        <div>
          <label class="block text-xs text-muted mb-1">Altitude (m)</label>
          <UInput
            v-model="wp.altitude"
            type="number"
            step="any"
            :disabled="readonly"
            :class="{ 'border-error': hasError(index) && getError(index)?.includes('altitude') }"
          />
        </div>
      </div>

      <p v-if="hasError(index)" class="text-xs text-error">{{ getError(index) }}</p>

      <!-- Optional fields -->
      <div class="grid grid-cols-3 gap-3" v-if="!readonly">
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
            :options="['survey', 'scan', 'hover', 'photo', 'video', 'sensor_read']"
            placeholder="None"
          />
        </div>
      </div>

      <div v-if="!readonly">
        <label class="block text-xs text-muted mb-1">Notes</label>
        <UInput v-model="wp.notes" placeholder="Optional notes..." />
      </div>
    </div>

    <!-- Add button -->
    <UButton
      v-if="!readonly"
      variant="ghost"
      icon="i-lucide-plus"
      label="Add Waypoint"
      class="w-full"
      @click="addWaypoint"
    />

    <!-- Save button -->
    <div v-if="!readonly" class="flex justify-end pt-2">
      <UButton
        label="Save Waypoints"
        icon="i-lucide-check"
        @click="saveWaypoints"
      />
    </div>
  </div>
</template>
