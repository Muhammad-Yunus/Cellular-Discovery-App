# Mission Planner — Feature Index

This directory contains all feature documentation for the Mission Planner epic.

## Quick links

### Epic Overview
- [00 — Epic Overview](./00_EPIC_overview.md)

### Phase 1 — Backend foundation
- [01 — Database schema migrations](./NEW_FEATURE_01_db_schema_migrations.md)
- [06 — Backend: mission service](./NEW_FEATURE_06_backend_mission_service.md)
- [07 — Backend: mission REST routes](./NEW_FEATURE_07_backend_mission_routes.md)
- [08 — Backend: WebSocket broadcaster](./NEW_FEATURE_08_backend_ws_broadcaster.md)

### Phase 2 — Frontend foundation
- [02 — Mission & Location model types](./NEW_FEATURE_02_model_types.md)
- [03 — Mission store (Pinia)](./NEW_FEATURE_03_mission_store.md)
- [04 — WebSocket service](./NEW_FEATURE_04_websocket_service.md)
- [05 — Mission service (frontend API)](./NEW_FEATURE_05_frontend_mission_service.md)

### Phase 3 — Mission CRUD UI
- [09 — Mission list page](./NEW_FEATURE_09_mission_list_page.md)
- [10 — Mission create page](./NEW_FEATURE_10_mission_create_page.md)
- [11 — Mission detail page](./NEW_FEATURE_11_mission_detail_page.md)
- [12 — Mission edit page](./NEW_FEATURE_12_mission_edit_page.md)

### Phase 4 — Locations & map
- [13 — Location upload component](./NEW_FEATURE_13_location_upload_component.md)
- [14 — Location upload page](./NEW_FEATURE_14_location_upload_page.md)
- [15 — Location list component](./NEW_FEATURE_15_location_list_component.md)
- [16 — Location list page](./NEW_FEATURE_16_location_list_page.md)
- [17 — Route map component](./NEW_FEATURE_17_route_map_component.md)

### Phase 5 — Tests
- [18 — E2E tests](./NEW_FEATURE_18_mission_e2e_tests.md)

---

## Reading order

1. Start with the [Epic Overview](./00_EPIC_overview.md) to understand the architecture.
2. Read features in numeric order (01 → 18) to implement sequentially.
3. Each feature document includes:
   - **Objective** — what the feature achieves
   - **Files** — what gets created
   - **Implementation Steps** — exact code & commands
   - **Definition of Done** — checklist for completion
   - **Commit Message** — ready-to-copy git message

---

## Conventions

- **File naming**: `NEW_FEATURE_NN_<kebab-case>.md`
- **Code blocks** are language-tagged for syntax highlighting.
- **Commit messages** follow Conventional Commits with scope `(mission-planner)`.
- Each feature ends with a Definition of Done checklist; copy into your PR description.
