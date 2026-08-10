<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { MissionScan } from '~/types'
import FilterPanel from '@/components/FilterPanel.vue'
import { getOperatorLogoPath } from '~/utils/operatorLogoMap'
import { nextTick, watch, h, ref, computed } from 'vue'
import { getMissionScans } from '~/services/scan.service'

const props = defineProps<{
  missionId: string
}>()

const emit = defineEmits<{
  (e: 'data-loaded'): void
}>()

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50] as const

// --- State ---
const scans = ref<MissionScan[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const currentPage = ref(1)
const pageSize = ref(10)
const totalItems = ref(0)
const totalPages = ref(0)
const search = ref('')
const ratFilter = ref('ALL')
const isExporting = ref(false)

// Time range filter refs
const startDateTime = ref<string | null>(null)
const endDateTime = ref<string | null>(null)

// Sort
let sortColumn = 'scan_time'
let sortDirection: 'asc' | 'desc' = 'desc'

// --- Helpers ---
function getSortParam(): string {
  return `${sortDirection === 'asc' ? '' : '-'}${sortColumn}`
}

function getDefaultDateRange() {
  const now = new Date()
  const start = new Date(now)
  start.setMonth(now.getMonth() - 1)
  start.setHours(0, 0, 0, 0)
  const end = new Date(now)
  end.setHours(23, 59, 0, 0)
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return { start: fmt(start), end: fmt(end) }
}

function formatLocalIsoOffset(val: string): string | null {
  const d = new Date(val)
  if (isNaN(d.getTime())) return null
  const pad = (n: number) => String(n).padStart(2, '0')
  const y = d.getFullYear()
  const m = pad(d.getMonth() + 1)
  const day = pad(d.getDate())
  const hh = pad(d.getHours())
  const mm = pad(d.getMinutes())
  const ss = pad(d.getSeconds())
  const offsetMinutes = -d.getTimezoneOffset()
  const offsetSign = offsetMinutes >= 0 ? '+' : '-'
  const absOffset = Math.abs(offsetMinutes)
  const offsetH = pad(Math.floor(absOffset / 60))
  const offsetM = pad(absOffset % 60)
  return `${y}-${m}-${day}T${hh}:${mm}:${ss}${offsetSign}${offsetH}:${offsetM}`
}

async function fetchScans(resetPage = false) {
  if (resetPage) currentPage.value = 1
  loading.value = true
  error.value = null
  try {
    const params: Record<string, unknown> = {
      page: currentPage.value,
      page_size: pageSize.value,
      sort: getSortParam()
    }
    if (search.value.trim()) params.search = search.value.trim()
    if (ratFilter.value && ratFilter.value !== 'ALL') params.rat = ratFilter.value
    const start = startDateTime.value ? formatLocalIsoOffset(startDateTime.value) : null
    const end = endDateTime.value ? formatLocalIsoOffset(endDateTime.value) : null
    if (start) params.start_time = start
    if (end) params.end_time = end

    const result = await getMissionScans(props.missionId, params as any)
    scans.value = result.items
    totalItems.value = result.total
    totalPages.value = Math.ceil(result.total / pageSize.value)
  } catch (e: any) {
    error.value = e?.message ?? 'Failed to load mission scans'
    scans.value = []
    totalItems.value = 0
    totalPages.value = 0
  } finally {
    loading.value = false
  }
  emit('data-loaded')
}

function onPageChange(page: number) {
  currentPage.value = page
  fetchScans()
}

function onPageSizeChange() {
  currentPage.value = 1
  fetchScans()
}

async function updateTimeRange() {
  await nextTick()
  await fetchScans()
}

let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null
watch(search, (val) => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => fetchScans(), 300)
})

watch(ratFilter, () => fetchScans())

function onSort(column: string) {
  if (sortColumn === column) {
    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn = column
    sortDirection = 'desc'
  }
  fetchScans()
}

