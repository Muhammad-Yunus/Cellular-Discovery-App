import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { MapKey } from '../../composables/useMap'

const mockMarker = {
  addTo: vi.fn(() => mockMarker),
  bindPopup: vi.fn(() => mockMarker),
  on: vi.fn(),
  remove: vi.fn(),
  setLatLng: vi.fn()
}

const mockMapActions = {
  initMap: vi.fn(),
  addMarker: vi.fn(() => mockMarker),
  removeMarker: vi.fn(),
  clearMarkers: vi.fn(),
  flyTo: vi.fn(),
  setView: vi.fn(),
  invalidateSize: vi.fn(),
  destroy: vi.fn(),
  getMap: vi.fn(() => null)
}

describe('MapMarker', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('registers marker on mount when provided with map actions', async () => {
    const MapMarker = (await import('../MapMarker.vue')).default
    const scan = { id: '1', operator: 'Telkomsel', mcc: '510', mnc: '10', rat: 'LTE', latitude: -6.15, longitude: 106.89, scan_time: '2024-01-01T00:00:00Z' }

    mount(MapMarker, {
      props: { scan },
      global: {
        provide: {
          [MapKey]: mockMapActions
        }
      }
    })

    expect(mockMapActions.addMarker).toHaveBeenCalledWith(scan)
  })

  it('removes marker on unmount', async () => {
    const MapMarker = (await import('../MapMarker.vue')).default
    const scan = { id: '1', operator: 'T', mcc: '1', mnc: '1', rat: 'LTE', latitude: 0, longitude: 0, scan_time: '' }

    const wrapper = mount(MapMarker, {
      props: { scan },
      global: {
        provide: {
          [MapKey]: mockMapActions
        }
      }
    })

    wrapper.unmount()

    expect(mockMapActions.removeMarker).toHaveBeenCalledWith('1')
  })

  it('works without map actions (no-op)', async () => {
    const MapMarker = (await import('../MapMarker.vue')).default
    const scan = { id: '1', operator: 'T', mcc: '1', mnc: '1', rat: 'LTE', latitude: 0, longitude: 0, scan_time: '' }

    const wrapper = mount(MapMarker, {
      props: { scan }
    })

    expect(wrapper.exists()).toBe(true)
  })
})
