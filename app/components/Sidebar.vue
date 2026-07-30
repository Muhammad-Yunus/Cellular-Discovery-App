<script setup lang="ts">
import { useScanStore } from '~/stores/scanStore'
import { useUiStore } from '~/stores/uiStore'

defineOptions({ name: 'AppSidebar' })

const scanStore = useScanStore()
const uiStore = useUiStore()

const searchTerm = ref('')
// Initialise from the store so the filter survives page reloads.
const selectedRat = ref(scanStore.ratFilter ?? 'ALL')

// Reactively reflect any external changes to the store filter (e.g. when
// navigating back to the page). The FilterPanel also emits updates.
watch(
  () => scanStore.ratFilter,
  (val) => {
    if (val !== selectedRat.value) selectedRat.value = val ?? 'ALL'
  }
)

// The list displayed in the sidebar is already filtered server‑side via
// the `rat` query parameter, so we can use the store list directly.
const filteredScans = computed(() => scanStore.scans)

function handleSearch(val: string) {
  searchTerm.value = val
  scanStore.setSearch(val)
}

function handleSelectScan(id: string) {
  scanStore.selectScan(id)
}

function handleRatChange(val: string) {
  selectedRat.value = val
  // Push the filter to the store which triggers a fresh API call.
  scanStore.setRat(val)
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

/**
 * When the selected scan changes (e.g. via clicking a map marker),
 * bring the corresponding HistoryCard into view inside the sidebar so
 * the user can see which item is currently active.
 */
watch(
  () => scanStore.selectedScanId,
  async (id) => {
    if (!id) return
    // Wait for Vue to flush DOM updates so the target card exists.
    await nextTick()
    const container = scrollContainer.value
    if (!container) return
    const el = container.querySelector(`[data-scan-id="${id}"]`) as HTMLElement | null
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }
)
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
        @update:selected-rat="handleRatChange"
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
