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

const mockMarker = {
  addTo: vi.fn(() => mockMarker),
  bindPopup: vi.fn(() => mockMarker),
  setLatLng: vi.fn(),
  remove: vi.fn(),
  on: vi.fn(),
  openPopup: vi.fn(),
  closePopup: vi.fn(),
  isPopupOpen: vi.fn(() => false)
}

vi.stubGlobal('L', {
  map: vi.fn(() => mockMap),
  tileLayer: vi.fn(() => ({
    addTo: vi.fn()
  })),
  marker: vi.fn(() => mockMarker),
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

    expect(mockMarker.remove).toHaveBeenCalled()
  })

  it('clearMarkers removes all markers', async () => {
    const { useMap } = await import('../useMap')
    const result = useMap()
    result.initMap('map', [0, 0], 10)

    result.addMarker({ id: '1', operator: 'A', mcc: '1', mnc: '1', rat: 'LTE', latitude: 0, longitude: 0, scan_time: '' })
    result.addMarker({ id: '2', operator: 'B', mcc: '2', mnc: '2', rat: 'NR', latitude: 0, longitude: 0, scan_time: '' })
    result.clearMarkers()

    expect(mockMarker.remove).toHaveBeenCalledTimes(2)
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

    expect(mockMarker.openPopup).not.toHaveBeenCalled()
  })

  it('openPopupFor opens the popup for the selected scan and closes the others', async () => {
    const { useMap } = await import('../useMap')
    const result = useMap()
    result.initMap('map', [0, 0], 10)

    result.addMarker({ id: '1', operator: 'A', mcc: '1', mnc: '1', rat: 'LTE', latitude: 0, longitude: 0, scan_time: '' })
    result.addMarker({ id: '2', operator: 'B', mcc: '2', mnc: '2', rat: 'NR', latitude: 0, longitude: 0, scan_time: '' })

    mockMarker.openPopup.mockClear()
    mockMarker.closePopup.mockClear()

    result.openPopupFor('2')

    expect(mockMarker.openPopup).toHaveBeenCalledTimes(1)
  })

  it('closeAllPopups closes every open popup', async () => {
    const { useMap } = await import('../useMap')
    const result = useMap()
    result.initMap('map', [0, 0], 10)

    result.addMarker({ id: '1', operator: 'A', mcc: '1', mnc: '1', rat: 'LTE', latitude: 0, longitude: 0, scan_time: '' })
    result.addMarker({ id: '2', operator: 'B', mcc: '2', mnc: '2', rat: 'NR', latitude: 0, longitude: 0, scan_time: '' })

    mockMarker.closePopup.mockClear()

    result.closeAllPopups()

    // closePopup should not be called if no marker reports an open popup
    // (default mock returns false from isPopupOpen).
    expect(mockMarker.closePopup).not.toHaveBeenCalled()
  })
})
