import type { Map as LeafletMap, Marker } from 'leaflet'
import type { InjectionKey } from 'vue'
import type { ScanSummary } from '~/types'
import { formatDateTime, formatRelativeTime } from '~/utils/dateFormat'

/**
 * Format a value for display in the marker popup. Returns a non-breaking
 * hyphen ('-') when the value is null, undefined, or an empty string so the
 * popup never renders the literal string "undefined" or "null".
 */
function fmt(value: unknown): string {
  if (value === null || value === undefined || value === '') return '\u2011' // non-breaking hyphen
  return String(value)
}

/**
 * Map a radio technology (RAT) to a concrete hex colour that matches the
 * palette used by the sidebar `UBadge` colours. The SVG inside the marker
 * uses `stroke="currentColor"` so the colour is applied by setting the
 * `color` CSS property on the marker wrapper.
 */
function getRatColorHex(rat: string | null | undefined): string {
  if (!rat) return '#6b7280' // slate-500 (neutral)
  const normalized = rat.trim().toUpperCase()
  switch (normalized) {
    case 'GSM':
    case 'GPRS':
    case 'EDGE':
      return '#16a34a' // success – green-500 (2G)
    case 'UMTS':
    case 'HSPA':
      return '#f59e0b' // warning – amber-500 (3G)
    case 'LTE':
      return '#2563eb' // info – blue-500 (4G)
    case 'NR':
      return '#9333ea' // primary – purple-500 (5G)
    default:
      return '#6b7280' // slate-500 (neutral)
  }
}

/**
 * Build the HTML markup for a RAT tag inside the marker popup. The tag
 * mirrors the styling of the `UBadge` used in the sidebar: small, rounded,
 * coloured background, white text. When the RAT value is missing the badge
 * shows "N/A" using a neutral background.
 */
function getRatBadgeHtml(rat: string | null | undefined): string {
  const value = fmt(rat)
  if (value === '\u2011') {
    return `<span class="signal-popup-rat-badge signal-popup-rat-badge--neutral">N/A</span>`
  }
  const color = getRatColorHex(rat)
  return `<span class="signal-popup-rat-badge" style="background-color:${color}">${value}</span>`
}

export interface MapActions {
  initMap: (containerId: string, center: [number, number], zoom: number) => void
  addMarker: (scan: ScanSummary, onClick?: (scan: ScanSummary) => void) => Marker | null
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
  // Highlight an existing marker with a pulsing animation when active
  setMarkerActive(id: string, active: boolean): void
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

function addMarker(
  scan: ScanSummary,
  onClick?: (scan: ScanSummary) => void
): Marker | null {
    if (!map) return null

    const L = useLeaflet()

    // Determine the colour for the marker based on RAT technology.
    const markerColor = getRatColorHex(scan.rat)

    // Custom divIcon using the Lucide "radio-tower" SVG path data
    // (identical to the navbar app-logo icon "lucide:radio-tower"). The
    // badge gets its colour from the inline style we set; the SVG is forced
    // to white so the tower icon stays legible on the coloured badge.
    const signalIcon = L.divIcon({
      className: 'leaflet-signal-marker',
      html: `
        <div class="signal-marker-badge" style="
          background-color: ${markerColor};
          color: #ffffff;
          --glow-color: ${markerColor};
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M4.9 16.1C1 12.2 1 5.8 4.9 1.9m2.9 2.8a6.14 6.14 0 0 0 -.8 7.5"></path>
            <circle cx="12" cy="9" r="2"></circle>
            <path d="M16.2 4.8c2 2 2.26 5.11.8 7.47M19.1 1.9a9.96 9.96 0 0 1 0 14.1m-9.6 2h5 M8 22l4-11l4 11"></path>
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
        <button type="button" class="signal-popup-close-btn" aria-label="Close">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div class="signal-popup-header">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M4.9 16.1C1 12.2 1 5.8 4.9 1.9m2.9 2.8a6.14 6.14 0 0 0 -.8 7.5"></path>
            <circle cx="12" cy="9" r="2"></circle>
            <path d="M16.2 4.8c2 2 2.26 5.11.8 7.47M19.1 1.9a9.96 9.96 0 0 1 0 14.1m-9.6 2h5 M8 22l4-11l4 11"></path>
          </svg>
          <strong>${fmt(scan.operator) === '\u2011' ? 'Unknown' : fmt(scan.operator)}</strong>
        </div>
        <div class="signal-popup-row"><span>MCC</span><span>${fmt(scan.mcc)}</span></div>
        <div class="signal-popup-row"><span>MNC</span><span>${fmt(scan.mnc)}</span></div>
        <div class="signal-popup-row"><span>RAT</span>${getRatBadgeHtml(scan.rat)}</div>
        <div class="signal-popup-row signal-popup-time">
          <span>Time</span>
          <span class="signal-popup-time-block">
            <span class="signal-popup-time-absolute">${fmt(formattedDate)}</span>
            <span class="signal-popup-time-relative" data-iso="${scan.scan_time}">${fmt(relativeDate)}</span>
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
      // Wire the custom close button: clicking the X should dismiss the
      // popup without touching the selected scan (the marker keeps its
      // pulsing state and remains selected in the sidebar).
      .on('popupopen', (e) => {
        // 'e.popup' is the Leaflet popup instance; fetch its DOM node to
        // attach the click handler to the custom close button.
        const popupEl = e?.popup?.getElement?.()
        const btn = popupEl?.querySelector('.signal-popup-close-btn')
        if (btn) {
          btn.addEventListener('click', (ev) => {
            ev.stopPropagation()
            ev.preventDefault()
            marker.closePopup()
          })
        } else {
          // Fallback: if button not found immediately, retry after DOM settles.
          setTimeout(() => {
            const el = popupEl?.querySelector('.signal-popup-close-btn')
            if (el) {
              el.addEventListener('click', (ev) => {
                ev.stopPropagation()
                ev.preventDefault()
                marker.closePopup()
              })
            }
          }, 0)
        }
      })

    // Optionally bind a click event to emit to the parent.
    if (onClick) {
      marker.on('click', () => onClick(scan))
    }

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

  /**
   * Toggle a pulsing animation on the badge of a marker. The class is
   * added/removed on the `.signal-marker-badge` element which holds the
   * inline-styled coloured circle. The CSS pulse keyframes are defined
   * in `app/assets/css/main.css`. Used by `MapView` to highlight the
   * currently selected scan.
   */
  function setMarkerActive(id: string, active: boolean) {
    const marker = markers.get(id)
    if (!marker) return
    const el = marker.getElement()
    if (!el) return
    const badge = el.querySelector('.signal-marker-badge')
    if (badge) {
      badge.classList.toggle('pulse', active)
    }
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
    getMap: () => map,
    setMarkerActive
  }
}

function useLeaflet() {
  return (window as unknown as Record<string, unknown>).L as typeof import('leaflet')
}
