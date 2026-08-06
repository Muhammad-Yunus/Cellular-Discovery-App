// app/components/LocationList.vue
//
// Renders the list of GPS waypoints (locations) attached to a single mission.
// Provides per-row delete actions, an empty-state CTA, and a CSV export
// button. Consumes the collector mission store (`~/stores/mission.ts`) —
// the canonical source of truth for the Mission Planner feature.

<script setup lang="ts">
import { useCollectorMissionStore } from '~/stores/mission'
import type { MissionLocation } from '~/types/mission'

const props = defineProps<{
  missionId: string
}>()

const emit = defineEmits<{
  delete: [id: string]
}>()

const missionStore = useCollectorMissionStore()

const locations = computed<MissionLocation[]>(
  () => missionStore.locations
)
const loading = computed(() => missionStore.locationsLoading)

async function onDelete(id: string) {
  if (!confirm('Delete this location?')) return
  await missionStore.deleteLocation(props.missionId, id)
  emit('delete', id)
}

function exportCSV() {
  if (!locations.value.length) return
  const headers = ['order_index', 'latitude', 'longitude', 'altitude', 'created_at']
  const rows = locations.value.map((loc, idx) => [
    loc.order_index ?? idx + 1,
    loc.latitude,
    loc.longitude,
    loc.altitude ?? '',
    loc.created_at ?? ''
  ])
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `locations-${props.missionId}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}
</script>

<template>
  <div data-testid="location-list">
    <!-- Loading -->
    <div
      v-if="loading"
      class="flex items-center justify-center py-8 text-sm text-muted"
    >
      <span class="i-lucide-loader-circle mr-2 animate-spin" />
      Loading locations…
    </div>

    <!-- Empty -->
    <div
      v-else-if="locations.length === 0"
      class="rounded border border-default/10 bg-default p-6 text-center text-sm text-muted"
    >
      No locations uploaded yet.
      <NuxtLink
        :to="`/missions/${missionId}/locations/upload`"
        class="ml-2 text-primary hover:underline"
      >
        Upload CSV
      </NuxtLink>
    </div>

    <!-- Table -->
    <div
      v-else
      class="overflow-x-auto rounded border border-default/10 bg-default"
    >
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-default/10 text-left text-xs uppercase text-muted">
            <th class="px-4 py-3">#</th>
            <th class="px-4 py-3">Latitude</th>
            <th class="px-4 py-3">Longitude</th>
            <th class="px-4 py-3">Altitude</th>
            <th class="px-4 py-3">Created</th>
            <th class="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(loc, idx) in locations"
            :key="loc.id"
            class="border-b border-default/5 hover:bg-accented/30"
          >
            <td class="px-4 py-3 text-muted">{{ idx + 1 }}</td>
            <td class="px-4 py-3 font-mono">{{ loc.latitude }}</td>
            <td class="px-4 py-3 font-mono">{{ loc.longitude }}</td>
            <td class="px-4 py-3 font-mono">{{ loc.altitude ?? '—' }}</td>
            <td class="px-4 py-3 text-muted">{{ loc.created_at ? new Date(loc.created_at).toLocaleString() : '—' }}</td>
            <td class="px-4 py-3 text-right">
              <UButton
                icon="i-lucide-trash-2"
                variant="ghost"
                size="xs"
                color="error"
                aria-label="Delete location"
                @click="onDelete(loc.id)"
              />
            </td>
          </tr>
        </tbody>
      </table>
      <div class="flex items-center justify-between px-4 py-3 text-xs text-muted">
        <span>{{ locations.length }} location(s)</span>
        <UButton
          icon="i-lucide-download"
          size="sm"
          variant="ghost"
          @click="exportCSV"
        >
          Export CSV
        </UButton>
      </div>
    </div>
  </div>
</template>