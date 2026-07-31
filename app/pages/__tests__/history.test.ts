/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

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
  tryUseNuxtApp: vi.fn()
}))

vi.mock('~/app/composables/useScan', () => ({
  useScan: vi.fn()
}))

const mockScans = [
  { id: '1', operator: 'Telkomsel', mcc: '510', mnc: '10', rat: 'LTE', latitude: -6.15, longitude: 106.89, scan_time: '2024-01-01T00:00:00Z' },
  { id: '2', operator: 'Indosat', mcc: '510', mnc: '21', rat: 'NR', latitude: -6.16, longitude: 106.88, scan_time: '2024-01-02T00:00:00Z' }
]

function createMockUseScan(overrides: Record<string, unknown> = {}) {
  return {
    scans: [],
    loading: false,
    error: null,
    pagination: {
      currentPage: 1,
      limit: 20,
      totalItems: 0,
      offset: 0,
      totalPages: 0,
      searchTerm: ''
    },
    fetchScans: vi.fn(),
    setPage: vi.fn(),
    setSearch: vi.fn(),
    ...overrides
  }
}

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
  NuxtLink: { template: '<a class="nuxt-link"><slot /></a>' }
}

describe('HistoryPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders page title', async () => {
    const { useScan } = await import('~/app/composables/useScan')
    vi.mocked(useScan).mockReturnValue(createMockUseScan() as any)

    const Page = (await import('../history.vue')).default
    const wrapper = mount(Page, { global: { stubs: UIStubs } })
    expect(wrapper.text()).toContain('Scan History')
  }, 15000)

  it('shows loading skeleton when loading', async () => {
    const { useScan } = await import('~/app/composables/useScan')
    vi.mocked(useScan).mockReturnValue(createMockUseScan({ loading: true }) as any)

    const Page = (await import('../history.vue')).default
    const wrapper = mount(Page, { global: { stubs: UIStubs } })
    expect(wrapper.find('.u-skeleton').exists()).toBe(true)
  })

  it('shows error alert with retry button', async () => {
    const { useScan } = await import('~/app/composables/useScan')
    vi.mocked(useScan).mockReturnValue(createMockUseScan({ error: 'Network error' }) as any)

    const Page = (await import('../history.vue')).default
    const wrapper = mount(Page, { global: { stubs: UIStubs } })
    expect(wrapper.text()).toContain('Failed to load scan history')
    expect(wrapper.text()).toContain('Network error')
    expect(wrapper.text()).toContain('Retry')
  })

  it('shows empty state when no scans', async () => {
    const { useScan } = await import('~/app/composables/useScan')
    vi.mocked(useScan).mockReturnValue(createMockUseScan() as any)

    const Page = (await import('../history.vue')).default
    const wrapper = mount(Page, { global: { stubs: UIStubs } })
    expect(wrapper.text()).toContain('No Scan Results')
  })

  it('renders scan list', async () => {
    const { useScan } = await import('~/app/composables/useScan')
    vi.mocked(useScan).mockReturnValue(createMockUseScan({
      scans: mockScans,
      pagination: { currentPage: 1, limit: 20, totalItems: 2, offset: 0, totalPages: 1, searchTerm: '' }
    }) as any)

    const Page = (await import('../history.vue')).default
    const wrapper = mount(Page, { global: { stubs: UIStubs } })
    expect(wrapper.text()).toContain('Telkomsel')
    expect(wrapper.text()).toContain('Indosat')
  })

  it('shows pagination when multiple pages', async () => {
    const { useScan } = await import('~/app/composables/useScan')
    vi.mocked(useScan).mockReturnValue(createMockUseScan({
      scans: mockScans,
      pagination: { currentPage: 1, limit: 1, totalItems: 2, offset: 0, totalPages: 2, searchTerm: '' }
    }) as any)

    const Page = (await import('../history.vue')).default
    const wrapper = mount(Page, { global: { stubs: UIStubs } })
    expect(wrapper.find('.u-pagination').exists()).toBe(true)
  })
})
