// app/components/RouteMap.vue
//
// Visualises the planned mission route as a polyline + numbered markers on a
// Leaflet map. Each marker opens a popup showing tower coordinate info
// (Tower ID, Tower Name, Latitude, Longitude).
//
// Data source: the dedicated `/missions/{id}/route` endpoint, exposed via
// `missionStore.route`. This endpoint returns the ORDERED itinerary with
// per-segment `distance_from_previous_meters` and
// `bearing_from_previous_degrees` values, which the polyline labels rely on.
//
// IMPORTANT: The Route tab uses `route` (route endpoint) so map + segment
// labels stay in sync after a reorder. The Locations tab continues to use
// `missionStore.locations` (the location listing endpoint) and is unaffected
// by this component.
//
// IMPORTANT: Leaflet takes over the inner map container — it replaces the
// container's children with its own panes/tile layers. Anything rendered
// INSIDE `mapContainer` (e.g. the route sidebar overlay) would be wiped
// out on init. The wrapper element (`mapWrapper`) sits OUTSIDE the
// Leaflet-owned container and hosts the sidebar overlay.

<script setup lang="ts">
import { useCollectorMissionStore } from '~/stores/mission'
import type { MissionLocation } from '~/types/mission'
import RouteSidebar from './RouteSidebar.vue'
import { useCustomToast } from '~/composables/useCustomToast'
import { useDeviceLocationWebSocket } from '~/composables/useDeviceLocationWebSocket'
import type { DeviceLocationWS } from '~/types/mission'

const toast = useCustomToast()

const props = defineProps<{
  missionId: string
}>()

const missionStore = useCollectorMissionStore()
useDeviceLocationWebSocket()
const mapContainer = ref<HTMLDivElement | null>(null)
const mapWrapper = ref<HTMLDivElement | null>(null)
const sidebarCollapsed = ref(false)
const isLocating = ref(false)
let locateBtnEl: HTMLElement | null = null

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

/**
 * Items rendered on the map. Prefer the specialised route payload from
 * `missionStore.route` (which carries distance/bearing per segment and is
 * already ordered by `sequence_order` server-side). Fall back to the
 * locations list when the route endpoint hasn't loaded yet.
 */
const orderedItems = computed<MissionLocation[]>(() => {
  const routeItems = missionStore.route?.items
  if (routeItems && routeItems.length > 0) return routeItems
  // Fallback: order by sequence_order then order_index, mirroring the
  // legacy behaviour so the map renders something useful even before the
  // route endpoint responds.
  return [...missionStore.locations].sort((a, b) => {
    const sa = a.sequence_order ?? Number.POSITIVE_INFINITY
    const sb = b.sequence_order ?? Number.POSITIVE_INFINITY
    if (sa !== sb) return sa - sb
    return (a.order_index ?? 0) - (b.order_index ?? 0)
  })
})

// Truncate tower name to 7 chars with an ellipsis.
function truncateName(name: string, max = 7): string {
  return name.length > max ? `${name.slice(0, max)}…` : name
}

