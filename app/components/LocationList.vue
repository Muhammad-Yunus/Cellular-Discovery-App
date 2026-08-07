// app/components/LocationList.vue
//
// Renders the list of GPS waypoints (locations) attached to a single mission.
// Provides per-row delete actions, an empty-state CTA, and a CSV export
// button. Consumes the collector mission store (`~/stores/mission.ts`) —
// the canonical source of truth for the Mission Planner feature.

<script setup lang="ts">
import { useCollectorMissionStore } from '~/stores/mission'
import type { MissionLocation } from '~/types/mission'
import type { TableColumn } from '@nuxt/ui'
import { useCustomToast } from '~/composables/useCustomToast'
import { h, resolveComponent } from 'vue'

const props = defineProps<{
  missionId: string
}>()

const emit = defineEmits<{
  delete: [id: string]
}>()

const missionStore = useCollectorMissionStore()
const toast = useCustomToast()

const locations = computed<MissionLocation[]>(
  () => missionStore.locations
)
const loading = computed(() => missionStore.locationsLoading)
const error = computed(() => missionStore.locationsError)
const isIdle = computed(() => missionStore.selectedMission?.status === 'IDLE')

// Row-number offset (1-based, like /history)
const rowOffset = ref(1)

watch(locations, () => {
  // Keep offset sticky on the first page; reset on data shrink so # always starts at 1.
  if (locations.value.length === 0) rowOffset.value = 1
})

// Delete confirmation state
const deleteTarget = ref<{ id: string; towerId: string; towerName: string } | null>(null)

