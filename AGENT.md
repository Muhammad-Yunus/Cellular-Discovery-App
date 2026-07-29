# FE_SPEC.md

# USB Modem LTE Network Discovery Web Frontend

**Framework:** Nuxt 4  
**Language:** TypeScript  
**Build Tool:** Vite  
**UI Framework:** Vue 3  
**State Management:** Pinia  
**CSS Framework:** TailwindCSS  
**Map Library:** Leaflet  
**HTTP Client:** Nuxt $fetch  
**Architecture:** Component Based + KISS

---

# Objective

Develop a responsive web frontend for the USB Modem LTE Network Discovery system.

The frontend communicates exclusively with the FastAPI backend.

The frontend SHALL NEVER communicate directly with

- USB Modem
- Serial Port
- PostgreSQL
- CLI Application

All communication MUST go through the REST API exposed by the backend.

---

# Technology Constraints

The technology stack is fixed.

The AI agent SHALL NOT replace or introduce alternative frameworks.

Allowed technologies

- Nuxt 4
- Vue 3
- TypeScript
- Vite
- Pinia
- TailwindCSS
- Leaflet
- Nuxt $fetch

Forbidden replacements

- React
- NextJS
- Angular
- Svelte
- Express
- Axios
- Vuetify
- Bootstrap
- jQuery
- Google Maps
- OpenLayers

Do not migrate the project to another framework.

Do not introduce unnecessary dependencies.

Follow the existing technology stack.

---

# Design Principles

Always follow

- KISS
- Component Based Architecture
- Reusable Components
- Single Responsibility
- Strong Typing
- Explicit State Management
- Minimal Dependencies
- Responsive Layout
- Easily Testable

---

# UI Design Reference

The UI SHALL follow the provided LTE Scanner dashboard mockup.

The objective is to reproduce the overall user experience rather than every pixel.

Layout consists of

```
+------------------------------------------------------------+
| Navbar                                                     |
+---------------------+--------------------------------------+
|                     |                                      |
|                     |                                      |
|                     |                                      |
|                     |                                      |
| Sidebar             |              Map                     |
|                     |                                      |
|                     |                                      |
|                     |                                      |
|                     |                                      |
+---------------------+--------------------------------------+
| Bottom Information Panel                                  |
+------------------------------------------------------------+
```

The layout SHALL remain consistent across desktop resolutions.

---

# Theme

Dark theme.

Professional.

Industrial.

Minimal.

No flashy animation.

No glassmorphism.

No neumorphism.

---

# Navigation

Top Navigation

- Home
- Settings
- Scan Result
- About

The navigation bar remains fixed.

---

# Sidebar

**Floating semi-transparent panel** positioned on left side of the map.

The sidebar displays

- Scan History (scrollable list)
- Search
- Filter
- Sort
- New Scan Button

Each scan item displays

- Operator
- MCC/MNC
- RAT
- Scan Time

Clicking a scan

- highlights marker on map
- centers map view on selected scan
- opens information in bottom panel

The sidebar SHALL have semi-transparent background allowing map features underneath to be partially visible when not covering them. Width constrained (e.g., 280-320px) to avoid obscuring too much of the map. Max-height fills remaining viewport height below navbar.

---

# Map

Leaflet SHALL be used.

Default center

```
Latitude: -6.150676643667096
Longitude: 106.89665223346297
```

Initial zoom

```
17
```

Map features

- Marker
- Popup
- Zoom
- Pan

Future

- Marker Cluster
- Heatmap

---

# Bottom Information Panel

Tabbed layout with **semi-transparent floating overlay** positioned on top of the Map (z-index above map layer).

Tabs

```
Signal
GPS
System
```

Signal

Display

- Operator
- MCC
- MNC
- RAT
- Scan Time

GPS

Display

- Latitude
- Longitude
- GPS Provider

System

Display

- Backend Status
- CLI Status
- Response Time

The panel SHALL be draggable/resizable (optional UX improvement) and closeable (toggle visibility). Background should have transparency (e.g., rgba(0,0,0,0.7)) so map features underneath remain partially visible.

---

# Pages

```
pages/

index.vue

settings.vue

history.vue

about.vue
```

---

# Components

```
components/

AppNavbar.vue

Sidebar.vue

MapView.vue

MapMarker.vue

HistoryList.vue

HistoryCard.vue

SearchBox.vue

FilterPanel.vue

SignalPanel.vue

GPSPanel.vue

SystemPanel.vue

LoadingOverlay.vue

StatusBadge.vue

ConfirmationDialog.vue
```

Components SHALL remain small.

Components SHALL have a single responsibility.

---

# Layout

