<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { ScanSummary } from '~/types'
import FilterPanel from '@/components/FilterPanel.vue'
import { useCustomToast } from '@/composables/useCustomToast'
import { nextTick, watch } from 'vue'

definePageMeta({ title: 'Scan History' })
const toast = useCustomToast()

const scanStore = useScanStore()

const {
  scans,
  loading,
  error,
  pagination,
  fetchScans,
  setPage,
  setSearch,
  setDateRange
} = useScan()

const search = ref(pagination.searchTerm)
const currentPage = computed(() => pagination.offset / pagination.limit + 1)
const totalPages = computed(() => pagination.totalPages)
const totalItems = computed(() => pagination.totalItems)

// Time range filter refs
const startDateTime = ref<string | null>(null)
const endDateTime = ref<string | null>(null)

// Show toast whenever an error occurs
watch(error, (newErr) => {
  if (newErr) {
    toast.add({ title: 'Error', description: newErr, color: 'error', icon: 'exclamation-triangle' })
  }
})

// Helper to produce default time range: 1 month ago at 00:00 → today at 23:59 (local time)
function getDefaultDateRange() {
  const now = new Date()
  // Start: one month ago at 00:00
  const start = new Date(now)
  start.setMonth(now.getMonth() - 1)
  start.setHours(0, 0, 0, 0)
  // End: today at 23:59
  const end = new Date(now)
  end.setHours(23, 59, 0, 0)
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return { start: fmt(start), end: fmt(end) }
}

onMounted(() => {
  // Set default time range (1 month ago to today) on first load
  const defaults = getDefaultDateRange()
  startDateTime.value = defaults.start
  endDateTime.value = defaults.end
  // Apply the default range to the store (this triggers fetch)
  updateTimeRange()
})

function formatLocalIsoOffset(val: string): string | null {
  // Input is local datetime like "YYYY-MM-DDTHH:mm" or "YYYY-MM-DDTHH:mm:ss".
  // Produce ISO string without fractional seconds, with local timezone offset, e.g., "2026-07-30T17:22:00+07:00"
  const d = new Date(val)
  if (isNaN(d.getTime())) return null
  const pad = (n: number) => String(n).padStart(2, '0')
  const y = d.getFullYear()
  const m = pad(d.getMonth() + 1)
  const day = pad(d.getDate())
  const hh = pad(d.getHours())
  const mm = pad(d.getMinutes())
  const ss = pad(d.getSeconds())
  const offsetMinutes = -d.getTimezoneOffset() // minutes east of UTC
  const offsetSign = offsetMinutes >= 0 ? '+' : '-'
  const absOffset = Math.abs(offsetMinutes)
  const offsetH = pad(Math.floor(absOffset / 60))
  const offsetM = pad(absOffset % 60)
  return `${y}-${m}-${day}T${hh}:${mm}:${ss}${offsetSign}${offsetH}:${offsetM}`
}

async function updateTimeRange() {
  // Wait for v-model to update startDateTime / endDateTime
  await nextTick()
  const start = startDateTime.value ? formatLocalIsoOffset(startDateTime.value) : null
  const end = endDateTime.value ? formatLocalIsoOffset(endDateTime.value) : null
  console.log('[History] updateTimeRange called:', { start, end })

  // Validation: if both dates provided, ensure start <= end
  if (start && end) {
    const dStart = new Date(start)
    const dEnd = new Date(end)
    if (!isNaN(dStart.getTime()) && !isNaN(dEnd.getTime())) {
      if (dStart > dEnd) {
        // Error: show toast, do not send request, clear table and error state
        console.error('Invalid time range: Start time is after end time')
        // Clear table data
        scanStore.scans = []
        scanStore.pagination.totalItems = 0
        scanStore.pagination.totalPages = 0

        // Set error for both UI alert and toast via watch
        scanStore.error = 'Start time cannot be after end time.'
        return
      }
    }
  }
  setDateRange(start, end)
}



let debounceTimer: ReturnType<typeof setTimeout> | null = null
watch(search, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => setSearch(val), 300)
})

function onPageChange(page: number) {
  setPage(page)
}

