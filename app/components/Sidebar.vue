<script setup lang="ts">
import { useScanStore } from '~/stores/scanStore'
import { useUiStore } from '~/stores/uiStore'

defineOptions({ name: 'AppSidebar' })

const scanStore = useScanStore()
const uiStore = useUiStore()

const searchTerm = ref('')
const selectedRat = ref('ALL')

const filteredScans = computed(() => {
  let list = scanStore.scans

  if (selectedRat.value !== 'ALL') {
    list = list.filter(s => s.rat === selectedRat.value)
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

const isLoading = computed(() => scanStore.loading)
const isOpen = computed(() => uiStore.sidebarOpen)

const scrollContainer = ref<HTMLDivElement | null>(null)

function handleScroll(event: Event) {
  const el = event.target as HTMLDivElement
  // Load more when within 50px of bottom
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50) {
    if (!scanStore.loadingMore) {
      scanStore.loadMoreScans()
    }
  }
}
</script>

<template>
  <aside
    v-if="isOpen"
    class="fixed left-4 top-20 bottom-4 z-[1100] w-[300px] flex flex-col overflow-hidden rounded-xl border border-muted bg-black/70 backdrop-blur-md shadow-lg"
  >
    <div class="flex items-center justify-between border-b border-muted px-3 py-2">
      <h2 class="text-sm font-semibold text-default">
        Scan History
      </h2>
    </div>

    <div class="flex flex-col gap-2 overflow-hidden p-3">
      <SearchBox
        :model-value="searchTerm"
        placeholder="Search scans..."
        @update:model-value="handleSearch"
      />

      <FilterPanel
        :selected-rat="selectedRat"
        @update:selected-rat="selectedRat = $event"
      />
    </div>

    <div
      ref="scrollContainer"
      class="flex-1 overflow-y-auto px-3 pb-3"
      @scroll="handleScroll"
    >
      <HistoryList
        :scans="filteredScans"
        :loading="isLoading"
        :selected-id="scanStore.selectedScanId"
        @select-scan="handleSelectScan"
      />

      <!-- Loading indicator when fetching more data -->
      <div v-if="scanStore.loadingMore" class="text-center py-2">
        <USkeleton class="w-16 mx-auto" />
      </div>
    </div>
  </aside>
</template>