```
layouts/

default.vue
```

The default layout SHALL contain:

- Navbar (fixed/sticky top spanning full width)
- Map (full remaining area below navbar)
- Floating Sidebar (semi-transparent, positioned left side of map, scrollable scan history list)
- Floating Bottom Panel (semi-transparent overlay on bottom-right or bottom-center of map, containing Signal/GPS/System tabs)

Both sidebar and bottom panel shall have **semi-transparent background** (e.g., rgba(0,0,0,0.7-0.85)) allowing map content underneath to be partially visible. They should use z-index higher than map layer but lower than any toast/notification overlays.

The layout SHALL remain consistent across desktop resolutions. Map fills all available space below navbar. Sidebar is anchored to left edge with appropriate margin/padding. Bottom panel is anchored to bottom edge with optional corner positioning.

# State Management

Use Pinia.

Stores

```
scanStore

gpsStore

settingsStore

systemStore
```

Global application state belongs only inside Pinia.

Do not store global state inside components.

---

# Composables

```
composables/

useScan.ts

useGPS.ts

useSettings.ts

useSystem.ts

useMap.ts
```

Composables SHALL encapsulate API interaction.

Pages SHALL NOT directly perform HTTP requests.

---

# Services

```
services/

scan.service.ts

settings.service.ts

system.service.ts
```

Services SHALL wrap every backend API.

Components SHALL NOT call REST endpoints directly.

---

# Backend Integration

The frontend communicates only with FastAPI.

Base URL

```
/api/v1
```

Endpoints

```
POST /scan

GET /scans

GET /scans/{id}

DELETE /scans/{id}

GET /settings

PUT /settings
```

WebSocket (future)

```
/ws/gps
/ws/scan
```

## Development Notes

For systemd service deployment, ensure `CLI_COMMAND` is set to the full path of the `lte-discovery` executable (e.g., `/home/pi/.local/bin/lte-discovery`) since systemd does not load user's `$PATH` from `~/.profile`. See `.env.example` for configuration details.

---

# WebSocket Integration

The frontend SHALL connect to two WebSocket endpoints for realtime updates:

1. **`/ws/gps`** — Receives live GPS coordinate updates
   - Message format: `{ "latitude": -6.150677, "longitude": 106.896652, "provider": "mock" }`
   - On update: refresh map marker, update GPS panel, update `gpsStore`

2. **`/ws/scan`** — Receives scan completion notifications
   - Message format: `{ "event": "scan_complete", "scan_id": "uuid" }`
   - On event: refresh history list, update signal panel with latest scan, show toast notification

WebSocket connection logic:
- Establish on app mount (use Nuxt `onMounted` lifecycle)
- Auto-reconnect on disconnect with exponential backoff (max 5 retries)
- Clean up on component unmount (`onUnmounted`)
- Handle errors gracefully with user-friendly messages
- Close connections when navigating away from relevant pages

---

# CORS Configuration (Backend Side)

During deployment, set `ALLOWED_CORS_ORIGINS` environment variable on the backend to include the frontend origin. Example:

```env
ALLOWED_CORS_ORIGINS="http://localhost:3000,https://yourdomain.com"
```

Otherwise the default `*` may work in development, but restrict to specific origins in production for security. The frontend domain must be explicitly whitelisted.

---

# Scan Workflow

User clicks

```
Get LTE Signal
```

Workflow

```
Loading

↓

POST /scan

↓

Receive Result

↓

Update Map

↓

Update Sidebar

↓

Update Bottom Panel
```

---

# Settings Workflow

Load

```
GET /settings
```

Save

```
PUT /settings
```

---

# Pagination & Search (GET /scans)

The `/scans` endpoint supports query parameters:

- `limit` (default: 20, max: 100) — number of records per page
- `offset` (default: 0) — starting record index
- `search` (optional) — text filter on operator, MCC, MNC fields

Frontend pagination store should track: `currentPage`, `limit`, `totalItems`, `offset`, `searchTerm`. Implement client-side or server-side pagination as appropriate. When user changes page or search, fetch new data with updated parameters.

---

# Folder Structure

```
frontend/

app.vue

layouts/

pages/

components/

composables/

services/

stores/

types/

assets/

public/

plugins/

utils/

middleware/

.env.example
```

---

# Environment Configuration

Repository SHALL include

```
.env.example
```

Required variables

```env
NUXT_PUBLIC_API_BASE=http://localhost:8000/api/v1

NUXT_PUBLIC_APP_NAME=LTE Scanner

NUXT_PUBLIC_DEFAULT_LAT=-6.150676643667096

NUXT_PUBLIC_DEFAULT_LON=106.89665223346297
```

