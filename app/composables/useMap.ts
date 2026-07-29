import type { Map as LeafletMap, Marker } from 'leaflet'
import type { InjectionKey } from 'vue'
import type { ScanSummary } from '~/types'

export interface MapActions {
  initMap: (containerId: string, center: [number, number], zoom: number) => void
  addMarker: (scan: ScanSummary) => Marker | null
  removeMarker: (id: string) => void
  clearMarkers: () => void
  flyTo: (lat: number, lon: number, zoom?: number) => void
  setView: (center: [number, number], zoom?: number) => void
  invalidateSize: () => void
  destroy: () => void
  getMap: () => LeafletMap | null
}

export const MapKey: InjectionKey<MapActions> = Symbol('map-actions')

export function useMap(): MapActions {
  let map: LeafletMap | null = null
  const markers: Map<string, Marker> = new Map()

  function initMap(containerId: string, center: [number, number], zoom: number) {
    if (map) return

    const L = useLeaflet()

    map = L.map(containerId, {
      center,
      zoom,
      zoomControl: true
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map)
  }

  function addMarker(scan: ScanSummary): Marker | null {
    if (!map) return null

    const L = useLeaflet()
    const marker = L.marker([scan.latitude, scan.longitude])
      .addTo(map)
      .bindPopup(`
        <strong>${scan.operator || 'Unknown'}</strong><br>
        MCC: ${scan.mcc} | MNC: ${scan.mnc}<br>
        RAT: ${scan.rat}<br>
        ${scan.scan_time}
      `)

    markers.set(scan.id, marker)
    return marker
  }

  function removeMarker(id: string) {
    const marker = markers.get(id)
    if (marker) {
      marker.remove()
      markers.delete(id)
    }
  }

  function clearMarkers() {
    markers.forEach(marker => marker.remove())
    markers.clear()
  }

  function flyTo(lat: number, lon: number, zoom?: number) {
    map?.flyTo([lat, lon], zoom)
  }

  function setView(center: [number, number], zoom?: number) {
    map?.setView(center, zoom)
  }

  function invalidateSize() {
    setTimeout(() => map?.invalidateSize(), 100)
  }

  function destroy() {
    clearMarkers()
    map?.remove()
    map = null
  }

  return {
    initMap,
    addMarker,
    removeMarker,
    clearMarkers,
    flyTo,
    setView,
    invalidateSize,
    destroy,
    getMap: () => map
  }
}

function useLeaflet() {
  return (window as unknown as Record<string, unknown>).L as typeof import('leaflet')
}