const columns: TableColumn<ScanSummary>[] = [
  {
    accessorKey: 'operator',
    header: 'Operator'
  },
  {
    accessorKey: 'mcc',
    header: 'MCC'
  },
  {
    accessorKey: 'mnc',
    header: 'MNC'
  },
  {
    accessorKey: 'rat',
    header: 'RAT'
  },
  {
    accessorKey: 'scan_time',
    header: 'Scan Time',
    cell: ({ row }) => {
      const d = new Date(row.original.scan_time)
      return d.toLocaleString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })
    }
  },
  {
    accessorKey: 'latitude',
    header: 'GPS',
    cell: ({ row }) => `${row.original.latitude.toFixed(4)}, ${row.original.longitude.toFixed(4)}`
  }
]
</script>

<template>
  <div class="p-4 md:p-6 max-w-5xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-semibold text-highlighted">
        Scan History
      </h1>
    </div>

    <!-- Combined Filters: Search, Time Range, RAT -->
    <div class="flex flex-col md:flex-row gap-4 mb-4 items-center">
      <!-- Search input -->
      <div class="flex-1 min-w-[200px]">
        <label class="block text-sm font-medium text-muted mb-1">Search</label>
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Search by operator, MCC, or MNC..."
          class="w-full"
        />
      </div>
        <!-- From datetime -->
        <div class="flex-1">
          <label class="block text-sm font-medium text-muted mb-1">From</label>
          <UInput
            type="datetime-local"
            v-model="startDateTime"
            @change="updateTimeRange"
            class="w-full"
          />
        </div>
        <!-- To datetime -->
        <div class="flex-1">
          <label class="block text-sm font-medium text-muted mb-1">To</label>
          <UInput
            type="datetime-local"
            v-model="endDateTime"
            @change="updateTimeRange"
            class="w-full"
          />
        </div>
      <!-- RAT filter -->
      <div class="min-w-[150px]">
        <label class="block text-sm font-medium text-muted mb-1">RAT</label>
        <FilterPanel
          :selected-rat="scanStore.ratFilter"
          @update:selected-rat="scanStore.setRat"
          class="w-full"
        />
      </div>
    </div>

    <template v-if="loading">
      <div class="space-y-3">
        <USkeleton
          v-for="i in 5"
          :key="i"
          class="h-12 w-full"
        />
      </div>
    </template>

    <UAlert
      v-else-if="error"
      color="error"
      icon="i-lucide-alert-circle"
      title="Failed to load scan history"
      :description="error"
      variant="soft"
    >
      <template #footer>
        <UButton
          label="Retry"
          color="neutral"
          variant="outline"
          @click="fetchScans"
        />
      </template>
    </UAlert>

    <div
      v-else-if="scans.length === 0"
      class="flex flex-col items-center justify-center py-16 text-muted"
    >
      <span
        :class="search ? 'i-lucide-search-x' : 'i-lucide-inbox'"
        class="text-4xl mb-3"
      />
      <p v-if="search">
        No results for "{{ search }}"
      </p>
      <p v-else>
        No Scan Results
      </p>
    </div>

    <div class="overflow-x-auto">
      <UTable
        v-else
        :key="scans.length"
        :data="scans"
        :columns="columns"
        class="hidden lg:table w-full"
      >
      <template #operator-cell="{ row }">
        <NuxtLink
          :to="`/?scan=${row.original.id}`"
          class="text-primary hover:underline font-medium"
        >
          {{ row.original.operator || 'Unknown' }}
        </NuxtLink>
      </template>
    </UTable>
    </div>

    <div
      v-if="scans.length > 0"
      class="lg:hidden space-y-3"
    >
      <NuxtLink
        v-for="scan in scans"
        :key="scan.id"
        :to="`/?scan=${scan.id}`"
        class="block p-4 bg-elevated border border-muted rounded-lg hover:border-accented transition-colors"
      >
        <div class="flex items-center justify-between mb-1">
          <span class="font-medium text-default">{{ scan.operator || 'Unknown' }}</span>
          <UBadge
            size="sm"
            variant="subtle"
            color="neutral"
          >
            {{ scan.rat }}
          </UBadge>
        </div>
        <div class="text-xs text-muted space-y-0.5">
          <div>MCC: {{ scan.mcc }} | MNC: {{ scan.mnc }}</div>
          <div>{{ new Date(scan.scan_time).toLocaleString() }}</div>
          <div>{{ scan.latitude.toFixed(4) }}, {{ scan.longitude.toFixed(4) }}</div>
        </div>
      </NuxtLink>
    </div>

    <div
      v-if="totalPages > 1"
      class="flex justify-center mt-6"
    >
      <UPagination
        :page="currentPage"
        :total="totalItems"
        :items-per-page="pagination.limit"
        @update:page="onPageChange"
      />
    </div>
  </div>
</template>
