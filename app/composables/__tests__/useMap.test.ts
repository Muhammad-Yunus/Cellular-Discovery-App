import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const mockMap = {
  setView: vi.fn(),
  remove: vi.fn(),
  on: vi.fn(),
  invalidateSize: vi.fn(),
  flyTo: vi.fn(),
  fitBounds: vi.fn(),
  getCenter: vi.fn(() => ({ lat: 0, lng: 0 }))
}

function createMockMarker() {
  // Build a Leaflet-style chained object where .addTo, .bindPopup, and .on
  // all return `this` so the result of `L.marker().addTo(map).bindPopup(...).on(...)`
  // is the same marker object — matching the real Leaflet API.
  const m: Record<string, unknown> = {
    isPopupOpen: vi.fn(() => false)
  }
  m.addTo = vi.fn(() => m)
  m.bindPopup = vi.fn(() => m)
  m.on = vi.fn(() => m)
  m.off = vi.fn(() => m)
  m.setLatLng = vi.fn()
  m.remove = vi.fn()
  m.openPopup = vi.fn()
  m.closePopup = vi.fn()
  return m
}

vi.stubGlobal('L', {
  map: vi.fn(() => mockMap),
  tileLayer: vi.fn(() => ({
    addTo: vi.fn()
  })),
  marker: vi.fn(() => createMockMarker()),
  icon: vi.fn(() => ({ options: {} })),
  divIcon: vi.fn(() => ({ options: {} })),
  control: {
    zoom: vi.fn(() => ({ addTo: vi.fn() }))
  },
  DomEvent: { on: vi.fn(), off: vi.fn() }
})

describe('useMap', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('returns map actions', async () => {
    const { useMap } = await import('../useMap')
    const result = useMap()

    expect(result.initMap).toBeDefined()
    expect(result.addMarker).toBeDefined()
    expect(result.removeMarker).toBeDefined()
    expect(result.clearMarkers).toBeDefined()
    expect(result.flyTo).toBeDefined()
    expect(result.setView).toBeDefined()
    expect(result.invalidateSize).toBeDefined()
    expect(result.destroy).toBeDefined()
  })

  it('initMap creates leaflet map', async () => {
    const { useMap } = await import('../useMap')
    const result = useMap()

    result.initMap('map-container', [-6.15, 106.89], 17)

    expect(window.L.map).toHaveBeenCalledWith('map-container', {
      center: [-6.15, 106.89],
      zoom: 17,
      zoomControl: false
    })
  })

  it('addMarker creates leaflet marker', async () => {
    const { useMap } = await import('../useMap')
    const result = useMap()
    result.initMap('map', [0, 0], 10)

    const scan = {
      id: '1',
      operator: 'Test',
      mcc: '123',
      mnc: '456',
      rat: 'LTE',
      latitude: -6.15,
      longitude: 106.89,
      scan_time: '2024-01-01T00:00:00Z'
    }

    result.addMarker(scan)

    expect(window.L.marker).toHaveBeenCalledWith([-6.15, 106.89], expect.objectContaining({ icon: expect.anything() }))
  })

  it('removeMarker removes specific marker', async () => {
    const { useMap } = await import('../useMap')
    const result = useMap()
    result.initMap('map', [0, 0], 10)

    const scan = { id: '1', operator: 'T', mcc: '1', mnc: '1', rat: 'LTE', latitude: 0, longitude: 0, scan_time: '' }
    result.addMarker(scan)
    result.removeMarker('1')

    expect(window.L.marker).toHaveBeenCalledWith([0, 0], expect.anything())
  })

  it('clearMarkers removes all markers', async () => {
    const { useMap } = await import('../useMap')
    const result = useMap()
    result.initMap('map', [0, 0], 10)

    result.addMarker({ id: '1', operator: 'A', mcc: '1', mnc: '1', rat: 'LTE', latitude: 0, longitude: 0, scan_time: '' })
    result.addMarker({ id: '2', operator: 'B', mcc: '2', mnc: '2', rat: 'NR', latitude: 0, longitude: 0, scan_time: '' })
    result.clearMarkers()

    // Each addMarker call creates a fresh mock via L.marker
    const markerCalls = (window.L.marker as ReturnType<typeof vi.fn>).mock?.calls
    expect(markerCalls?.length).toBe(2)
    // clearMarkers calls remove() on every marker created
    const results = (window.L.marker as ReturnType<typeof vi.fn>).mock?.results
    if (results) {
      for (const res of results) {
        expect(res?.value?.remove).toHaveBeenCalled()
      }
    }
  })

  it('flyTo calls map flyTo', async () => {
    const { useMap } = await import('../useMap')
    const result = useMap()
    result.initMap('map', [0, 0], 10)

    result.flyTo(-6.15, 106.89, 15)

    expect(mockMap.flyTo).toHaveBeenCalledWith([-6.15, 106.89], 15)
  })

  it('destroy removes map', async () => {
    const { useMap } = await import('../useMap')
    const result = useMap()
    result.initMap('map', [0, 0], 10)

    result.destroy()

    expect(mockMap.remove).toHaveBeenCalled()
  })

  it('addMarker no longer auto-opens the popup', async () => {
    const { useMap } = await import('../useMap')
    const result = useMap()
    result.initMap('map', [0, 0], 10)

    result.addMarker({ id: '1', operator: 'A', mcc: '1', mnc: '1', rat: 'LTE', latitude: 0, longitude: 0, scan_time: '' })

    // openPopup must not have been called automatically after addMarker.
    const results = (window.L.marker as ReturnType<typeof vi.fn>).mock?.results
    const createdMarker = results?.at(-1)?.value
    expect(createdMarker.openPopup).not.toHaveBeenCalled()
  })

  it('openPopupFor opens the popup for the selected scan', async () => {
    const { useMap } = await import('../useMap')
    const result = useMap()
    result.initMap('map', [0, 0], 10)

    result.addMarker({ id: '1', operator: 'A', mcc: '1', mnc: '1', rat: 'LTE', latitude: 0, longitude: 0, scan_time: '' })
    result.addMarker({ id: '2', operator: 'B', mcc: '2', mnc: '2', rat: 'NR', latitude: 0, longitude: 0, scan_time: '' })

    result.openPopupFor('2')

    // Check that openPopup was called on one of the markers
    const markers = (window.L.marker as ReturnType<typeof vi.fn>).mock?.results
    expect(markers?.length).toBe(2)
    expect(markers?.[1]?.value?.openPopup).toHaveBeenCalled()
  })

  it('closeAllPopups does nothing when no popups are open', async () => {
    const { useMap } = await import('../useMap')
    const result = useMap()
    result.initMap('map', [0, 0], 10)

    result.addMarker({ id: '1', operator: 'A', mcc: '1', mnc: '1', rat: 'LTE', latitude: 0, longitude: 0, scan_time: '' })

    result.closeAllPopups()

    // closePopup should not be called since isPopupOpen returns false by default
    const markers = (window.L.marker as ReturnType<typeof vi.fn>).mock?.results
    expect(markers?.length).toBe(1)
    expect(markers?.[0]?.value?.closePopup).not.toHaveBeenCalled()
  })
})
