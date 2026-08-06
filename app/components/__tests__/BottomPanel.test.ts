import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'

// Static imports: vi.mock() above is hoisted so the resolved component
// already has mocks applied. This avoids re-transform inside each it() block.
import BottomPanel from '../BottomPanel.vue'
import SignalPanel from '../SignalPanel.vue'
import GPSPanel from '../GPSPanel.vue'
import SystemPanel from '../SystemPanel.vue'

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

const mockScanStore = {
  selectedScan: null as Record<string, unknown> | null,
  scans: [],
  selectedScanId: null as string | null,
  loading: false,
  creating: false,
  error: null as string | null,
  pagination: { currentPage: 1, limit: 20, totalItems: 0, offset: 0, totalPages: 0, searchTerm: '' },
  fetchScans: vi.fn(),
  createScan: vi.fn(),
  selectScan: vi.fn(),
  deleteScan: vi.fn(),
  setPage: vi.fn(),
  setSearch: vi.fn()
}

const mockGpsStore = {
  latitude: -6.150676643667096,
  longitude: 106.89665223346297,
  provider: null as string | null,
  connected: false,
  updatePosition: vi.fn(),
  setProvider: vi.fn(),
  setConnected: vi.fn()
}

const mockSystemStore = {
  backendStatus: 'unavailable',
  cliStatus: 'unknown',
  responseTime: null as number | null,
  lastCheck: null as string | null,
  error: null as string | null,
  setHealth: vi.fn(),
  setCLIStatus: vi.fn(),
  setError: vi.fn()
}

const mockUiStore = {
  sidebarOpen: true,
  bottomPanelOpen: true,
  activeInfoTab: 'signal',
  toggleSidebar: vi.fn(),
  toggleBottomPanel: vi.fn(),
  setActiveTab: vi.fn()
}

vi.mock('~/stores/scanStore', () => ({
  useScanStore: vi.fn(() => mockScanStore)
}))

vi.mock('~/stores/gpsStore', () => ({
  useGpsStore: vi.fn(() => mockGpsStore)
}))

vi.mock('~/stores/systemStore', () => ({
  useSystemStore: vi.fn(() => mockSystemStore)
}))

vi.mock('~/stores/uiStore', () => ({
  useUiStore: vi.fn(() => mockUiStore)
}))

const stubs = {
  SignalPanel: { template: '<div data-testid="signal-panel" />' },
  GPSPanel: { template: '<div data-testid="gps-panel" />' },
  SystemPanel: { template: '<div data-testid="system-panel" />' },
  UBadge: { template: '<span data-testid="u-badge"><slot /><span v-if="$props.label">{{ $props.label }}</span></span>', props: ['color', 'variant', 'size', 'label'] },
  UButton: { template: '<button data-testid="u-button" :title="$props.title" @click="$emit(\'click\', $event)"><slot />{{ $props.label }}</button>', props: ['label', 'color', 'variant', 'size', 'icon', 'title'] },
  UIcon: { template: '<span data-testid="u-icon" />', props: ['name'] }
}

function mountWithStubs(component: object, options: Record<string, unknown> = {}) {
  return mount(component, {
    global: { stubs },
    ...options
  })
}

