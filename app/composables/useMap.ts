import type { Map as LeafletMap, Marker } from 'leaflet'
import type { InjectionKey } from 'vue'
import type { ScanSummary } from '~/types'
import { formatDateTime, formatRelativeTime } from '~/utils/dateFormat'

export interface MapActions {
  initMap: (containerId: string, center: [number, number], zoom: number) => void
  addMarker: (scan: ScanSummary) => Marker | null
  removeMarker: (id: string) => void
  clearMarkers: () => void
  flyTo: (lat: number, lon: number, zoom?: number) => void
  setView: (center: [number, number], zoom?: number) => void
  setDarkMode: (enabled: boolean) => void
  invalidateSize: () => void
  openPopupFor: (id: string) => void
  closeAllPopups: () => void
  destroy: () => void
  getMap: () => LeafletMap | null
}

// Tile themes. Dark uses CartoDB base + label overlay so street names, roads,
// POIs remain legible. Light uses standard OpenStreetMap tiles.
const TILE_DARK_BASE = {
  url: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
  subdomains: 'abcd'
}
const TILE_DARK_LABELS = {
  url: 'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png',
  subdomains: 'abcd'
}
const TILE_LIGHT = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  subdomains: 'abc',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}
const ATTRIBUTION_DARK =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
const ATTRIBUTION_LIGHT =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

export const MapKey: InjectionKey<MapActions> = Symbol('map-actions')

export function useMap(): MapActions {
  let map: LeafletMap | null = null
  // Up to two stacked tile layers at once (dark base + dark labels)
  let baseTileLayer: ReturnType<typeof useLeaflet>['tileLayer'] | null = null
  let labelTileLayer: ReturnType<typeof useLeaflet>['tileLayer'] | null = null
  let darkMode = true
  const markers: Map<string, Marker> = new Map()

  function addBaseTile(url: string, subdomains: string, attribution: string) {
    const L = useLeaflet()
    return L.tileLayer(url, {
      attribution,
      subdomains,
      maxZoom: 19
    }).addTo(map!)
  }

  function clearTileLayers() {
    if (baseTileLayer) {
      baseTileLayer.remove()
      baseTileLayer = null
    }
    if (labelTileLayer) {
      labelTileLayer.remove()
      labelTileLayer = null
    }
  }

  function initMap(containerId: string, center: [number, number], zoom: number) {
    if (map) return

    const L = useLeaflet()

    map = L.map(containerId, {
      center,
      zoom,
      zoomControl: false
    })

    // Place zoom controls in the top-right corner
    L.control.zoom({ position: 'topright' }).addTo(map)

    // Default to dark tiles on init (base + labels)
    baseTileLayer = addBaseTile(TILE_DARK_BASE.url, TILE_DARK_BASE.subdomains, ATTRIBUTION_DARK)
    labelTileLayer = addBaseTile(TILE_DARK_LABELS.url, TILE_DARK_LABELS.subdomains, '')
  }

  function setDarkMode(enabled: boolean) {
    if (!map) return
    if (darkMode === enabled) return
    darkMode = enabled
    clearTileLayers()
    if (enabled) {
      baseTileLayer = addBaseTile(TILE_DARK_BASE.url, TILE_DARK_BASE.subdomains, ATTRIBUTION_DARK)
      labelTileLayer = addBaseTile(TILE_DARK_LABELS.url, TILE_DARK_LABELS.subdomains, '')
    } else {
      baseTileLayer = addBaseTile(TILE_LIGHT.url, TILE_LIGHT.subdomains, ATTRIBUTION_LIGHT)
    }
  }

  function addMarker(scan: ScanSummary): Marker | null {
    if (!map) return null

    const L = useLeaflet()

    // Custom divIcon using the Lucide "radio-tower" SVG path data
    // (identical to the navbar app-logo icon "lucide:radio-tower"). The
    // badge has a primary-coloured gradient so the marker is visible on
    // both dark and light tiles.
    const signalIcon = L.divIcon({
      className: 'leaflet-signal-marker',
      html: `
        <div class="signal-marker-badge">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M4.9 16.1C1 12.2 1 5.8 4.9 1.9m2.9 2.8a6.14 6.14 0 0 0-.8 7.5"></path>
            <circle cx="12" cy="9" r="2"></circle>
            <path d="M16.2 4.8c2 2 2.26 5.11.8 7.47M19.1 1.9a9.96 9.96 0 0 1 0 14.1m-9.6 2h5M8 22l4-11l4 11"></path>
          </svg>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
      popupAnchor: [0, -18]
    })

    const formattedDate = formatDateTime(scan.scan_time)
    const relativeDate = formatRelativeTime(scan.scan_time)

    const popupHtml = `
      <div class="signal-popup">
        <div class="signal-popup-header">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M4.9 16.1C1 12.2 1 5.8 4.9 1.9m2.9 2.8a6.14 6.14 0 0 0-.8 7.5"></path>
            <circle cx="12" cy="9" r="2"></circle>
            <path d="M16.2 4.8c2 2 2.26 5.11.8 7.47M19.1 1.9a9.96 9.96 0 0 1 0 14.1m-9.6 2h5M8 22l4-11l4 11"></path>
          </svg>
          <strong>${scan.operator || 'Unknown'}</strong>
        </div>
        <div class="signal-popup-row"><span>MCC</span><span>${scan.mcc}</span></div>
        <div class="signal-popup-row"><span>MNC</span><span>${scan.mnc}</span></div>
        <div class="signal-popup-row"><span>RAT</span><span>${scan.rat}</span></div>
        <div class="signal-popup-row signal-popup-time">
          <span>Time</span>
          <span class="signal-popup-time-block">
            <span class="signal-popup-time-absolute">${formattedDate}</span>
            <span class="signal-popup-time-relative" data-iso="${scan.scan_time}">${relativeDate}</span>
          </span>
        </div>
      </div>
    `

    const marker = L.marker([scan.latitude, scan.longitude], { icon: signalIcon })
      .addTo(map)
      .bindPopup(popupHtml, {
        closeButton: false,
        autoClose: false,
        closeOnClick: false,
        className: 'leaflet-signal-popup'
      })

    // Popups are no longer auto-opened here. The selected marker is
    // controlled centrally by `openPopupFor(id)` so clicking an item in
    // the sidebar (or marker on the map) updates exactly one popup.

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

  /**
   * Open the popup for the given scan id and close all other popups.
   * No-op if the map is not initialised or the marker is not present.
   */
  function openPopupFor(id: string) {
    if (!map) return
    markers.forEach((m, key) => {
      if (key === id) {
        m.openPopup()
      } else if (m.isPopupOpen()) {
        m.closePopup()
      }
    })
  }

  /**
   * Close every open popup (e.g. when the selection is cleared).
   */
  function closeAllPopups() {
    if (!map) return
    markers.forEach((m) => {
      if (m.isPopupOpen()) m.closePopup()
    })
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
    setDarkMode,
    invalidateSize,
    openPopupFor,
    closeAllPopups,
    destroy,
    getMap: () => map
  }
}

function useLeaflet() {
  return (window as unknown as Record<string, unknown>).L as typeof import('leaflet')
}
