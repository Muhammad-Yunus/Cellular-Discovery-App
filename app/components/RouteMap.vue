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

const toast = useCustomToast()

const props = defineProps<{
  missionId: string
}>()

const missionStore = useCollectorMissionStore()
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
 */
function createDroneIcon(status: string): any {
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
  
  // Lucide "drone" icon paths (24x24 viewBox, stroke=currentColor)
  return L.divIcon({
    className,
    html: `
      <div class="drone-marker-wrapper">
        <div class="drone-marker-badge ${badgeClass}" style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background-color:${badgeClass === 'status-moving' ? '#16a34a' : badgeClass === 'status-idle' ? '#6b7280' : '#dc2626'};color:#ffffff;box-shadow:0 0 8px rgba(255,255,255,0.5);">
          <svg class="drone-icon-svg" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:18px;height:18px;">
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
    const createdAt = loc.created_at
      ? esc(new Date(loc.created_at).toLocaleString('en-GB', { hour12: false }))
      : '—'
    const visitedAt = loc.visited_at
      ? esc(new Date(loc.visited_at).toLocaleString('en-GB', { hour12: false }))
      : null

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
      statusChipHtml = `<span class="signal-popup-status ${chipClass}">${statusLabel}</span>`
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
        ${statusChipHtml ? `<div class="signal-popup-status-row">${statusChipHtml}</div>` : ''}
        <div class="signal-popup-row signal-popup-row--coordinate">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span>${lat}, ${lng}</span>
        </div>
        <div class="signal-popup-row">
          <span>Created</span><span>${createdAt}</span>
        </div>
        ${visitedAt ? `<div class="signal-popup-row"><span>Visited</span><span>${visitedAt}</span></div>` : ''}
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
        const popupEl = e?.popup?.getElement?.()
        const btn = popupEl?.querySelector('.signal-popup-close-btn')
        if (btn) {
          btn.addEventListener('click', (ev: Event) => {
            ev.stopPropagation()
            ev.preventDefault()
            map.eachLayer((layer: any) => {
              if (layer instanceof L.Marker && layer.getPopup() === e.popup) {
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
                  if (layer instanceof L.Marker && layer.getPopup() === e.popup) {
                    layer.closePopup()
                  }
                })
              })
            }
          }, 0)
        }
      })
  })

  // Fit bounds to show every location.
  if (routeLatlngs.length) {
    map.fitBounds(routeLatlngs, { padding: [50, 50] })
  }
}

let mapInstance: any = null
let routeLayerRef: any = null
let droneMarker: any = null
let droneLocationInterval: any = null
let resizeObserver: ResizeObserver | null = null

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
  let deviceLocation: any
  try {
    deviceLocation = await missionStore.fetchDeviceLocation()
    console.log('[RouteMap] Device location fetched:', deviceLocation)
    
    if (!deviceLocation?.latitude || !deviceLocation?.longitude) {
      console.warn('[RouteMap] No valid coordinates in device location')
      return
    }
    
    const status = deviceLocation.status || 'UNKNOWN'
    console.log('[RouteMap] Drone status:', status)
    const latlng = [deviceLocation.latitude, deviceLocation.longitude]
    console.log('[RouteMap] Drone latlng:', latlng)

    // If marker already exists, just update its position and content — DO NOT
    // remove and recreate. Removing causes the bound popup to close mid-display
    // when the polling interval fires every 5 seconds.
    if (droneMarker) {
      droneMarker.setLatLng(latlng)
      const newIcon = createDroneIcon(status)
      droneMarker.setIcon(newIcon)
      // Update popup content in place if popup is bound
      const popup = droneMarker.getPopup()
      if (popup) {
        popup.setContent(buildDronePopupHtml(status, deviceLocation))
      }
      console.log('[RouteMap] Drone marker updated in place')
      return
    }

    const icon = createDroneIcon(status)
    
    droneMarker = L.marker(latlng, {
      icon,
      zIndexOffset: 1000 // Ensure drone marker appears above other markers
    })
    
    // Only add marker to map, don't auto-center
    droneMarker.addTo(map)
    
    // Add popup with drone info
    const popupContent = buildDronePopupHtml(status, deviceLocation)
    
    droneMarker.bindPopup(popupContent, {
      closeButton: false, // Custom X button inside content (Leaflet's default X is in the corner already)
      autoClose: false,
      closeOnClick: false,
      className: 'leaflet-drone-popup'
    })
    
    // Wire up the custom close button inside the popup to actually close it.
    droneMarker.on('popupopen', (e: any) => {
      const popupEl = e?.popup?.getElement?.()
      const btn = popupEl?.querySelector('.signal-popup-close-btn')
      if (btn) {
        btn.addEventListener('click', (ev: Event) => {
          ev.stopPropagation()
          ev.preventDefault()
          droneMarker?.closePopup()
        }, { once: true })
      }
    })
    
    console.log('[RouteMap] Drone marker added to map, total layers:', map.hasLayer(droneMarker))
    
  } catch (err) {
    console.error('[RouteMap] Failed to fetch drone location:', err)
  }
}

/**
 * Build the HTML markup for the drone popup. Extracted so the same markup
 * can be reused for both initial bind and in-place updates.
 */
function buildDronePopupHtml(status: string, deviceLocation: any): string {
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
      <div class="signal-popup-row signal-popup-row--coordinate">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
        <span>${deviceLocation.latitude.toFixed(6)}, ${deviceLocation.longitude.toFixed(6)}</span>
      </div>
      ${deviceLocation.speed != null ? `<div class="signal-popup-row"><span>Speed</span><span>${deviceLocation.speed.toFixed(2)} m/s</span></div>` : ''}
      ${deviceLocation.altitude != null ? `<div class="signal-popup-row"><span>Altitude</span><span>${deviceLocation.altitude.toFixed(1)} m</span></div>` : ''}
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

  // Trigger an initial fetch of the route endpoint so the map has the
  // authoritative ordered itinerary + per-segment metrics on first paint.
  // The watcher below will pick up the response and redraw.
  await missionStore.fetchRoute(props.missionId)

  // Fetch and display drone location
  await fetchAndDisplayDroneLocation(mapInstance, L)
  
  // Poll drone location every 5 seconds
  droneLocationInterval = setInterval(async () => {
    await fetchAndDisplayDroneLocation(mapInstance, L)
  }, 5000)

  // React to layout changes (e.g. window resize).
  resizeObserver = new ResizeObserver(() => mapInstance?.invalidateSize())
  const wrapperEl = mapWrapper.value
  if (wrapperEl) resizeObserver.observe(wrapperEl)
})

// Redraw whenever the route payload changes — covers initial load,
// reorder success, and any future invalidations.
watch(
  orderedItems,
  (items) => {
    if (!mapInstance || !routeLayerRef) return
    renderRoute(mapInstance, (window as any).L, routeLayerRef, items)
  },
  { deep: true, immediate: true }
)

onUnmounted(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  if (droneLocationInterval) {
    clearInterval(droneLocationInterval)
    droneLocationInterval = null
  }
  if (mapInstance) {
    if (droneMarker) {
      mapInstance.removeLayer(droneMarker)
      droneMarker = null
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