describe('BottomPanel', () => {
  beforeEach(() => {
    mockUiStore.bottomPanelOpen = true
    mockUiStore.activeInfoTab = 'signal'
    mockUiStore.toggleBottomPanel = vi.fn()
  })

  it('renders when bottomPanelOpen is true', () => {
    const wrapper = mountWithStubs(BottomPanel)
    expect(wrapper.find('[role="tablist"]').exists()).toBe(true)
    expect(wrapper.findAll('[role="tab"]').length).toBe(3)
  }, 30000)

  it('does not render when bottomPanelOpen is false', () => {
    mockUiStore.bottomPanelOpen = false
    const wrapper = mountWithStubs(BottomPanel)
    expect(wrapper.find('[role="tablist"]').exists()).toBe(false)
  })

  it('renders only the active tab panel', () => {
    mockUiStore.activeInfoTab = 'signal'
    const wrapper = mountWithStubs(BottomPanel)
    expect(wrapper.find('[data-testid="signal-panel"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="gps-panel"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="system-panel"]').exists()).toBe(false)
  })

  it('switches the active panel when the active tab changes', () => {
    mockUiStore.activeInfoTab = 'gps'
    const wrapper = mountWithStubs(BottomPanel)
    expect(wrapper.find('[data-testid="gps-panel"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="signal-panel"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="system-panel"]').exists()).toBe(false)
  })

  it('marks the active tab button with aria-selected', () => {
    mockUiStore.activeInfoTab = 'system'
    const wrapper = mountWithStubs(BottomPanel)
    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs[0]?.attributes('aria-selected')).toBe('false')
    expect(tabs[1]?.attributes('aria-selected')).toBe('false')
    expect(tabs[2]?.attributes('aria-selected')).toBe('true')
  })

  it('calls setActiveTab when a tab button is clicked', async () => {
    const wrapper = mountWithStubs(BottomPanel)
    const tabs = wrapper.findAll('[role="tab"]')
    await tabs[1]?.trigger('click')
    expect(mockUiStore.setActiveTab).toHaveBeenCalledWith('gps')
  })
})

describe('SignalPanel', () => {
  it('shows empty state when no scan selected', () => {
    mockScanStore.selectedScan = null
    const wrapper = mountWithStubs(SignalPanel)
    expect(wrapper.text()).toContain('No scan selected')
  })

  it('displays scan details when scan is selected', () => {
    mockScanStore.selectedScan = {
      id: '1',
      operator: 'Telkomsel',
      mcc: '510',
      mnc: '10',
      rat: 'LTE',
      latitude: -6.15,
      longitude: 106.89,
      scan_time: '2024-01-01T12:00:00Z'
    }
    const wrapper = mountWithStubs(SignalPanel)
    expect(wrapper.text()).toContain('Telkomsel')
    expect(wrapper.text()).toContain('510')
    expect(wrapper.text()).toContain('10')
    expect(wrapper.text()).toContain('LTE')
  })
})

describe('GPSPanel', () => {
  it('shows waiting state when no provider', () => {
    mockGpsStore.provider = null
    const wrapper = mountWithStubs(GPSPanel)
    expect(wrapper.text()).toContain('Waiting for GPS')
  })

  it('displays GPS data when provider is set', () => {
    mockGpsStore.provider = 'gps'
    mockGpsStore.latitude = -6.15
    mockGpsStore.longitude = 106.89
    mockGpsStore.connected = true
    const wrapper = mountWithStubs(GPSPanel)
    expect(wrapper.text()).toContain('-6.150000')
    expect(wrapper.text()).toContain('106.890000')
    expect(wrapper.text()).toContain('gps')
    expect(wrapper.text()).toContain('Connected')
  })

  it('shows disconnected status when not connected', () => {
    mockGpsStore.provider = 'mock'
    mockGpsStore.connected = false
    const wrapper = mountWithStubs(GPSPanel)
    expect(wrapper.text()).toContain('Disconnected')
  })
})

describe('SystemPanel', () => {
  it('displays backend status', () => {
    mockSystemStore.backendStatus = 'ok'
    mockSystemStore.responseTime = 42
    mockSystemStore.lastCheck = '2024-01-01T12:00:00Z'
    const wrapper = mountWithStubs(SystemPanel)
    expect(wrapper.text()).toContain('Online')
    expect(wrapper.text()).toContain('42ms')
  })

  it('displays unavailable status', () => {
    mockSystemStore.backendStatus = 'unavailable'
    const wrapper = mountWithStubs(SystemPanel)
    expect(wrapper.text()).toContain('Offline')
  })

  it('shows error when present', () => {
    mockSystemStore.error = 'Connection refused'
    const wrapper = mountWithStubs(SystemPanel)
    expect(wrapper.text()).toContain('Connection refused')
  })

  it('shows CLI status with UBadge', () => {
    mockSystemStore.cliStatus = 'warning'
    const wrapper = mountWithStubs(SystemPanel)
    const badges = wrapper.findAll('[data-testid="u-badge"]')
    expect(badges.length).toBeGreaterThan(0)
  })
})