Application SHALL NOT hardcode backend URLs. All API base paths come from environment variables.

---

# API Rules

Components SHALL NEVER call

```
fetch()

$fetch()

useFetch()
```

directly. Only

```
services/
```

may communicate with REST APIs. This centralizes API logic and makes mocking easier for testing.

---

# Error Handling

Display user-friendly messages.

Never expose

- Stack Trace
- FastAPI Exception
- Internal Errors

Display

- Network Error
- Backend Offline
- Scan Failed
- Invalid Response

Error format from backend is typically `{"detail": "error message"}`. Catch both network-level errors (connection refused, timeout) and application-level validation errors. Show toast/snackbar alerts for user-facing errors.

---

# Loading State

Every REST request SHALL display

- Loading Overlay
- Spinner
- Disabled Button

Prevent duplicate requests. Use a loading flag in services/stores to disable buttons while requests are pending. For concurrent requests, show aggregated loading state if needed.

---

# Empty State

History page

Display

```
No Scan History
```

Map

Display

```
No Scan Available
```

Show appropriate messages when lists are empty or no data available for selection.

---

# Styling Rules

Use TailwindCSS only.

Do not introduce

- Bootstrap
- Bulma
- Vuetify

Component styles SHALL remain scoped.

Avoid inline CSS.

---

# Icons

Use

```
@iconify/vue
```

Do not introduce multiple icon libraries.

---

# Responsive Design

Support

- Desktop
- Laptop
- Tablet

Mobile optimization is optional.

The primary target resolution

```
1920 x 1080
```

---

# Performance

Avoid unnecessary re-render.

Lazy load pages.

Reuse components.

Avoid duplicate API requests. Use Pinia stores to cache data and share between components. Debounce search inputs to prevent excessive API calls.

---

# Accessibility

Buttons SHALL have labels.

Forms SHALL have labels.

Dialogs SHALL support keyboard navigation.

Ensure all interactive elements are focusable and operable via keyboard. Provide ARIA labels where appropriate.

---

# Testing

Unit Test

- Components
- Stores
- Services

Mock all backend APIs.

Frontend tests SHALL NOT require FastAPI. Use mocking libraries like `jest-mock-fetch` or Nuxt's `vi.mock()` for service layer. Ensure components render correctly with mocked data.

---

# Type Synchronization

Frontend TypeScript interfaces shall mirror backend Pydantic models. Recommended approach:

1. Manual sync for core types (`ScanResponse`, `ScanSummary`, `Setting`, `ScanCreate`, etc.) using `backend/app/schemas/scan.py` and related files as reference. Define matching TypeScript interfaces/types in `frontend/types/`.

2. Optionally generate frontend TypeScript types from OpenAPI spec at `/openapi.json` using tools like `openapi-typescript` during build.

Keep types in sync when backend schema changes. Add automated type-checking in CI pipeline if possible.

---

# System Health Checks

Frontend shall periodically check backend health:

- **Backend Status**: GET `/health` → 200 = OK, 503 = Unavailable. Check on app mount and periodically (e.g., every 30 seconds). Display status in bottom panel.
- **CLI Status**: Infer from `GET /scans` — if last scan time is beyond threshold, show CLI warning. Consider adding `/api/v1/cli/status` endpoint for explicit status in future.

Update system store with health results and display colored badges in UI.

---

# Signal Panel Data Source

Signal panel displays data from the **currently selected scan** from the sidebar list. If no selection is made, show the most recent completed scan (from `scanStore`). Data fields: Operator, MCC, MNC, RAT, Scan Time. Fetch from `GET /scans/{id}` when a scan is selected.

---

# GPS Realtime Updates

Subscribe to `/ws/gps` on app mount (use `useGPS` composable). Latest coordinate message drives:

- Map center and marker position
- GPS panel latitude/longitude/provider display
- Current location stored in `gpsStore`

Handle initial fallback to default coordinates if no GPS received within reasonable time. Display provider name ("mock" or "serial") in GPS panel.

Map center should be initialized as `[DEFAULT_LAT, DEFAULT_LON]` array format (not separate lat/lon vars) for Leaflet.

---

# Definition of Done

A feature is complete only when

- implementation finished
- typed
- documented
- reusable
- responsive
- follows folder structure
- follows technology constraints
- follows component architecture
- passes lint
- passes unit tests
- contains no duplicated logic
- contains no hardcoded backend URL
- code reviewed

---

# Future Features

- Live WebSocket Update
- Marker Cluster
- Heatmap
- Export CSV
- Export JSON
- Multi Modem
- Theme Switcher
- Fullscreen Map

(End of file — total revised lines)