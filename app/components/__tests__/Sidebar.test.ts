import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import type { ScanSummary } from '~/types'

// Static imports: vi.mock() above is hoisted so the resolved components
// already have mocks applied. This avoids re-transform inside each it() block.
import Sidebar from '../Sidebar.vue'
import HistoryCard from '../HistoryCard.vue'
import HistoryList from '../HistoryList.vue'
import FilterPanel from '../FilterPanel.vue'
import SearchBox from '../SearchBox.vue'

interface MockScanStore {
  scans: ScanSummary[]
  selectedScanId: string | null
  selectedScan: ScanSummary | null
  loading: boolean
  creating: boolean
  error: string | null
  pagination: { currentPage: number, limit: number, totalItems: number, offset: number, totalPages: number, searchTerm: string }
  fetchScans: ReturnType<typeof vi.fn>
  createScan: ReturnType<typeof vi.fn>
  selectScan: ReturnType<typeof vi.fn>
  deleteScan: ReturnType<typeof vi.fn>
  setPage: ReturnType<typeof vi.fn>
  setSearch: ReturnType<typeof vi.fn>
}

interface MockUiStore {
  sidebarOpen: boolean
  bottomPanelOpen: boolean
  activeInfoTab: 'signal' | 'gps' | 'system'
  toggleSidebar: ReturnType<typeof vi.fn>
  toggleBottomPanel: ReturnType<typeof vi.fn>
  setActiveTab: ReturnType<typeof vi.fn>
}

const mockScanStore = (): MockScanStore => ({
  scans: [],
  selectedScanId: null,
  selectedScan: null,
  loading: false,
  creating: false,
  error: null,
  pagination: { currentPage: 1, limit: 20, totalItems: 0, offset: 0, totalPages: 0, searchTerm: '' },
  fetchScans: vi.fn(),
  createScan: vi.fn(),
  selectScan: vi.fn(),
  deleteScan: vi.fn(),
  setPage: vi.fn(),
  setSearch: vi.fn()
})

const mockUiStore = (): MockUiStore => ({
  sidebarOpen: true,
  bottomPanelOpen: true,
  activeInfoTab: 'signal',
  toggleSidebar: vi.fn(),
  toggleBottomPanel: vi.fn(),
  setActiveTab: vi.fn()
})

let currentScanStore: MockScanStore = mockScanStore()
let currentUiStore: MockUiStore = mockUiStore()

