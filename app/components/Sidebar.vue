<script setup lang="ts">
import { useScanStore } from '~/stores/scanStore'
import { useUiStore } from '~/stores/uiStore'

defineOptions({ name: 'AppSidebar' })

const scanStore = useScanStore()
const uiStore = useUiStore()

const searchTerm = ref('')
const selectedRat = ref('ALL')
const operatorFilter = ref('')

const filteredScans = computed(() => {
  let list = scanStore.scans

  if (selectedRat.value !== 'ALL') {
    list = list.filter(s => s.rat === selectedRat.value)
  }

  if (operatorFilter.value) {
    const q = operatorFilter.value.toLowerCase()
    list = list.filter(s => s.operator?.toLowerCase().includes(q))
  }

  return list
})

function handleSearch(val: string) {
  searchTerm.value = val
  scanStore.setSearch(val)
}

function handleSelectScan(id: string) {
  scanStore.selectScan(id)
}

async function handleNewScan() {
  await scanStore.createScan()
}

function resetFilters() {
  selectedRat.value = 'ALL'
  operatorFilter.value = ''
}

const isCreating = computed(() => scanStore.creating)
const isLoading = computed(() => scanStore.loading)
const isOpen = computed(() => uiStore.sidebarOpen)
</script>

<template>
  <aside
    v-if="isOpen"
    class="fixed left-4 top-20 z-40 w-[300px] max-h-[calc(100vh-5rem)] flex flex-col overflow-hidden rounded-xl border border-muted bg-black/70 backdrop-blur-md"
  >
    <div class="flex items-center justify-between border-b border-muted px-3 py-2">
      <h2 class="text-sm font-semibold text-default">
        Scan History
      </h2>
      <UButton
        color="neutral"
        variant="ghost"
        size="2xs"
        icon="i-lucide-panel-left-close"
        title="Toggle sidebar"
        @click="uiStore.toggleSidebar()"
      />
    </div>

    <div class="flex flex-col gap-2 overflow-hidden p-3">
      <SearchBox
        :model-value="searchTerm"
        placeholder="Search scans..."
        @update:model-value="handleSearch"
      />

      <FilterPanel
        :selected-rat="selectedRat"
        :operator-filter="operatorFilter"
        @update:selected-rat="selectedRat = $event"
        @update:operator-filter="operatorFilter = $event"
        @reset="resetFilters"
      />

      <UButton
        label="Get LTE Signal"
        icon="i-lucide-antenna"
        color="primary"
        size="sm"
        :loading="isCreating"
        :disabled="isCreating"
        class="w-full"
        @click="handleNewScan"
      />
    </div>

    <div class="flex-1 overflow-y-auto px-3 pb-3">
      <HistoryList
        :scans="filteredScans"
        :loading="isLoading"
        :selected-id="scanStore.selectedScanId"
        @select-scan="handleSelectScan"
      />
    </div>
  </aside>
</template>