async function exportScans() {
  if (isExporting.value) return
  isExporting.value = true
  try {
    const params = new URLSearchParams()
    if (search.value) params.append('search', search.value)
    params.append('sort', '-scan_time')
    if (ratFilter.value && ratFilter.value !== 'ALL') {
      params.append('rat', ratFilter.value)
    }
    const start = startDateTime.value ? formatLocalIsoOffset(startDateTime.value) : null
    const end = endDateTime.value ? formatLocalIsoOffset(endDateTime.value) : null
    if (start) params.append('start_time', start)
    if (end) params.append('end_time', end)

    const config = useRuntimeConfig()
    const apiBase = config.public.apiBase as string || ''
    const url = `${apiBase}/missions/${props.missionId}/scans/export?${params.toString()}`

    const response = await fetch(url, {
      method: 'GET',
      headers: { accept: 'application/json' }
    })

    if (!response.ok) {
      throw new Error(`Export failed with status ${response.status}`)
    }

    let filename = `mission_${props.missionId}_scans.csv`
    const disposition = response.headers.get('content-disposition')
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^"]+)"?/)
      if (match && match[1]) filename = match[1]
    }

    const blob = await response.blob()
    const objectUrl = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(objectUrl)
  } catch (err: any) {
    console.error('Export error:', err)
  } finally {
    isExporting.value = false
  }
}

