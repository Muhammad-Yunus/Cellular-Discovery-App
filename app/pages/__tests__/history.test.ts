/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'

vi.mock('#app/nuxt', () => ({
  useRuntimeConfig: vi.fn(() => ({
    public: {
      appName: 'LTE Scanner',
      apiBase: 'http://localhost:8000/api/v1',
      defaultLat: '-6.150676643667096',
      defaultLon: '106.89665223346297'
    }
  })),
  useNuxtApp: vi.fn(() => ({
    vueApp: { use: vi.fn() },
    $config: { public: {} },
    _route: { path: '/' }
  })),
  defineNuxtPlugin: vi.fn(),
  definePayloadPlugin: vi.fn(),
  defineAppConfig: vi.fn(),
  tryUseNuxtApp: vi.fn(),
  definePageMeta: vi.fn()
}))

vi.mock('#app/composables/router', () => ({
  useRoute: vi.fn(() => ({ path: '/' })),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  onBeforeRouteLeave: vi.fn(),
  onBeforeRouteUpdate: vi.fn()
}))

vi.mock('~/composables/useCustomToast', () => ({
  useCustomToast: vi.fn(() => ({
    add: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn()
  }))
}))

const mockScans = [
  { id: '1', operator: 'Telkomsel', mcc: '510', mnc: '10', rat: 'LTE', latitude: -6.15, longitude: 106.89, scan_time: '2024-01-01T00:00:00Z' },
  { id: '2', operator: 'Indosat', mcc: '510', mnc: '21', rat: 'NR', latitude: -6.16, longitude: 106.88, scan_time: '2024-01-02T00:00:00Z' }
]

function createMockScanStore() {
  return {
    scans: [] as any[],
    loading: false,
    creating: false,
    error: null as string | null,
    pagination: {
      currentPage: 1,
      limit: 20,
      totalItems: 0,
      offset: 0,
      totalPages: 0,
      searchTerm: ''
    },
    ratFilter: 'ALL' as string,
    sortColumn: '' as string,
    sortDirection: 'asc' as 'asc' | 'desc',
    selectedScanId: null as string | null,
    selectedScan: null as any,
    wsConnected: true as boolean,
    sortParam: 'scan_time' as string,
    fetchScans: vi.fn(),
    createScan: vi.fn(),
    selectScan: vi.fn(),
    deleteScan: vi.fn(),
    setPage: vi.fn(),
    setSearch: vi.fn(),
    setDateRange: vi.fn(),
    setRat: vi.fn(),
    toggleSort: vi.fn(),
    loadMoreScans: vi.fn(),
    setWsConnected: vi.fn()
  }
}

let currentMockScanState = createMockScanStore()

vi.mock('~/stores/scanStore', () => ({
  useScanStore: vi.fn(() => currentMockScanState)
}))

vi.mock('~/composables/useScan', () => {
  return {
    useScan: vi.fn(() => ({
      scans: ref(currentMockScanState.scans),
      selectedScan: ref(currentMockScanState.selectedScan),
      selectedScanId: ref(currentMockScanState.selectedScanId),
      loading: ref(currentMockScanState.loading),
      creating: ref(currentMockScanState.creating),
      error: ref(currentMockScanState.error),
      pagination: ref(currentMockScanState.pagination),
      wsConnected: ref(currentMockScanState.wsConnected),
      sortParam: ref(currentMockScanState.sortParam),
      fetchScans: currentMockScanState.fetchScans,
      startScan: vi.fn(),
      selectScan: currentMockScanState.selectScan,
      removeScan: currentMockScanState.deleteScan,
      setPage: currentMockScanState.setPage,
      setSearch: currentMockScanState.setSearch,
      setDateRange: currentMockScanState.setDateRange,
      toggleSort: currentMockScanState.toggleSort
    }))
  }
})