vi.mock('#app/nuxt', () => ({
  useRuntimeConfig: vi.fn(() => ({
    public: {
      appName: 'LTE Scanner',
      apiBase: 'http://localhost:8001/api/v1',
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

vi.mock('#app/composables/router', () => ({
  useRoute: vi.fn(() => ({ path: '/' })),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  onBeforeRouteLeave: vi.fn(),
  onBeforeRouteUpdate: vi.fn()
}))

vi.mock('~/stores/scanStore', () => ({
  useScanStore: vi.fn(() => currentScanStore)
}))

vi.mock('~/stores/uiStore', () => ({
  useUiStore: vi.fn(() => currentUiStore)
}))

const mockScan = {
  id: '1',
  operator: 'Telkomsel',
  mcc: '510',
  mnc: '10',
  rat: 'LTE',
  latitude: -6.15,
  longitude: 106.89,
  scan_time: '2024-01-01T12:00:00Z',
  signal_strength: -75
}

function mountWithStubs(component: object, options: Record<string, unknown> = {}) {
  const defaultStubs = {
    SearchBox: { template: '<div data-testid="search-box" />' },
    FilterPanel: { template: '<div data-testid="filter-panel" />' },
    HistoryList: { template: '<div data-testid="history-list" />' },
    HistoryCard: { template: '<div data-testid="history-card"><slot /></div>' },
    UBadge: { template: '<span data-testid="u-badge"><slot /><span v-if="$props.label">{{ $props.label }}</span></span>', props: ['color', 'variant', 'size', 'label'] },
    UCard: { template: '<div data-testid="u-card" @click="$emit(\'click\', $event)"><slot /></div>' },
    UButton: { template: '<button data-testid="u-button" :disabled="$props.disabled" :title="$props.title" @click="$emit(\'click\', $event)"><slot />{{ $props.label }}</button>', props: ['label', 'color', 'variant', 'size', 'icon', 'loading', 'disabled', 'title'] },
    UInput: { template: '<input data-testid="u-input" :placeholder="$props.placeholder" :value="$props.modelValue" />', props: ['modelValue', 'placeholder', 'leadingIcon', 'size'] },
    USkeleton: { template: '<div data-testid="u-skeleton" />' }
  }
  return mount(component, {
    global: { stubs: defaultStubs },
    ...options
  })
}

describe('Sidebar', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    currentScanStore = mockScanStore()
    currentUiStore = mockUiStore()
  })

  it('renders when sidebarOpen is true', () => {
    currentUiStore.sidebarOpen = true
    const wrapper = mountWithStubs(Sidebar)
    expect(wrapper.find('aside').exists()).toBe(true)
  }, 30000)

  it('does not render when sidebarOpen is false', () => {
    currentUiStore.sidebarOpen = false
    const wrapper = mountWithStubs(Sidebar)
    expect(wrapper.find('aside').exists()).toBe(false)
  })

  it('renders Scan History title', () => {
    const wrapper = mountWithStubs(Sidebar)
    expect(wrapper.text()).toContain('Scan History')
  })

  it('renders SearchBox subcomponent', () => {
    const wrapper = mountWithStubs(Sidebar)
    expect(wrapper.find('[data-testid="search-box"]').exists()).toBe(true)
  })

  it('renders FilterPanel subcomponent', () => {
    const wrapper = mountWithStubs(Sidebar)
    expect(wrapper.find('[data-testid="filter-panel"]').exists()).toBe(true)
  })

  it('renders HistoryList subcomponent', () => {
    const wrapper = mountWithStubs(Sidebar)
    expect(wrapper.find('[data-testid="history-list"]').exists()).toBe(true)
  })
})

describe('HistoryCard', () => {
  it('renders scan operator and RAT', () => {
    const wrapper = mountWithStubs(HistoryCard, { props: { scan: mockScan } })
    expect(wrapper.text()).toContain('Telkomsel')
    expect(wrapper.text()).toContain('LTE')
  })

  it('renders MCC/MNC', () => {
    const wrapper = mountWithStubs(HistoryCard, { props: { scan: mockScan } })
    expect(wrapper.text()).toContain('510')
    expect(wrapper.text()).toContain('10')
  })

  it('emits select with scan id on click', async () => {
    const wrapper = mountWithStubs(HistoryCard, { props: { scan: mockScan } })
    await wrapper.find('[data-scan-id="1"]').trigger('click')
    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')![0]).toEqual(['1'])
  })

  it('shows Unknown Operator when operator is empty', () => {
    const wrapper = mountWithStubs(HistoryCard, { props: { scan: { ...mockScan, operator: '' } } })
    expect(wrapper.text()).toContain('Unknown Operator')
  })

  it('renders scan time', () => {
    const wrapper = mountWithStubs(HistoryCard, { props: { scan: mockScan } })
    expect(wrapper.text()).toContain('2024')
  })
})

describe('HistoryList', () => {
  it('shows skeleton when loading', () => {
    const wrapper = mountWithStubs(HistoryList, { props: { scans: [], loading: true, selectedId: null } })
    expect(wrapper.findAll('[data-testid="u-skeleton"]').length).toBeGreaterThan(0)
  })

  it('shows empty state when no scans', () => {
    const wrapper = mountWithStubs(HistoryList, { props: { scans: [], loading: false, selectedId: null } })
    expect(wrapper.text()).toContain('No Scan History')
  })

  it('renders history cards for each scan', () => {
    const wrapper = mountWithStubs(HistoryList, {
      props: { scans: [mockScan, { ...mockScan, id: '2', operator: 'Indosat' }], loading: false, selectedId: null }
    })
    expect(wrapper.findAll('[data-testid="history-card"]').length).toBe(2)
  })
})

describe('FilterPanel', () => {
  it('renders all RAT options', () => {
    const wrapper = mountWithStubs(FilterPanel, { props: { selectedRat: 'ALL', operatorFilter: '' } })
    expect(wrapper.findAll('[data-testid="u-button"]').length).toBe(4)
  })

  it('emits reset when reset button clicked', async () => {
    // The reset button has been removed from FilterPanel. Users now reset
    // by selecting the 'All' RAT pill directly. Verify 'All' is always
    // present and clickable, instead of asserting a separate reset button.
    const wrapper = mountWithStubs(FilterPanel, { props: { selectedRat: 'LTE', operatorFilter: 'test' } })
    const allBtn = wrapper.findAll('[data-testid="u-button"]').find(b => b.text() === 'All')
    expect(allBtn).toBeTruthy()
    await allBtn!.trigger('click')
    expect(wrapper.emitted('update:selectedRat')?.[0]).toEqual(['ALL'])
  })
})

describe('SearchBox', () => {
  it('renders with placeholder', () => {
    const wrapper = mountWithStubs(SearchBox, { props: { placeholder: 'Search scans...', modelValue: '' } })
    const input = wrapper.find('[data-testid="u-input"]')
    expect(input.attributes('placeholder')).toBe('Search scans...')
  })

  it('shows clear button when text is entered', () => {
    const wrapper = mountWithStubs(SearchBox, { props: { modelValue: 'test' } })
    expect(wrapper.findAll('[data-testid="u-button"]').length).toBe(1)
  })

  it('clears text on clear button click', async () => {
    const wrapper = mountWithStubs(SearchBox, { props: { modelValue: 'test' } })
    const clearBtn = wrapper.find('[data-testid="u-button"]')
    await clearBtn.trigger('click')
    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(emitted![emitted!.length - 1]).toEqual([''])
  })

  it('does not show clear button when empty', () => {
    const wrapper = mountWithStubs(SearchBox, { props: { modelValue: '' } })
    expect(wrapper.findAll('[data-testid="u-button"]').length).toBe(0)
  })
})
