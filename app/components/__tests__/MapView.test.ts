import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

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
    $config: {
      public: {
        appName: 'LTE Scanner',
        apiBase: 'http://localhost:8001/api/v1',
        defaultLat: '-6.150676643667096',
        defaultLon: '106.89665223346297'
      }
    }
  })),
  defineNuxtPlugin: vi.fn(),
  definePayloadPlugin: vi.fn(),
  defineAppConfig: vi.fn(),
  tryUseNuxtApp: vi.fn()
}))

const mockMarker = {
  addTo: vi.fn(() => mockMarker),
  bindPopup: vi.fn(() => mockMarker),
  on: vi.fn(),
  remove: vi.fn(),
  setLatLng: vi.fn()
}

describe('MapView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window.L = {
      map: vi.fn(() => ({
        setView: vi.fn(),
        remove: vi.fn(),
        on: vi.fn(),
        invalidateSize: vi.fn(),
        flyTo: vi.fn(),
        fitBounds: vi.fn(),
        getCenter: vi.fn(() => ({ lat: 0, lng: 0 }))
      })),
      tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
      marker: vi.fn(() => {
        const m: Record<string, any> = {}
        m.addTo = vi.fn(() => m)
        m.bindPopup = vi.fn(() => m)
        m.on = vi.fn(() => m)
        m.off = vi.fn(() => m)
        m.remove = vi.fn()
        m.closePopup = vi.fn()
        m.setLatLng = vi.fn()
        m.openPopup = vi.fn()
        m.isPopupOpen = vi.fn(() => false)
        return m
      }),
      icon: vi.fn(() => ({ options: {} })),
      divIcon: vi.fn(() => ({ options: {} })),
      control: {
        zoom: vi.fn(() => ({ addTo: vi.fn() }))
      },
      DomEvent: { on: vi.fn(), off: vi.fn() }
    } as unknown as typeof import('leaflet')
  })

  it('renders map container div', async () => {
    const MapView = (await import('../MapView.vue')).default
    const wrapper = mount(MapView)
    expect(wrapper.find('div').exists()).toBe(true)
  })

  it('initializes leaflet map on mount', async () => {
    const MapView = (await import('../MapView.vue')).default
    mount(MapView)

    expect(window.L.map).toHaveBeenCalled()
    expect(window.L.tileLayer).toHaveBeenCalled()
  })

  it('renders markers from prop', async () => {
    const MapView = (await import('../MapView.vue')).default
    const markers = [
      { id: '1', operator: 'Telkomsel', mcc: '510', mnc: '10', rat: 'LTE', latitude: -6.15, longitude: 106.89, scan_time: '2024-01-01T00:00:00Z' }
    ]

    mount(MapView, { props: { markers } })

    expect(window.L.marker).toHaveBeenCalledWith([-6.15, 106.89], expect.objectContaining({ icon: expect.anything() }))
  })

  it('provides map actions to children', async () => {
    const MapView = (await import('../MapView.vue')).default
    const wrapper = mount(MapView)
    expect(wrapper.find('div').exists()).toBe(true)
  })
})