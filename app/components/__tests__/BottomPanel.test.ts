import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'

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

  it('renders when bottomPanelOpen is true', async () => {
    const BottomPanel = await import('../BottomPanel.vue')
    const wrapper = mountWithStubs(BottomPanel.default)
    expect(wrapper.find('[role="tablist"]').exists()).toBe(true)
    expect(wrapper.findAll('[role="tab"]').length).toBe(3)
  }, 30000)

  it('does not render when bottomPanelOpen is false', async () => {
    mockUiStore.bottomPanelOpen = false
    const BottomPanel = await import('../BottomPanel.vue')
    const wrapper = mountWithStubs(BottomPanel.default)
    expect(wrapper.find('[role="tablist"]').exists()).toBe(false)
  })

  it('renders only the active tab panel', async () => {
    mockUiStore.activeInfoTab = 'signal'
    const BottomPanel = await import('../BottomPanel.vue')
    const wrapper = mountWithStubs(BottomPanel.default)
    expect(wrapper.find('[data-testid="signal-panel"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="gps-panel"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="system-panel"]').exists()).toBe(false)
  })

  it('switches the active panel when the active tab changes', async () => {
    mockUiStore.activeInfoTab = 'gps'
    const BottomPanel = await import('../BottomPanel.vue')
    const wrapper = mountWithStubs(BottomPanel.default)
    expect(wrapper.find('[data-testid="gps-panel"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="signal-panel"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="system-panel"]').exists()).toBe(false)
  })

  it('marks the active tab button with aria-selected', async () => {
    mockUiStore.activeInfoTab = 'system'
    const BottomPanel = await import('../BottomPanel.vue')
    const wrapper = mountWithStubs(BottomPanel.default)
    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs[0].attributes('aria-selected')).toBe('false')
    expect(tabs[1].attributes('aria-selected')).toBe('false')
    expect(tabs[2].attributes('aria-selected')).toBe('true')
  })

  it('calls setActiveTab when a tab button is clicked', async () => {
    const BottomPanel = await import('../BottomPanel.vue')
    const wrapper = mountWithStubs(BottomPanel.default)
    const tabs = wrapper.findAll('[role="tab"]')
    await tabs[1].trigger('click')
    expect(mockUiStore.setActiveTab).toHaveBeenCalledWith('gps')
  })
})

describe('SignalPanel', () => {
  it('shows empty state when no scan selected', async () => {
    mockScanStore.selectedScan = null
    const SignalPanel = await import('../SignalPanel.vue')
    const wrapper = mountWithStubs(SignalPanel.default)
    expect(wrapper.text()).toContain('No scan selected')
  })

  it('displays scan details when scan is selected', async () => {
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
    const SignalPanel = await import('../SignalPanel.vue')
    const wrapper = mountWithStubs(SignalPanel.default)
    expect(wrapper.text()).toContain('Telkomsel')
    expect(wrapper.text()).toContain('510')
    expect(wrapper.text()).toContain('10')
    expect(wrapper.text()).toContain('LTE')
  })
})

describe('GPSPanel', () => {
  it('shows waiting state when no provider', async () => {
    mockGpsStore.provider = null
    const GPSPanel = await import('../GPSPanel.vue')
    const wrapper = mountWithStubs(GPSPanel.default)
    expect(wrapper.text()).toContain('Waiting for GPS')
  })

  it('displays GPS data when provider is set', async () => {
    mockGpsStore.provider = 'gps'
    mockGpsStore.latitude = -6.15
    mockGpsStore.longitude = 106.89
    mockGpsStore.connected = true
    const GPSPanel = await import('../GPSPanel.vue')
    const wrapper = mountWithStubs(GPSPanel.default)
    expect(wrapper.text()).toContain('-6.150000')
    expect(wrapper.text()).toContain('106.890000')
    expect(wrapper.text()).toContain('gps')
    expect(wrapper.text()).toContain('Connected')
  })

  it('shows disconnected status when not connected', async () => {
    mockGpsStore.provider = 'mock'
    mockGpsStore.connected = false
    const GPSPanel = await import('../GPSPanel.vue')
    const wrapper = mountWithStubs(GPSPanel.default)
    expect(wrapper.text()).toContain('Disconnected')
  })
})

describe('SystemPanel', () => {
  it('displays backend status', async () => {
    mockSystemStore.backendStatus = 'ok'
    mockSystemStore.responseTime = 42
    mockSystemStore.lastCheck = '2024-01-01T12:00:00Z'
    const SystemPanel = await import('../SystemPanel.vue')
    const wrapper = mountWithStubs(SystemPanel.default)
    expect(wrapper.text()).toContain('Online')
    expect(wrapper.text()).toContain('42ms')
  })

  it('displays unavailable status', async () => {
    mockSystemStore.backendStatus = 'unavailable'
    const SystemPanel = await import('../SystemPanel.vue')
    const wrapper = mountWithStubs(SystemPanel.default)
    expect(wrapper.text()).toContain('Offline')
  })

  it('shows error when present', async () => {
    mockSystemStore.error = 'Connection refused'
    const SystemPanel = await import('../SystemPanel.vue')
    const wrapper = mountWithStubs(SystemPanel.default)
    expect(wrapper.text()).toContain('Connection refused')
  })

  it('shows CLI status with UBadge', async () => {
    mockSystemStore.cliStatus = 'warning'
    const SystemPanel = await import('../SystemPanel.vue')
    const wrapper = mountWithStubs(SystemPanel.default)
    const badges = wrapper.findAll('[data-testid="u-badge"]')
    expect(badges.length).toBeGreaterThan(0)
  })
})