// --- Columns ---
const cellBase = 'whitespace-nowrap'
const columns: TableColumn<MissionScan>[] = [
  {
    id: 'row-number',
    header: '#',
    cell: ({ row }) => (currentPage.value - 1) * pageSize.value + row.index + 1,
    meta: {
      class: { th: `w-12 text-center ${cellBase}`, td: `text-center text-muted ${cellBase}` }
    }
  },
  {
    id: 'operator-logo',
    header: '',
    meta: {
      class: { th: `w-8 ${cellBase}`, td: `w-8 flex items-center justify-center px-0 py-4 ${cellBase}` }
    }
  },
  {
    id: 'operator',
    accessorKey: 'operator_name',
    header: () => h('button', {
      class: 'flex items-center gap-1 text-sm font-medium text-highlighted cursor-pointer hover:text-accented',
      onClick: () => onSort('operator')
    }, [
      'Operator',
      sortColumn === 'operator'
        ? h(resolveComponent('UIcon'), { name: sortDirection === 'asc' ? 'i-lucide-arrow-up-a-z' : 'i-lucide-arrow-down-a-z', class: 'w-3 h-3' })
        : h(resolveComponent('UIcon'), { name: 'i-lucide-arrow-up-down', class: 'w-3 h-3 opacity-50' })
    ]),
    cell: ({ row }) => h('a', {
      href: `/?scan=${row.original.id}`,
      class: 'text-primary hover:underline font-medium whitespace-nowrap'
    }, row.original.operator_name || 'Unknown')
  },
  {
    id: 'cellular_tower_id',
    accessorKey: 'cellular_tower_id',
    header: () => h('button', {
      class: 'flex items-center gap-1 text-sm font-medium text-highlighted cursor-pointer hover:text-accented',
      onClick: () => onSort('cellular_tower_id')
    }, [
      'Tower ID',
      sortColumn === 'cellular_tower_id'
        ? h(resolveComponent('UIcon'), { name: sortDirection === 'asc' ? 'i-lucide-arrow-up-a-z' : 'i-lucide-arrow-down-a-z', class: 'w-3 h-3' })
        : h(resolveComponent('UIcon'), { name: 'i-lucide-arrow-up-down', class: 'w-3 h-3 opacity-50' })
    ]),
    meta: {
      class: { th: `w-24 ${cellBase}`, td: `font-mono text-sm ${cellBase}` }
    }
  },
  {
    id: 'cellular_tower_name',
    accessorKey: 'cellular_tower_name',
    header: () => h('button', {
      class: 'flex items-center gap-1 text-sm font-medium text-highlighted cursor-pointer hover:text-accented',
      onClick: () => onSort('cellular_tower_name')
    }, [
      'Tower Name',
      sortColumn === 'cellular_tower_name'
        ? h(resolveComponent('UIcon'), { name: sortDirection === 'asc' ? 'i-lucide-arrow-up-a-z' : 'i-lucide-arrow-down-a-z', class: 'w-3 h-3' })
        : h(resolveComponent('UIcon'), { name: 'i-lucide-arrow-up-down', class: 'w-3 h-3 opacity-50' })
    ]),
    meta: {
      class: { th: `w-28 ${cellBase}`, td: `${cellBase}` }
    }
  },
  {
    id: 'mcc',
    accessorKey: 'mcc',
    header: () => h('button', {
      class: 'flex items-center gap-1 text-sm font-medium text-highlighted cursor-pointer hover:text-accented',
      onClick: () => onSort('mcc')
    }, [
      'MCC',
      sortColumn === 'mcc'
        ? h(resolveComponent('UIcon'), { name: sortDirection === 'asc' ? 'i-lucide-arrow-up-0-1' : 'i-lucide-arrow-down-0-1', class: 'w-3 h-3' })
        : h(resolveComponent('UIcon'), { name: 'i-lucide-arrow-up-down', class: 'w-3 h-3 opacity-50' })
    ]),
    meta: {
      class: { th: `w-16 ${cellBase}`, td: cellBase }
    }
  },
  {
    id: 'mnc',
    accessorKey: 'mnc',
    header: () => h('button', {
      class: 'flex items-center gap-1 text-sm font-medium text-highlighted cursor-pointer hover:text-accented',
      onClick: () => onSort('mnc')
    }, [
      'MNC',
      sortColumn === 'mnc'
        ? h(resolveComponent('UIcon'), { name: sortDirection === 'asc' ? 'i-lucide-arrow-up-0-1' : 'i-lucide-arrow-down-0-1', class: 'w-3 h-3' })
        : h(resolveComponent('UIcon'), { name: 'i-lucide-arrow-up-down', class: 'w-3 h-3 opacity-50' })
    ]),
    meta: {
      class: { th: `w-16 ${cellBase}`, td: cellBase }
    }
  },
  {
    id: 'rat',
    accessorKey: 'rat',
    header: () => h('button', {
      class: 'flex items-center gap-1 text-sm font-medium text-highlighted cursor-pointer hover:text-accented',
      onClick: () => onSort('rat')
    }, [
      'RAT',
      sortColumn === 'rat'
        ? h(resolveComponent('UIcon'), { name: sortDirection === 'asc' ? 'i-lucide-arrow-up-a-z' : 'i-lucide-arrow-down-a-z', class: 'w-3 h-3' })
        : h(resolveComponent('UIcon'), { name: 'i-lucide-arrow-up-down', class: 'w-3 h-3 opacity-50' })
    ]),
    meta: {
      class: { th: `w-16 ${cellBase}`, td: cellBase }
    }
  },
  {
    id: 'scan_time',
    accessorKey: 'scan_time',
    header: () => h('button', {
      class: 'flex items-center gap-1 text-sm font-medium text-highlighted cursor-pointer hover:text-accented',
      onClick: () => onSort('scan_time')
    }, [
      'Scan Time',
      sortColumn === 'scan_time'
        ? h(resolveComponent('UIcon'), { name: sortDirection === 'asc' ? 'i-lucide-calendar-arrow-up' : 'i-lucide-calendar-arrow-down', class: 'w-3 h-3' })
        : h(resolveComponent('UIcon'), { name: 'i-lucide-arrow-up-down', class: 'w-3 h-3 opacity-50' })
    ]),
    cell: ({ row }) => {
      const d = new Date(row.original.scan_time)
      return h('span', { class: 'whitespace-nowrap' }, d.toLocaleString('en-GB', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      }))
    }
  },
  {
    id: 'latitude',
    accessorKey: 'latitude',
    header: 'GPS',
    cell: ({ row }) => h('span', { class: 'whitespace-nowrap font-mono text-xs' },
      `${row.original.latitude.toFixed(4)}, ${row.original.longitude.toFixed(4)}`)
  }
]

// --- Lifecycle ---
onMounted(() => {
  const defaults = getDefaultDateRange()
  startDateTime.value = defaults.start
  endDateTime.value = defaults.end
  fetchScans()
})
</script>

