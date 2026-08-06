# Epic: Mission Planner

| Field | Value |
|-------|-------|
| **Epic #** | MP-1 |
| **Title** | Mission Planner |
| **Status** | Draft |
| **Owner** | TBD |
| **Created** | 2026 |

---

## 1. Overview

A complete mission planning system allowing users to define cellular-survey missions, upload GPS waypoints, execute them with live status updates, and visualize the planned route.

---

## 2. Goals

- Replace the ad-hoc scan-only data model with explicit **Mission** entities.
- Allow operators to plan a route (CSV upload of waypoints) ahead of time.
- Track mission lifecycle: **draft → active → paused → active → completed/cancelled**.
- Provide real-time UI updates for status, scan count, and location count.
- Render the planned route on the map before and during the survey.

---

## 3. Non-Goals

- Real GPS device integration (we'll rely on existing scan-collection flow).
- Multi-user / per-mission RBAC beyond auth (TBD later).
- Offline editing of missions (assumed always-online).

---

## 4. Architecture

```
┌───────────────────────────────────────────────────────────────────────┐
│                          Browser (Nuxt 3)                              │
├───────────────────────────────────────────────────────────────────────┤
│  Pinia: MissionStore   WebSocket: ws:mission_updates                  │
│                                                                       │
│  Pages:                                                               │
│    /missions                  (list)                                  │
│    /missions/create           (create)                                │
│    /missions/[id]             (detail w/ tabs)                        │
│    /missions/[id]/edit        (edit)                                  │
│    /missions/[id]/locations/upload                                        │
│    /missions/[id]/locations   (list)                                  │
│                                                                       │
│  Components:                                                          │
│    MissionCard, LocationUpload, LocationList, RouteMap,               │
│    StatusBadge, MissionsWebSocket                                     │
└───────────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTPS / WSS
                                ▼
┌───────────────────────────────────────────────────────────────────────┐
│                          Backend (Fastify)                            │
├───────────────────────────────────────────────────────────────────────┤
│  Routes:                                                              │
│    /api/missions              GET / POST                              │
│    /api/missions/:id          GET / PATCH / DELETE                    │
│    /api/missions/:id/start    POST                                    │
│    /api/missions/:id/pause    POST                                    │
│    /api/missions/:id/resume   POST                                    │
│    /api/missions/:id/complete POST                                    │
│    /api/missions/:id/cancel   POST                                    │
│    /api/missions/:id/locations  GET / POST (csv upload)               │
│    /api/missions/:id/locations/:loc_id  GET / PATCH / DELETE          │
│    /api/missions/:id/scans    GET                                     │
│    /api/missions/:id/logs     GET                                     │
│                                                                       │
│  Services: missionService                                             │
│  WS: ws://…/ws/missions  (broadcasts mission_updated, status_changed, │
│     scan_collected, location_uploaded)                                │
└───────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────────────┐
│                          PostgreSQL                                   │
├───────────────────────────────────────────────────────────────────────┤
│  missions (id, user_id, name, description, status, center_lat,        │
│            center_lon, location_count, scan_count,                    │
│            created_at, updated_at, deleted_at)                        │
│  mission_locations (id, mission_id, latitude, longitude, altitude,    │
│                      order_index, created_at)                         │
│  mission_scans (id, mission_id, scan_id, collected_at)                │
│  mission_logs (id, mission_id, level, message, created_at)            │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 5. Feature Index

| # | Feature | Status |
|---|---------|--------|
| 01 | Database schema migrations | To do |
| 02 | Mission & Location model types (frontend) | To do |
| 03 | Mission store (Pinia) | To do |
| 04 | WebSocket service for mission updates | To do |
| 05 | Mission service (frontend API client) | To do |
| 06 | Backend: mission service | To do |
| 07 | Backend: mission REST routes | To do |
| 08 | Backend: WebSocket broadcaster | To do |
| 09 | Mission list page | To do |
| 10 | Mission create page | To do |
| 11 | Mission detail page | To do |
| 12 | Mission edit page | To do |
| 13 | Location upload component | To do |
| 14 | Location upload page | To do |
| 15 | Location list component | To do |
| 16 | Location list page | To do |
| 17 | Route map component | To do |
| 18 | E2E tests | To do |

---

## 6. Timeline

| Phase | Features | ETA |
|-------|----------|-----|
| Phase 1 — Backend foundation | 01, 06, 07, 08 | Week 1 |
| Phase 2 — Frontend foundation | 02, 03, 04, 05 | Week 1 |
| Phase 3 — Mission CRUD UI | 09, 10, 11, 12 | Week 2 |
| Phase 4 — Locations & map | 13, 14, 15, 16, 17 | Week 2 |
| Phase 5 — Tests & polish | 18 | Week 3 |

---

## 7. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Existing scan data not associated with missions | Use nullable `mission_id` FK in scans; run a backfill migration |
| CSV parsing edge cases (BOM, CRLF, multi-line cells) | Use Papa Parse instead of hand-rolled parser |
| WebSocket race conditions (status changed during fetch) | Re-fetch mission after reconnect; merge WS events into store |
| Performance with thousands of locations per mission | Server-side pagination; chunked render on map |

---

## 8. Success Metrics

- Operators can create + start a mission in **< 30 seconds** end-to-end.
- UI reflects WebSocket events in **< 200 ms** of broadcast.
- **100%** E2E test coverage for happy paths.
- **0** production incidents related to mission state corruption.
