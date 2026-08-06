# Feature 18 — E2E tests for the Mission Planner

| Field | Value |
|-------|-------|
| **Feature #** | 18 |
| **Title** | Mission Planner E2E tests |
| **Depends on** | 01–17 |
| **Blocks** | — (final feature) |

---

## 1. Objective

End-to-end tests for all mission flows using Playwright, ensuring:

- Mission list, create, edit, delete.
- Mission lifecycle: start, pause, resume, complete.
- Location upload (valid + invalid CSVs).
- Location list with delete.
- Route map renders markers.
- WebSocket-driven status updates (mocked).

---

## 2. Files

### Create
- `tests/e2e/missions/list.spec.ts`
- `tests/e2e/missions/create.spec.ts`
- `tests/e2e/missions/detail.spec.ts`
- `tests/e2e/missions/edit.spec.ts`
- `tests/e2e/missions/locations.spec.ts`
- `tests/e2e/missions/websocket.spec.ts`

---

## 3. Test Scenarios

### 3.1 `list.spec.ts` — Mission list

| Scenario | Steps |
|----------|-------|
| Renders empty state with CTA | Navigate to `/missions` (no missions yet), assert "No missions yet" and "Create mission" button present |
| Renders list after creating | Create a mission via API or UI, assert the card appears |
| Search filters list | Type a name, assert matching mission shown |
| Status filter filters list | Pick "active" status, assert only active missions shown |
| Sort changes order | Toggle sort, assert order matches |
| Pagination loads more | Set limit to 1, assert page 2 loads |

### 3.2 `create.spec.ts` — Mission create

| Scenario | Steps |
|----------|-------|
| Creates mission on valid form | Fill name + description, submit, assert navigate to detail page |
| Rejects empty name | Submit with empty name, assert validation error shown |
| Shows error on server failure | Mock server error, assert toast shown |

### 3.3 `detail.spec.ts` — Mission detail

| Scenario | Steps |
|----------|-------|
| Renders all 5 tabs | Navigate to `/missions/{id}`, assert 5 tab panels exist |
| Start button visible for draft | Assert start button present, click, assert status changes to active |
| Pause button visible for active | Assert pause button, click, assert paused |
| Resume button visible for paused | Assert resume, assert active |
| Complete button visible for active/paused | Assert complete, assert completed status |
| WebSocket updates status | Mock WS event `mission.status_changed` → assert card updates |

### 3.4 `edit.spec.ts` — Mission edit

| Scenario | Steps |
|----------|-------|
| Pre-fills form | Open edit page, assert name/description match |
| Saves changes | Change name, save, assert navigates back & name updated |
| Rejects empty name | Submit empty name, assert validation error |

### 3.5 `locations.spec.ts` — Location upload & list

| Scenario | Steps |
|----------|-------|
| Upload valid CSV | Upload `valid.csv`, assert toast success, assert locations appear in table |
| Upload invalid CSV | Upload `invalid.csv`, assert errors shown |
| Delete location | Click delete on a row, assert row removed |
| CSV export | Click export CSV, assert Blob download |

### 3.6 `websocket.spec.ts` — Live updates

| Scenario | Steps |
|----------|-------|
| Status change updates card | Mock `mission.status_changed` event, assert UI updated |
| Scan collected updates count | Mock `mission.scan_collected` with `scan_count: 5`, assert card shows 5 |
| Location uploaded updates count | Mock `mission.location_uploaded` with `location_count: 3`, assert card shows 3 |
| Connection lost shows reconnecting | Mock disconnect, assert UI shows reconnecting indicator |

---

## 4. Mocking strategy

- Use `nuxt.config.ts`'s `proxy` or `fetch` interceptors to stub API calls.
- For WebSocket, mock `ReconnectingWebSocket` in the test environment (replace with a spy that emits `onMessage` calls).
- Seed missions via the API before each test.

---

## 5. Definition of Done

- [ ] All 6 E2E spec files exist.
- [ ] All scenarios pass with `pnpm test:e2e`.
- [ ] Mocking works for both API and WebSocket.
- [ ] `pnpm test:run` (unit) passes.
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm build` green.
- [ ] Commit message: `test(mission-planner): add E2E tests for mission planner (#18)`

---

## 6. Commit Message

```
test(mission-planner): add E2E tests for mission planner (#18)

- Create tests/e2e/missions/list.spec.ts
- Create tests/e2e/missions/create.spec.ts
- Create tests/e2e/missions/detail.spec.ts
- Create tests/e2e/missions/edit.spec.ts
- Create tests/e2e/missions/locations.spec.ts
- Create tests/e2e/missions/websocket.spec.ts
- Mock API & WebSocket for tests
- All scenarios pass
```