<template>
  <div class="space-y-4">
    <!-- Filters -->
    <div class="px-4 py-3 border border-muted rounded-md bg-primary/5">
      <div class="flex items-center gap-4 flex-wrap">
        <!-- Search -->
        <div class="flex-1 min-w-[200px]">
          <label class="block text-sm font-medium text-muted mb-1">Search</label>
          <UInput
            v-model="search"
            icon="i-lucide-search"
            placeholder="Search by operator, MCC, or MNC..."
            class="w-full"
          />
        </div>
        <!-- From -->
        <div class="flex-1">
          <label for="start-datetime-scan" class="block text-sm font-medium text-muted mb-1">From</label>
          <UInput
            id="start-datetime-scan"
            type="datetime-local"
            :model-value="startDateTime ?? ''"
            @update:model-value="(v: string) => { startDateTime = v || null; updateTimeRange() }"
            class="w-full"
          />
        </div>
        <!-- To -->
        <div class="flex-1">
          <label for="end-datetime-scan" class="block text-sm font-medium text-muted mb-1">To</label>
          <UInput
            id="end-datetime-scan"
            type="datetime-local"
            :model-value="endDateTime ?? ''"
            @update:model-value="(v: string) => { endDateTime = v || null; updateTimeRange() }"
            class="w-full"
          />
        </div>
        <!-- RAT filter -->
        <div>
          <label class="block text-sm font-medium text-muted mb-1">RAT</label>
          <FilterPanel
            :selected-rat="ratFilter"
            @update:selected-rat="ratFilter = $event"
          />
        </div>
        <!-- Export (right-aligned) -->
        <div class="flex items-end ml-auto mt-6">
          <UButton
            icon="i-lucide-download"
            variant="outline"
            size="sm"
            :disabled="isExporting || (scans.length === 0 && !loading)"
            :color="isExporting || (scans.length === 0 && !loading) ? 'neutral' : 'primary'"
            :loading="isExporting"
            @click="exportScans"
          >
            Export
          </UButton>
        </div>
      </div>
    </div>

    <!-- Error state -->
    <div v-if="error" class="p-4 rounded-md bg-error/10 border border-error/30 text-sm text-error">
      {{ error }}
    </div>

    <!-- Loading state -->
    <div v-if="loading && scans.length === 0" class="py-12 text-center text-muted">
      <span class="i-lucide-loader text-2xl animate-spin inline-block mb-2" />
      <p>Loading scans…</p>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="!loading && scans.length === 0"
      class="flex flex-col items-center justify-center py-16 text-muted border border-muted rounded-md bg-primary/5"
    >
      <span class="i-lucide-search-x text-4xl mb-3" />
      <p>No Tower Scans for this mission.</p>
    </div>

    <!-- Desktop table -->
    <div class="overflow-x-auto border border-muted rounded-md bg-primary/5" v-else>
      <UTable
        :key="scans.length"
        :data="scans"
        :columns="columns"
        class="hidden lg:table w-max min-w-full"
      >
        <template #operator-logo-cell="{ row }">
          <img
            v-if="getOperatorLogoPath(row.original.operator_name)"
            :src="getOperatorLogoPath(row.original.operator_name)"
            :alt="row.original.operator_name || ''"
            class="w-5 h-5 object-contain"
          >
        </template>
      </UTable>
    </div>

    <!-- Mobile cards -->
    <div v-if="scans.length > 0" class="lg:hidden space-y-3">
      <a
        v-for="scan in scans"
        :key="scan.id"
        :href="`/?scan=${scan.id}`"
        class="block p-4 bg-elevated border border-muted rounded-lg hover:border-accented transition-colors"
      >
        <div class="flex items-center justify-between mb-1">
          <span class="font-medium text-default">{{ scan.operator_name || 'Unknown' }}</span>
          <UBadge size="sm" variant="subtle" color="neutral">
            {{ scan.rat }}
          </UBadge>
        </div>
        <div class="text-xs text-muted space-y-0.5">
          <div>Tower: {{ scan.cellular_tower_id }} - {{ scan.cellular_tower_name }}</div>
          <div>MCC: {{ scan.mcc }} | MNC: {{ scan.mnc }}</div>
          <div>{{ new Date(scan.scan_time).toLocaleString() }}</div>
          <div>{{ scan.latitude.toFixed(4) }}, {{ scan.longitude.toFixed(4) }}</div>
        </div>
      </a>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex justify-center">
      <UPagination
        :page="currentPage"
        :total="totalItems"
        :items-per-page="pageSize"
        @update:page="onPageChange"
      />
    </div>
  </div>
</template>
