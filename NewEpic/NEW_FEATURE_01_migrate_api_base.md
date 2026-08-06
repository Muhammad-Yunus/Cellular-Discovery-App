# Feature 01 — Migrate API base to port 8001

| Field | Value |
|-------|-------|
| **Feature #** | 01 |
| **Title** | Migrate all API traffic to port 8001 |
| **Depends on** | — (root feature) |
| **Blocks** | 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18 |

---

## 1. Objective

All frontend API calls — both legacy scan endpoints and new mission-planner endpoints — must hit the **single backend on port 8001**. There is no separate "legacy" backend on port 8000.

After this feature:

- `NUXT_PUBLIC_API_BASE` resolves to `http://192.168.1.108:8001/api/v1` and is used by **all** service helpers (`app/services/api.ts`, `app/services/missionApi.ts`, etc.).
- `NUXT_PUBLIC_HEALTH_BASE` resolves to `http://192.168.1.108:8001` and is used by the health-check endpoint.
- There is **no** `NUXT_PUBLIC_API_BASE_MISSIONS` or `apiBaseMissions` runtime config — one base URL covers every endpoint.

---

## 2. Files

### Modify
- `nuxt.config.ts` — ensure `apiBase` and `healthBase` default to port 8001.
- `.env.example` — document the two variables only (no `API_BASE_MISSIONS`).

---

## 3. API

No new endpoints — this is purely a configuration change. All routes remain under the single `/api/v1` namespace on port 8001.

---

## 4. Implementation Steps

### Step 1 — `nuxt.config.ts`

Ensure the public runtime config uses port 8001 as the default:

```ts
runtimeConfig: {
  public: {
    apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://192.168.1.108:8001/api/v1',
    healthBase: process.env.NUXT_PUBLIC_HEALTH_BASE || 'http://192.168.1.108:8001',
    appName: process.env.NUXT_PUBLIC_APP_NAME || 'Cellular Discovery',
    defaultLat: process.env.NUXT_PUBLIC_DEFAULT_LAT || '-6.150676643667096',
    defaultLon: process.env.NUXT_PUBLIC_DEFAULT_LON || '106.89665223346297'
  }
}
```

No `apiBaseMissions` key is added — everything shares `apiBase`.

### Step 2 — `.env.example`

```
NUXT_PUBLIC_API_BASE=http://192.168.1.108:8001/api/v1
NUXT_PUBLIC_HEALTH_BASE=http://192.168.1.108:8001
```

---

## 5. Unit Tests (Vitest)

File: `app/services/__tests__/missionApi.test.ts`

| Test | Assertion |
|------|-----------|
| `getMissionApiBaseURL returns configured apiBase` | Mock runtimeConfig to return `http://localhost:8001/api/v1`, expect that exact string |
| `getMissionApiBaseURL falls back to empty string when no config` | Clear override, force runtimeConfig throw, expect empty string |
| `missionApiRequest builds URL with query params` | Stub `$fetch`, call with params, assert URL contains query string |
| `missionApiRequest omits empty params` | `params: { page: 1, search: '' }`, assert `search` not present |
| `missionApiRequest propagates fetch errors` | `$fetch` rejects, assert the error bubbles (no swallowing) |

Use the existing `tests/setup.ts` mocking conventions.

---

## 6. E2E Tests (Playwright)

Not required for this feature (configuration only). The e2e suite in Feature 18 validates the base URL indirectly.

---

## 7. Definition of Done

- [ ] `nuxt.config.ts` exposes `apiBase` and `healthBase` reading from env vars, defaulting to port 8001.
- [ ] `.env.example` documents `NUXT_PUBLIC_API_BASE` and `NUXT_PUBLIC_HEALTH_BASE` only.
- [ ] No `NUXT_PUBLIC_API_BASE_MISSIONS` or `apiBaseMissions` exists anywhere.
- [ ] `app/services/missionApi.ts` resolves base URL from `config.public.apiBase`.
- [ ] Unit tests for `missionApi.ts` pass.
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm build` green.
- [ ] No existing test fails.
- [ ] Commit message: `feat(mission-planner): migrate all API endpoints to port 8001 (#01)`

---

## 8. Commit Message

```
feat(mission-planner): migrate all API endpoints to port 8001 (#01)

- Set NUXT_PUBLIC_API_BASE default to http://192.168.1.108:8001/api/v1
- Set NUXT_PUBLIC_HEALTH_BASE default to http://192.168.1.108:8001
- Remove NUXT_PUBLIC_API_BASE_MISSIONS / apiBaseMissions entirely
- All services (scan + mission) share the same apiBase
- Update .env.example accordingly
```
