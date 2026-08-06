import { vi, beforeAll } from 'vitest'

beforeAll(() => {
  vi.stubGlobal('$fetch', vi.fn())
})

vi.mock('ofetch', () => ({
  $fetch: vi.fn()
}))

vi.mock('leaflet', () => ({
  default: {
    map: vi.fn(() => ({
      setView: vi.fn(),
      remove: vi.fn(),
      on: vi.fn(),
      invalidateSize: vi.fn(),
      flyTo: vi.fn(),
      fitBounds: vi.fn(),
      getCenter: vi.fn(() => ({ lat: 0, lng: 0 }))
    })),
    tileLayer: vi.fn(() => ({
      addTo: vi.fn()
    })),
    marker: vi.fn(() => ({
      addTo: vi.fn(),
      bindPopup: vi.fn(() => ({
        openPopup: vi.fn()
      })),
      setLatLng: vi.fn(),
      remove: vi.fn(),
      on: vi.fn()
    })),
    icon: vi.fn(() => ({
      options: {}
    })),
    DomEvent: {
      on: vi.fn(),
      off: vi.fn()
    }
  },
  map: vi.fn(),
  tileLayer: vi.fn(),
  marker: vi.fn(),
  icon: vi.fn(),
  DomEvent: {
    on: vi.fn(),
    off: vi.fn()
  }
}))

class MockWebSocket {
  onopen: (() => void) | null = null
  onmessage: ((event: { data: string }) => void) | null = null
  onclose: (() => void) | null = null
  onerror: (() => void) | null = null
  readyState: number = 0
  url: string = ''

  constructor(url: string) {
    this.url = url
  }

  send(_data: string) {}
  close() {
    this.readyState = 3
    this.onclose?.()
  }
}
vi.stubGlobal('WebSocket', MockWebSocket)

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal('ResizeObserver', MockResizeObserver)

class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)

vi.stubGlobal('useRuntimeConfig', () => ({
  public: {
    apiBase: 'http://localhost:8001/api/v1',
    appName: 'LTE Scanner',
    defaultLat: '-6.150676643667096',
    defaultLon: '106.89665223346297'
  }
}))

vi.stubGlobal('useScanStore', () => ({
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
}))

vi.stubGlobal('useGpsStore', () => ({
  latitude: -6.150676643667096,
  longitude: 106.89665223346297,
  provider: null,
  connected: false,
  updatePosition: vi.fn(),
  setProvider: vi.fn(),
  setConnected: vi.fn()
}))

vi.stubGlobal('useSettingsStore', () => ({
  settings: [],
  loading: false,
  saving: false,
  dirty: false,
  error: null,
  fetchSettings: vi.fn(),
  updateField: vi.fn(),
  saveSettings: vi.fn(),
  reset: vi.fn()
}))

vi.stubGlobal('useSystemStore', () => ({
  backendStatus: 'unavailable',
  cliStatus: 'unknown',
  responseTime: null,
  lastCheck: null,
  error: null,
  setHealth: vi.fn(),
  setCLIStatus: vi.fn(),
  setError: vi.fn()
}))

vi.stubGlobal('useUiStore', () => ({
  sidebarOpen: true,
  bottomPanelOpen: true,
  activeInfoTab: 'signal',
  toggleSidebar: vi.fn(),
  toggleBottomPanel: vi.fn(),
  setActiveTab: vi.fn()
}))

vi.stubGlobal('useMissionStore', () => ({
  wsConnected: false,
  wsStatus: 'disconnected',
  fetchMissions: vi.fn(),
  setWsConnected: vi.fn(),
  setWsStatus: vi.fn()
}))

vi.stubGlobal('useCustomToast', () => {
  const toasts = { value: [] as Array<{ id: number, title: string, description?: string, color: string, icon?: string, timeout?: number }> }
  let nextId = 1
  return {
    toasts,
    add: (props: { title: string, description?: string, color: string, icon?: string, timeout?: number }) => {
      toasts.value.push({ id: nextId++, ...props })
    },
    remove: (id: number) => {
      const idx = toasts.value.findIndex(t => t.id === id)
      if (idx >= 0) toasts.value.splice(idx, 1)
    },
    colorClass: (color: string) => {
      const map: Record<string, string> = {
        success: 'bg-green-600 text-white',
        error: 'bg-red-600 text-white',
        info: 'blue-600 text-white',
        warning: 'amber-600 text-white'
      }
      return map[color] || 'bg-gray-600 text-white'
    }
  }
})