const UIStubs = {
  UInput: { template: '<div class="u-input" />' },
  USkeleton: { template: '<div class="u-skeleton" />' },
  UAlert: {
    props: ['title', 'description'],
    template: '<div class="u-alert"><div class="title">{{ title }}</div><div class="desc">{{ description }}</div><slot name="footer" /></div>'
  },
  UButton: {
    props: ['label'],
    template: '<button class="u-button">{{ label }}<slot /></button>'
  },
  UTable: {
    props: ['data'],
    template: '<div class="u-table"><div v-for="row in data" :key="row.id" class="u-table-row">{{ row.operator }}</div></div>'
  },
  UPagination: {
    props: ['page', 'total', 'itemsPerPage'],
    template: '<div class="u-pagination" />'
  },
  UBadge: {
    props: ['label'],
    template: '<span class="u-badge">{{ label }}</span>'
  },
  UIcon: { template: '<i class="u-icon" />' },
  FilterPanel: { template: '<div class="filter-panel" />' },
  NuxtLink: { template: '<a class="nuxt-link"><slot /></a>' },
  Toast: { template: '<div />' }
}

describe('HistoryPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    currentMockScanState = createMockScanStore()
    // Re-create the useScan mock with fresh refs
    vi.doMock('~/composables/useScan', () => {
      return {
        useScan: vi.fn(() => ({
          scans: ref(currentMockScanState.scans),
          selectedScan: ref(currentMockScanState.selectedScan),
          selectedScanId: ref(currentMockScanState.selectedScanId),
          loading: ref(currentMockScanState.loading),
          creating: ref(currentMockScanState.creating),
          error: ref(currentMockScanState.error),
          pagination: ref(currentMockScanState.pagination),
          wsConnected: ref(currentMockScanState.wsConnected),
          sortParam: ref(currentMockScanState.sortParam),
          fetchScans: currentMockScanState.fetchScans,
          startScan: vi.fn(),
          selectScan: currentMockScanState.selectScan,
          removeScan: currentMockScanState.deleteScan,
          setPage: currentMockScanState.setPage,
          setSearch: currentMockScanState.setSearch,
          setDateRange: currentMockScanState.setDateRange,
          toggleSort: currentMockScanState.toggleSort
        }))
      }
    })
  })

  it('renders page title', async () => {
    const Page = (await import('../history.vue')).default
    const wrapper = mount(Page, { global: { stubs: UIStubs } })
    expect(wrapper.text()).toContain('Scan History')
  }, 30000)

  it('shows loading skeleton when loading', async () => {
    currentMockScanState.loading = true
    const Page = (await import('../history.vue')).default
    const wrapper = mount(Page, { global: { stubs: UIStubs } })
    expect(wrapper.find('.u-skeleton').exists()).toBe(true)
  })

  it('shows error alert with retry button', async () => {
    currentMockScanState.error = 'Network error'
    const Page = (await import('../history.vue')).default
    const wrapper = mount(Page, { global: { stubs: UIStubs } })
    expect(wrapper.text()).toContain('Failed to load scan history')
    expect(wrapper.text()).toContain('Network error')
    expect(wrapper.text()).toContain('Retry')
  })

  it('shows empty state when no scans', async () => {
    const Page = (await import('../history.vue')).default
    const wrapper = mount(Page, { global: { stubs: UIStubs } })
    expect(wrapper.text()).toContain('No Scan Results')
  })

  it('renders scan list', async () => {
    currentMockScanState.scans = mockScans
    currentMockScanState.pagination = {
      currentPage: 1,
      limit: 20,
      totalItems: 2,
      offset: 0,
      totalPages: 1,
      searchTerm: ''
    }
    const Page = (await import('../history.vue')).default
    const wrapper = mount(Page, { global: { stubs: UIStubs } })
    expect(wrapper.text()).toContain('Telkomsel')
    expect(wrapper.text()).toContain('Indosat')
  })

  it('shows pagination when multiple pages', async () => {
    currentMockScanState.scans = mockScans
    currentMockScanState.pagination = {
      currentPage: 1,
      limit: 1,
      totalItems: 2,
      offset: 0,
      totalPages: 2,
      searchTerm: ''
    }
    const Page = (await import('../history.vue')).default
    const wrapper = mount(Page, { global: { stubs: UIStubs } })
    expect(wrapper.find('.u-pagination').exists()).toBe(true)
  })
})