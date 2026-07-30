<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { ScanSummary } from '~/types'
import FilterPanel from '@/components/FilterPanel.vue'

definePageMeta({ title: 'Scan Result' })

const scanStore = useScanStore()

const {
  scans,
  loading,
  error,
  pagination,
  fetchScans,
  setPage,
  setSearch
} = useScan()

const search = ref(pagination.searchTerm)
const currentPage = computed(() => pagination.offset / pagination.limit + 1)
const totalPages = computed(() => pagination.totalPages)
const totalItems = computed(() => pagination.totalItems)

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
    cell: ({ row }) => new Date(row.original.scan_time).toLocaleString()
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
        Scan Result
      </h1>
    </div>

    <div class="flex flex-col md:flex-row gap-4 mb-4 items-center">
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Search by operator, MCC, or MNC..."
        class="flex-1"
      />
      <FilterPanel
        :selected-rat="scanStore.ratFilter"
        @update:selected-rat="scanStore.setRat"
      />
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

    <UTable
      v-else
      :key="scans.length"
      :data="scans"
      :columns="columns"
      class="hidden lg:table"
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