// Escape HTML to prevent injection in popup content.
function esc(html: string): string {
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
  * Create a drone marker icon with pulsing animation based on status.
  * @param courseDeg Optional heading in degrees (0-360) to rotate the icon.
  */
  function createDroneIcon(status: string, courseDeg: number | null = null): any {
    let badgeClass = 'status-unknown'
    let statusLabel = 'UNKNOWN'

    if (status === 'IDLE') {
      badgeClass = 'status-idle'
      statusLabel = 'IDLE'
    } else if (status === 'MOVING' || (status !== 'UNKNOWN' && status !== 'IDLE')) {
      badgeClass = 'status-moving'
      statusLabel = status
    }

    const className = `leaflet-drone-marker drone-marker-${badgeClass}`
    console.log('[RouteMap] Creating drone icon with className:', className)

    // Rotate the icon by courseDeg when available (0 = North, clockwise)
    const rotationStyle = courseDeg != null ? `transform:rotate(${courseDeg}deg);` : ''

    // Different icon based on status: drone for IDLE, arrow for MOVING
    let iconSvg = ''
    if (status === 'IDLE') {
      // Drone/quadcopter icon (Lucide style)
      iconSvg = `<svg class="drone-icon-svg" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:18px;height:18px;">
        <path d="M10 10 7 7"/><path d="m10 14-3 3"/><path d="m14 10 3-3"/><path d="m14 14 3 3"/>
        <path d="M14.205 4.139a4 4 0 1 1 5.439 5.863"/>
        <path d="M19.637 14a4 4 0 1 1-5.432 5.868"/>
        <path d="M4.367 10a4 4 0 1 1 5.438-5.862"/>
        <path d="M9.795 19.862a4 4 0 1 1-5.429-5.873"/>
        <rect x="10" y="8" width="4" height="8" rx="1"/>
      </svg>`
    } else {
      // Arrow/direction icon for MOVING and other statuses
      iconSvg = `<svg class="drone-icon-svg" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:18px;height:18px;${rotationStyle}">
        <polygon points="3 11 22 2 13 21 11 13 3 11"/>
      </svg>`
    }

    return L.divIcon({
      className,
      html: `
        <div class="drone-marker-wrapper">
          <div class="drone-marker-badge ${badgeClass}" style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background-color:${badgeClass === 'status-moving' ? '#16a34a' : badgeClass === 'status-idle' ? '#6b7280' : '#dc2626'};color:#ffffff;box-shadow:0 0 8px rgba(255,255,255,0.5);">
            ${iconSvg}
          </div>
          <span class="drone-status-label">${statusLabel}</span>
        </div>
      `,
      iconSize: [48, 44],
      iconAnchor: [24, 22],
      popupAnchor: [0, -24]
    })
  }

/**
 * Draw / redraw route layers (polyline + segment labels + numbered markers)
 * onto the given Leaflet map. Each call removes the previous route layer
 * group before adding fresh layers so we don't accumulate stale markers.
 */
function renderRoute(
  map: any,
  L: any,
  routeLayer: { clearLayers: () => void; addLayer: (l: unknown) => void },
  items: MissionLocation[]
) {
  // Capture which tower marker (if any) currently has its popup open so we
  // can reopen it on the freshly-created marker after the layer group is
  // wiped. The /route endpoint poll redraws every few seconds, which would
  // otherwise destroy the popup mid-display.
  let openIdx: number | null = null
  if (map) {
    map.eachLayer((layer: any) => {
      if (layer instanceof L.Marker) {
        const popup = layer.getPopup?.()
        if (popup && popup.isOpen?.()) {
          const ll = layer.getLatLng()
          const idx = items.findIndex(
            (it) => Math.abs(it.latitude - ll.lat) < 1e-6 && Math.abs(it.longitude - ll.lng) < 1e-6
          )
          if (idx !== -1) openIdx = idx
        }
      }
    })
  }

  routeLayer.clearLayers()

  if (items.length === 0) return

  const routeLatlngs: [number, number][] = items.map(
    l => [l.latitude, l.longitude] as [number, number]
  )

  // Polyline — only when there is more than one point.
  if (routeLatlngs.length > 1) {
    L.polyline(routeLatlngs, {
      color: '#ffffff',
      weight: 4,
      opacity: 0.9,
      className: 'route-flow-polyline'
    }).addTo(routeLayer)

    // Per-segment midpoint labels (distance + bearing from previous).
    // Both fields live on the *destination* location of each segment.
    for (let i = 1; i < items.length; i++) {
      const prev = items[i - 1]!
      const curr = items[i]!
      const midLat = (prev.latitude + curr.latitude) / 2
      const midLng = (prev.longitude + curr.longitude) / 2

      const distM = curr.distance_from_previous_meters
      const bearing = curr.bearing_from_previous_degrees
      const distLabel = distM != null ? `${distM.toFixed(0)} m` : '—'
      const bearingLabel = bearing != null ? `${bearing.toFixed(0)}°` : '—'

      const labelHtml = `
        <div class="route-segment-label">
          <span class="route-segment-label__distance">${distLabel}</span>
          <span class="route-segment-label__sep">·</span>
          <span class="route-segment-label__bearing-group">
            <svg class="route-segment-label__arrow" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(${bearing ?? 0}deg);">
              <line x1="12" y1="19" x2="12" y2="5"></line>
              <polyline points="5 12 12 5 19 12"></polyline>
            </svg>
            <span class="route-segment-label__bearing">${bearingLabel}</span>
          </span>
        </div>
      `
      const labelIcon = L.divIcon({
        className: 'leaflet-route-segment-label',
        html: labelHtml,
        iconSize: null,
        iconAnchor: [0, 0]
      })
      L.marker([midLat, midLng], { icon: labelIcon, interactive: false })
        .addTo(routeLayer)
    }
  }

  // Numbered markers — one per location.
  items.forEach((loc, idx) => {
    // Marker color + glow class based on location status. The glow color is
    // applied via the `--glow-color` CSS variable consumed by main.css so
    // the surrounding outline matches the marker fill (e.g. VISITED → green
    // glow rather than the default blue).
    let markerColor = '#2563eb' // blue-600 (default PENDING)
    let badgeStatusClass = 'signal-marker-badge--pending'
    if (loc.status === 'VISITED') {
      markerColor = '#16a34a' // green-600
      badgeStatusClass = 'signal-marker-badge--visited'
    } else if (loc.status === 'SKIPPED') {
      markerColor = '#78716c' // stone-500
      badgeStatusClass = 'signal-marker-badge--skipped'
    } else if (loc.status === 'FAILED') {
      markerColor = '#78716c' // stone-500
      badgeStatusClass = 'signal-marker-badge--failed'
    } else if (loc.status === 'IN_PROGRESS') {
      markerColor = '#f59e0b' // amber-500
      badgeStatusClass = 'signal-marker-badge--in-progress'
    }

    const seqNum = loc.sequence_order != null ? loc.sequence_order : idx + 1
    const icon = L.divIcon({
      className: 'leaflet-signal-marker',
      html: `
        <div class="signal-marker-wrapper">
          <div class="signal-marker-badge ${badgeStatusClass}" style="
            background-color: ${markerColor};
            color: #ffffff;
          ">
            <span class="sequence-order-badge">${seqNum}</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M4.9 16.1C1 12.2 1 5.8 4.9 1.9m2.9 2.8a6.14 6.14 0 0 0 -.8 7.5"></path>
              <circle cx="12" cy="9" r="2"></circle>
              <path d="M16.2 4.8c2 2 2.26 5.11.8 7.47M19.1 1.9a9.96 9.96 0 0 1 0 14.1m-9.6 2h5 M8 22l4-11l4 11"></path>
            </svg>
          </div>
          <span class="tower-id-label">${esc(loc.cellular_tower_id)}</span>
        </div>
      `,
      iconSize: [60, 56],
      iconAnchor: [30, 17],
      popupAnchor: [0, -18]
    })

    const towerId = esc(loc.cellular_tower_id)
    const towerName = esc(loc.cellular_tower_name)
    const lat = loc.latitude
    const lng = loc.longitude

    // Build the status chip markup. Same palette as the sidebar list so
    // users see consistent visual semantics across the map and sidebar.
    const statusRaw = loc.status
    const statusLabel = statusRaw ? esc(statusRaw) : ''
    let statusChipHtml = ''
    if (statusRaw) {
      let chipClass = 'signal-popup-status--pending'
      if (statusRaw === 'VISITED') chipClass = 'signal-popup-status--visited'
      else if (statusRaw === 'SKIPPED') chipClass = 'signal-popup-status--skipped'
      else if (statusRaw === 'FAILED') chipClass = 'signal-popup-status--failed'
      else if (statusRaw === 'IN_PROGRESS') chipClass = 'signal-popup-status--in-progress'
      statusChipHtml = `<div class="signal-popup-row"><span>Status</span><span class="signal-popup-status ${chipClass}">${statusLabel}</span></div>`
    }

    // Build the visited-time row markup (only when status is VISITED and
    // `visited_at` is present). Mirrors the drone popup's "Updated" row so
    // users see when a tower was actually visited.
    const visitedAt = loc.visited_at
    let visitedRowHtml = ''
    if (loc.status === 'VISITED' && visitedAt) {
      const visitedLabel = new Date(visitedAt).toLocaleString('en-GB', { hour12: false })
      visitedRowHtml = `<div class="signal-popup-row"><span>Visited</span><span>${visitedLabel}</span></div>`
    }

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
          <strong>${towerId}</strong>
        </div>
        <div class="signal-popup-row"><span>Tower Name</span><span>${towerName}</span></div>
        ${statusChipHtml ? statusChipHtml : ''}
        ${visitedRowHtml}
        <div class="signal-popup-row signal-popup-row--coordinate">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span>${lat}, ${lng}</span>
        </div>
      </div>
    `

    L.marker([loc.latitude, loc.longitude], { icon })
      .addTo(routeLayer)
      .bindPopup(popupHtml, {
        closeButton: false,
        autoClose: false,
        closeOnClick: false,
        className: 'leaflet-signal-popup'
      })
      .on('popupopen', (e: any) => {
        // When the popup closes (via close button or programmatically),
        // invalidate openIdx so the next redraw won't reopen it.
        const popup = e?.popup
        if (popup) {
          popup.once('popupclose', () => {
            openIdx = null
          })
        }

        const popupEl = e?.popup?.getElement?.()
        const btn = popupEl?.querySelector('.signal-popup-close-btn')
        if (btn) {
          btn.addEventListener('click', (ev: Event) => {
            ev.stopPropagation()
            ev.preventDefault()
            map.eachLayer((layer: any) => {
              if (layer instanceof L.Marker && layer.getPopup() === popup) {
                layer.closePopup()
              }
            })
          })
        } else {
          setTimeout(() => {
            const el = popupEl?.querySelector('.signal-popup-close-btn')
            if (el) {
              el.addEventListener('click', (ev: Event) => {
                ev.stopPropagation()
                ev.preventDefault()
                map.eachLayer((layer: any) => {
                  if (layer instanceof L.Marker && layer.getPopup() === popup) {
                    layer.closePopup()
                  }
                })
              })
            }
          }, 0)
        }
      })
  })

  // Re-open the popup on the newly-created marker if one was open before
  // this redraw. This survives the clearLayers() + recreate cycle.
  if (openIdx !== null && openIdx < items.length) {
    routeLayer.eachLayer((layer: any) => {
      if (layer instanceof L.Marker) {
        const ll = layer.getLatLng()
        const loc = items[openIdx]!
        if (Math.abs(ll.lat - loc.latitude) < 1e-6 && Math.abs(ll.lng - loc.longitude) < 1e-6) {
          layer.openPopup()
        }
      }
    })
  }

  // Fit bounds only on initial render (when no previous items existed).
  // Don't re-fit on every poll/update — that would jank the user's map view.
  if (routeLatlngs.length && (!items || items.length === 0)) {
    map.fitBounds(routeLatlngs, { padding: [50, 50] })
  }
}

/**
 * Fit the map to show all tower markers + drone marker together.
 * Called once on initial load after both route and drone location are ready.
 */
function fitToAllMarkers(map: any, L: any) {
  const allPoints: [number, number][] = orderedItems.value.map(
    (l) => [l.latitude, l.longitude] as [number, number]
  )
  const wsLoc = missionStore.deviceLocationWS
  if (droneMarker && wsLoc?.latitude && wsLoc?.longitude) {
    allPoints.push([wsLoc.latitude, wsLoc.longitude] as [number, number])
  }
  if (allPoints.length === 0) return
  const bounds = L.latLngBounds(allPoints)
  map.fitBounds(bounds, { padding: [50, 50] })
  console.log('[RouteMap] fitToAllMarkers applied, points:', allPoints.length)
}

/**
 * Draw a radius circle around each tower marker, using the mission's
 * `radius_meters` value. Circles are drawn below the route markers so they
 * don't obscure the numbered badges.
 * If the drone marker is inside a circle, the border turns green with a pulse animation.
 */
function renderRadiusCircles(
  map: any,
  L: any,
  layer: any,
  items: MissionLocation[],
  droneLoc?: { latitude: number; longitude: number } | null
) {
  if (!layer) return
  layer.clearLayers()
  radiusCircles.value = []

  const mission = missionStore.selectedMission
  const radiusMeters = mission?.radius_meters ?? 0
  if (!radiusMeters || items.length === 0) return

  items.forEach((loc) => {
    const circle = L.circle([loc.latitude, loc.longitude], {
      radius: radiusMeters,
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.08,
      weight: 1.5,
      opacity: 0.5
    }).addTo(layer)

    // Check if drone is inside this circle
    if (droneLoc && droneLoc.latitude && droneLoc.longitude) {
      const dist = map.distance(
        [loc.latitude, loc.longitude],
        [droneLoc.latitude, droneLoc.longitude]
      )
      if (dist <= radiusMeters) {
        circle.setStyle({
          color: '#16a34a',
          fillColor: '#16a34a',
          fillOpacity: 0.12,
          opacity: 0.8,
          weight: 2
        })
        circle.addClass('radius-circle-active')
      }
    }

    radiusCircles.value.push(circle)
  })
}

let mapInstance: any = null
let routeLayerRef: any = null
let radiusLayerRef: any = null
const radiusCircles = ref<any[]>([])
let droneMarker: any = null
let resizeObserver: ResizeObserver | null = null
let initialFitDone = false

async function locateToDevice(map: any) {
  if (isLocating.value) return
  isLocating.value = true
  updateLocateIcon()

  try {
    const deviceLocation = await missionStore.fetchDeviceLocation()
    if (!deviceLocation?.latitude || !deviceLocation?.longitude) {
      toast.add({
        title: 'Error',
        description: 'Current device coordinate not available',
        color: 'error',
        icon: 'alert-circle'
      })
      return
    }
    const latlng = [deviceLocation.latitude, deviceLocation.longitude]
    console.log('[RouteMap] Locating to device:', latlng)
    map.setView(latlng, 16)

    // Update drone marker with HTTP-fetched location
    const status = deviceLocation.status || 'UNKNOWN'
    if (droneMarker) {
      droneMarker.setLatLng(latlng)
      const newIcon = createDroneIcon(status, deviceLocation.course_deg ?? null)
      droneMarker.setIcon(newIcon)
      const popup = droneMarker.getPopup()
      if (popup) {
        popup.setContent(buildDronePopupHtml(status, deviceLocation))
      }
      console.log('[RouteMap] Drone marker updated from locate button (HTTP)')
    } else {
      const icon = createDroneIcon(status, deviceLocation.course_deg ?? null)
      droneMarker = L.marker(latlng, { icon, zIndexOffset: 1000 })
      droneMarker.addTo(map)
      const popupContent = buildDronePopupHtml(status, deviceLocation)
      droneMarker.bindPopup(popupContent, {
        closeButton: false,
        autoClose: false,
        closeOnClick: false,
        className: 'leaflet-drone-popup'
      })
      console.log('[RouteMap] Drone marker created from locate button (HTTP)')
    }
  } catch (err) {
    console.error('[RouteMap] Failed to locate device:', err)
    toast.add({
      title: 'Error',
      description: 'Current device coordinate not available',
      color: 'error',
      icon: 'alert-circle'
    })
  } finally {
    isLocating.value = false
    updateLocateIcon()
  }
}

function updateLocateIcon() {
  if (!locateBtnEl) return
  if (isLocating.value) {
    locateBtnEl.innerHTML = `
      <svg class="animate-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
      </svg>
    `
  } else {
    locateBtnEl.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"></circle>
        <circle cx="12" cy="12" r="3"></circle>
        <line x1="12" y1="2" x2="12" y2="5"></line>
        <line x1="12" y1="19" x2="12" y2="22"></line>
        <line x1="2" y1="12" x2="5" y2="12"></line>
        <line x1="19" y1="12" x2="22" y2="12"></line>
      </svg>
    `
  }
}

async function fetchAndDisplayDroneLocation(map: any, L: any) {
  let loc: { latitude: number; longitude: number; status: string } | null
  try {
    loc = await missionStore.fetchDeviceLocation()
    console.log('[RouteMap] Device location fetched (HTTP):', loc)
    if (!loc?.latitude || !loc?.longitude) {
      console.warn('[RouteMap] No valid coordinates in device location')
      return
    }

    const status = loc.status || 'UNKNOWN'
    console.log('[RouteMap] Drone status:', status)
    const latlng = [loc.latitude, loc.longitude]

    if (droneMarker) {
      droneMarker.setLatLng(latlng)
      const newIcon = createDroneIcon(status, loc.course_deg ?? null)
      droneMarker.setIcon(newIcon)
      const popup = droneMarker.getPopup()
      if (popup) {
        popup.setContent(buildDronePopupHtml(status, loc))
      }
      console.log('[RouteMap] Drone marker updated in place (HTTP)')
      return
    }

    const icon = createDroneIcon(status, loc.course_deg ?? null)
    droneMarker = L.marker(latlng, { icon, zIndexOffset: 1000 })
    droneMarker.addTo(map)
    const popupContent = buildDronePopupHtml(status, loc)
    droneMarker.bindPopup(popupContent, {
      closeButton: false,
      autoClose: false,
      closeOnClick: false,
      className: 'leaflet-drone-popup'
    })
    droneMarker.on('popupopen', (e: any) => {
      const popupEl = e?.popup?.getElement?.()
      const coordRow = popupEl?.querySelector('#drone-coord-row')
      if (coordRow) {
        coordRow.style.display = 'flex'
        coordRow.style.justifyContent = 'space-between'
        coordRow.style.alignItems = 'center'
        coordRow.style.gap = '6px'
      }
      const btn = popupEl?.querySelector('.signal-popup-close-btn')
      if (btn) {
        btn.addEventListener('click', (ev: Event) => {
          ev.stopPropagation()
          ev.preventDefault()
          droneMarker?.closePopup()
        }, { once: true })
      }
    })
    console.log('[RouteMap] Drone marker added to map (HTTP), total layers:', map.hasLayer(droneMarker))
  } catch (err) {
    console.error('[RouteMap] Failed to fetch drone location:', err)
  }
}

/**
 * Update the existing drone marker when a WebSocket event arrives.
 * Called by the watcher on `deviceLocationWS`.
 */
function updateDroneMarkerFromWS(loc: DeviceLocationWS, map: any, L: any) {
  if (!loc?.latitude || !loc?.longitude) return

  const status = loc.status || 'UNKNOWN'
  console.log('[RouteMap] Drone WS update:', loc)
  const latlng = [loc.latitude, loc.longitude]

  if (droneMarker) {
    droneMarker.setLatLng(latlng)
    const newIcon = createDroneIcon(status, loc.course_deg ?? null)
    droneMarker.setIcon(newIcon)
    const popup = droneMarker.getPopup()
    if (popup) {
      popup.setContent(buildDronePopupHtml(status, loc))
    }
    console.log('[RouteMap] Drone marker updated from WS')
  } else {
    const icon = createDroneIcon(status, loc.course_deg ?? null)
    droneMarker = L.marker(latlng, { icon, zIndexOffset: 1000 })
    droneMarker.addTo(map)
    const popupContent = buildDronePopupHtml(status, loc)
    droneMarker.bindPopup(popupContent, {
      closeButton: false,
      autoClose: false,
      closeOnClick: false,
      className: 'leaflet-drone-popup'
    })
    droneMarker.on('popupopen', (e: any) => {
      const popupEl = e?.popup?.getElement?.()
      const coordRow = popupEl?.querySelector('#drone-coord-row')
      if (coordRow) {
        coordRow.style.display = 'flex'
        coordRow.style.justifyContent = 'space-between'
        coordRow.style.alignItems = 'center'
        coordRow.style.gap = '6px'
      }
      const btn = popupEl?.querySelector('.signal-popup-close-btn')
      if (btn) {
        btn.addEventListener('click', (ev: Event) => {
          ev.stopPropagation()
          ev.preventDefault()
          droneMarker?.closePopup()
        }, { once: true })
      }
    })
    console.log('[RouteMap] Drone marker created from WS, total layers:', map.hasLayer(droneMarker))
  }
}

/**
 * Build the HTML markup for the drone popup. Extracted so the same markup
 * can be reused for both initial bind and in-place updates.
 * Accepts both HTTP (DeviceLocation) and WS (DeviceLocationWS) payloads.
 */
function buildDronePopupHtml(status: string, deviceLocation: { latitude: number; longitude: number; speed_ms?: number | null; speed?: number | null; altitude_m?: number | null; altitude?: number | null; course_deg?: number | null; datetime: string; error?: string }): string {
  const speed = deviceLocation.speed_ms ?? deviceLocation.speed ?? null
  const altitude = deviceLocation.altitude_m ?? deviceLocation.altitude ?? null
  const courseDeg = deviceLocation.course_deg ?? null
  const isErrored = !!deviceLocation.error

  return `
    <div class="drone-popup">
      <button type="button" class="signal-popup-close-btn" aria-label="Close">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <div class="drone-popup-header">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M10 10 7 7"></path>
          <path d="m10 14-3 3"></path>
          <path d="m14 10 3-3"></path>
          <path d="m14 14 3 3"></path>
          <path d="M14.205 4.139a4 4 0 1 1 5.439 5.863"></path>
          <path d="M19.637 14a4 4 0 1 1-5.432 5.868"></path>
          <path d="M4.367 10a4 4 0 1 1 5.438-5.862"></path>
          <path d="M9.795 19.862a4 4 0 1 1-5.429-5.873"></path>
          <rect x="10" y="8" width="4" height="8" rx="1"></rect>
        </svg>
        <strong>Drone Location</strong>
      </div>
      <div class="signal-popup-row"><span>Status</span><span class="drone-status-chip drone-status-${status.toLowerCase()}">${status}</span></div>
      ${isErrored ? `<div class="signal-popup-row"><span class="error-badge">⚠ ${deviceLocation.error}</span></div>` : ''}
      <div class="signal-popup-row" id="drone-coord-row" style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
        <span style="margin-left:auto; text-align:right;">${deviceLocation.latitude.toFixed(6)}, ${deviceLocation.longitude.toFixed(6)}</span>
      </div>
      <div class="signal-popup-row"><span>Speed</span><span>${speed != null ? `${speed.toFixed(2)} m/s` : '-'}</span></div>
      <div class="signal-popup-row"><span>Altitude</span><span>${altitude != null ? `${altitude.toFixed(1)} m` : '-'}</span></div>
      <div class="signal-popup-row"><span>Course</span><span>${courseDeg != null ? `${courseDeg.toFixed(1)}°` : '-'}</span></div>
      <div class="signal-popup-row"><span>Updated</span><span>${new Date(deviceLocation.datetime).toLocaleString('en-GB', { hour12: false })}</span></div>
    </div>
  `
}

onMounted(async () => {
  const container = mapContainer.value
  if (!container) return

  const L = (window as unknown as Record<string, unknown>).L
  if (!L) {
    console.error('[RouteMap] Leaflet (window.L) is not available')
    return
  }

  mapInstance = L.map(container, {
    center: [-6.150676643667096, 106.89665223346297],
    zoom: 13,
    zoomControl: false
  })
  L.control.zoom({ position: 'topright' }).addTo(mapInstance)
  
  // Locate button — positioned below zoom controls
  const locateBtn = L.control({ position: 'topright' })
  locateBtn.onAdd = () => {
    const btn = L.DomUtil.create('button', 'leaflet-control-locate')
    btn.title = 'Locate Device'
    locateBtnEl = btn
    btn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"></circle>
        <circle cx="12" cy="12" r="3"></circle>
        <line x1="12" y1="2" x2="12" y2="5"></line>
        <line x1="12" y1="19" x2="12" y2="22"></line>
        <line x1="2" y1="12" x2="5" y2="12"></line>
        <line x1="19" y1="12" x2="22" y2="12"></line>
      </svg>
    `
    btn.addEventListener('click', () => locateToDevice(mapInstance))
    return btn
  }
  locateBtn.addTo(mapInstance)

  // Dark tile layers (base + labels) — matches MapView theme.
  L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
    {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }
  ).addTo(mapInstance)
  L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png',
    { subdomains: 'abcd', maxZoom: 19 }
  ).addTo(mapInstance)

  // Single layer group so we can clear/redraw route geometry without
  // touching base tiles.
  routeLayerRef = L.layerGroup().addTo(mapInstance)

  // Separate layer group for per-tower radius circles, drawn below the
  // route markers so they don't obscure numbered badges.
  radiusLayerRef = L.layerGroup().addTo(mapInstance)

  // Trigger an initial fetch of the route endpoint so the map has the
  // authoritative ordered itinerary + per-segment metrics on first paint.
  // The watcher below will pick up the response and redraw.
  await missionStore.fetchRoute(props.missionId)

  // Fit bounds to all markers (route towers) on first load
  // (drone marker is created lazily by the WS watcher below)
  if (mapInstance && orderedItems.value.length > 0) {
    fitToAllMarkers(mapInstance, L)
    initialFitDone = true
  }

  // React to layout changes (e.g. window resize).
  resizeObserver = new ResizeObserver(() => mapInstance?.invalidateSize())
  const wrapperEl = mapWrapper.value
  if (wrapperEl) resizeObserver.observe(wrapperEl)

  // Watch WebSocket device location and update marker in real time
  watch(
    () => missionStore.deviceLocationWS,
    (wsLoc) => {
      if (wsLoc && mapInstance && !droneMarker) {
        // First WS location arrives — create marker if HTTP one didn't
        updateDroneMarkerFromWS(wsLoc, mapInstance, L)
      } else if (wsLoc && mapInstance && droneMarker) {
        updateDroneMarkerFromWS(wsLoc, mapInstance, L)
        // Update radius circles to check if drone is now inside any circle
        renderRadiusCircles(mapInstance, L, radiusLayerRef, orderedItems.value, wsLoc)
      }
    },
    { deep: true }
  )
})

// Redraw whenever the route payload changes — covers initial load,
// reorder success, and any future invalidations.
watch(
  orderedItems,
  (items) => {
    if (!mapInstance || !routeLayerRef) return
    const droneLoc = missionStore.deviceLocationWS || missionStore.deviceLocation
    renderRoute(mapInstance, (window as any).L, routeLayerRef, items)
    renderRadiusCircles(mapInstance, (window as any).L, radiusLayerRef, items, droneLoc)
  },
  { deep: true, immediate: true }
)

onUnmounted(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  if (mapInstance) {
    if (droneMarker) {
      mapInstance.removeLayer(droneMarker)
      droneMarker = null
    }
    if (radiusLayerRef) {
      mapInstance.removeLayer(radiusLayerRef)
      radiusLayerRef = null
    }
    mapInstance.remove()
    mapInstance = null
  }
})
</script>

<template>
  <div
    ref="mapWrapper"
    data-testid="route-map-wrapper"
    class="relative h-[500px] w-full overflow-hidden bg-neutral-900"
  >
    <div
      ref="mapContainer"
      data-testid="route-map"
      class="absolute inset-0"
    />
    <!-- Toggle sidebar button (top-left, only visible when collapsed) -->
    <button
      v-if="sidebarCollapsed"
      type="button"
      @click="toggleSidebar"
      class="absolute left-4 top-4 z-[600] flex size-[35px] items-center justify-center rounded-lg border-2 border-primary-300 bg-[rgba(0,0,0,0.7)] text-[#e4e4e7] transition-all hover:bg-[#18181b] hover:border-primary-400 hover:text-primary-200 hover:shadow-[0_0_12px_var(--theme-glow-strong)] shadow-[0_0_8px_var(--theme-glow-soft)]"
      aria-label="Show route list"
      title="Show route list"
    >
      <UIcon name="lucide:panel-left-open" class="size-5" aria-hidden="true" />
    </button>
    <RouteSidebar
      :mission-id="missionId"
      :collapsed="sidebarCollapsed"
      @toggle="toggleSidebar"
    />
  </div>
</template>

<style scoped>
/* Pulse animation for active radius circles when drone is inside */
@keyframes radius-pulse {
  0%,
  100% {
    opacity: 0.8;
  }
  50% {
    opacity: 0.3;
  }
}

.radius-circle-active {
  animation: radius-pulse 1.5s ease-in-out infinite;
}
</style>