async function onDelete(loc: MissionLocation) {
  deleteTarget.value = {
    id: loc.id,
    towerId: loc.cellular_tower_id,
    towerName: loc.cellular_tower_name
  }
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  const { id, towerId, towerName } = deleteTarget.value
  try {
    await missionStore.deleteLocation(props.missionId, id)
    emit('delete', id)
    toast.add({
      title: 'Location deleted',
      description: `Tower ${towerId} — ${towerName} has been removed.`,
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
  } catch (e: any) {
    toast.add({
      title: 'Delete failed',
      description: e?.message || 'Could not delete location.',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  } finally {
    deleteTarget.value = null
  }
}

function exportCSV() {
  if (!locations.value.length) return
  const headers = ['cellular_tower_id', 'cellular_tower_name', 'latitude', 'longitude', 'created_at']
  const rows = locations.value.map((loc) => [
    loc.cellular_tower_id,
    loc.cellular_tower_name,
    loc.latitude,
    loc.longitude,
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

// Table columns (mirrors /history style with operator-logo + row-number pattern)
const columns: TableColumn<MissionLocation>[] = [
  {
    id: 'row-number',
    header: '#',
    cell: ({ row }) => rowOffset.value + row.index,
    meta: {
      class: {
        th: 'w-12 text-center',
        td: 'text-center text-muted'
      }
    }
  },
  {
    id: 'tower-id',
    accessorKey: 'cellular_tower_id',
    header: 'Tower ID',
    cell: ({ row }) => h('span', { class: 'font-mono' }, row.original.cellular_tower_id),
    meta: {
      class: {
        th: 'whitespace-nowrap'
      }
    }
  },
  {
    id: 'tower-name',
    accessorKey: 'cellular_tower_name',
    header: 'Tower Name'
  },
  {
    id: 'latitude',
    accessorKey: 'latitude',
    header: 'Latitude',
    cell: ({ row }) => h('span', { class: 'font-mono' }, String(row.original.latitude)),
    meta: {
      class: {
        th: 'whitespace-nowrap',
        td: 'font-mono'
      }
    }
  },
  {
    id: 'longitude',
    accessorKey: 'longitude',
    header: 'Longitude',
    cell: ({ row }) => h('span', { class: 'font-mono' }, String(row.original.longitude)),
    meta: {
      class: {
        th: 'whitespace-nowrap',
        td: 'font-mono'
      }
    }
  },
  {
    id: 'created',
    accessorKey: 'created_at',
    header: 'Created',
    cell: ({ row }) =>
      row.original.created_at
        ? h('span', { class: 'text-muted' }, new Date(row.original.created_at).toLocaleString('en-GB', { hour12: false }))
        : h('span', { class: 'text-muted' }, '—')
  },
  {
    id: 'actions',
    header: () => h('span', { class: 'sr-only' }, 'Actions'),
    meta: {
      class: {
        th: 'w-12 text-right',
        td: 'text-right'
      }
    },
    cell: ({ row }) => {
      if (!isIdle.value) {
        return h('span', {
          class: 'text-xs text-muted',
          title: 'Location can only be removed while mission is IDLE'
        }, '—')
      }
      return h(resolveComponent('UButton'), {
        icon: 'i-lucide-trash-2',
        variant: 'ghost',
        size: 'xs',
        color: 'error',
        'aria-label': 'Delete location',
        onClick: () => onDelete(row.original)
      })
    }
  }
]

async function fetchLocations() {
  await missionStore.fetchLocations(props.missionId)
}

onMounted(fetchLocations)
</script>

<template>
  <div data-testid="location-list" class="space-y-4">
    <!-- Toolbar (mirrors /history filter row) -->
    <div class="px-4 py-3 border border-muted rounded-md bg-primary/5">
      <div class="flex items-center gap-4 flex-wrap">
        <div class="flex-1 min-w-[200px]">
          <label class="block text-sm font-medium text-muted mb-1">Mission Locations</label>
          <p class="text-xs text-muted">
            Tower GPS Coordinate to mission {{ missionId }}
          </p>
        </div>
        <div class="flex items-end ml-auto mt-6">
          <UButton
            icon="i-lucide-download"
            variant="outline"
            size="sm"
            :disabled="loading || locations.length === 0"
            :color="loading || locations.length === 0 ? 'neutral' : 'primary'"
            @click="exportCSV"
          >
            Export
          </UButton>
        </div>
      </div>
    </div>

    <!-- Loading skeleton (mirrors /history) -->
    <template v-if="loading">
      <div class="space-y-3">
        <USkeleton
          v-for="i in 5"
          :key="i"
          class="h-12 w-full"
        />
      </div>
    </template>

    <!-- Error state (mirrors /history UAlert) -->
    <UAlert
      v-else-if="error"
      color="error"
      icon="i-lucide-alert-circle"
      title="Failed to load locations"
      :description="error"
      variant="soft"
    >
      <template #footer>
        <UButton
          label="Retry"
          color="neutral"
          variant="outline"
          @click="fetchLocations"
        />
      </template>
    </UAlert>

    <!-- Empty state (mirrors /history) -->
    <div
      v-else-if="locations.length === 0"
      class="flex flex-col items-center justify-center py-16 text-muted border border-muted rounded-md bg-primary/5"
    >
      <span class="i-lucide-map-pin text-4xl mb-3" />
      <p>No locations uploaded yet.</p>
      <NuxtLink
        :to="`/missions/${missionId}/locations/upload`"
        class="mt-3 text-primary hover:underline text-sm"
      >
        Upload CSV
      </NuxtLink>
    </div>

    <!-- Desktop table -->
    <div
      v-else
      class="overflow-x-auto border border-muted rounded-md bg-primary/5"
    >
      <UTable
        :key="locations.length"
        :data="locations"
        :columns="columns"
        class="hidden lg:table w-full"
      />
    </div>

    <!-- Mobile cards -->
    <div
      v-if="locations.length > 0"
      class="lg:hidden space-y-3"
    >
      <div
        v-for="(loc, idx) in locations"
        :key="loc.id"
        class="block p-4 bg-elevated border border-muted rounded-lg"
      >
        <div class="flex items-center justify-between mb-1">
          <span class="font-medium text-default">{{ loc.cellular_tower_name }}</span>
          <UButton
            v-if="isIdle"
            icon="i-lucide-trash-2"
            variant="ghost"
            size="xs"
            color="error"
            aria-label="Delete location"
            @click="onDelete(loc)"
          />
          <span
            v-else
            class="text-xs text-muted"
            title="Location can only be removed while mission is IDLE"
          >—</span>
        </div>
        <div class="text-xs text-muted space-y-0.5 font-mono">
          <div>#{{ rowOffset + idx }} · Tower {{ loc.cellular_tower_id }}</div>
          <div>Lat: {{ loc.latitude }}</div>
          <div>Lon: {{ loc.longitude }}</div>
          <div>{{ loc.created_at ? new Date(loc.created_at).toLocaleString('en-GB', { hour12: false }) : '—' }}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Delete Confirmation Popup -->
  <div
    v-if="deleteTarget"
    class="fixed inset-0 z-[1300] flex items-center justify-center p-4"
  >
    <!-- Backdrop -->
    <div
      class="absolute inset-0 bg-black/50 backdrop-blur-sm"
      @click="deleteTarget = null"
    />
    <!-- Popup -->
    <div class="relative bg-default border border-muted rounded-lg shadow-lg w-full max-w-sm p-5">
      <div class="flex items-start gap-3">
        <div class="shrink-0 w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
          <Icon name="lucide:alert-triangle" class="text-red-500 text-lg shrink-0" aria-hidden="true" />
        </div>
        <div>
          <h3 class="text-sm font-semibold text-highlighted">Delete Location</h3>
          <p class="text-xs text-muted mt-1">
            Are you sure you want to delete
            <span class="text-red-500 font-semibold">{{ deleteTarget.towerId }} — {{ deleteTarget.towerName }}</span>
            location? This action cannot be undone.
          </p>
        </div>
      </div>
      <div class="flex items-center justify-end gap-2 mt-5">
        <UButton
          size="xs"
          variant="ghost"
          label="Cancel"
          @click="deleteTarget = null"
        />
        <UButton
          size="xs"
          color="error"
          label="Delete"
          :loading="missionStore.saving"
          @click="confirmDelete"
        />
      </div>
    </div>
  </div>
</template>
