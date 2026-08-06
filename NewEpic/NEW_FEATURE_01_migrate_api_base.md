# Feature 01 — Migrate API base to port 8001 + add `apiBaseMissions`

| Field | Value |
|-------|-------|
| **Feature #** | 01 |
| **Title** | Migrate API base to port 8001 and add mission base URL |
| **Depends on** | — (root feature) |
| **Blocks** | 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18 |

---

## 1. Objective

Per user request, **all** mission-related API calls must hit the **new backend on port 8001**, not the legacy port 8000.

Today, everything in the frontend points to `NUXT_PUBLIC_API_BASE` (default `http://localhost:8000/api/v1`). After this feature:

- A new runtime config `apiBaseMissions` resolves from `NUXT_PUBLIC_API_BASE_MISSIONS` and defaults to `http://192.168.1.108:8001/api/v1`.
- The legacy `apiBase` continues to point at the scan-only backend (port 8000). It is **not** removed — the scan/history pages still use it.
- A new `missionApiRequest` helper resolves to `apiBaseMissions` for mission endpoints.
- `useMissionWebSocket` (Feature 05) uses a new `buildMissionWsUrl` to translate `apiBaseMissions` into a `ws://` URL.

This feature intentionally does **not** touch `scan.service.ts`, `history.vue`, `index.vue`, or any scan-related code.

---

## 2. Files

### Modify
- `nuxt.config.ts` — add `apiBaseMissions` public runtime config.
- `.env.example` — document `NUXT_PUBLIC_API_BASE_MISSIONS` (port 8001).

### Create
- `app/services/missionApi.ts` — `resolveMissionBaseURL`, `missionApiRequest`.

> Do **not** modify `app/services/api.ts` — the legacy helper stays unchanged.

---

## 3. API

No new endpoints — this is purely a frontend configuration change.

---

## 4. Implementation Steps

### Step 1 — `nuxt.config.ts`

Add `apiBaseMissions` next to `apiBase`:

```ts
runtimeConfig: {
  public: {
    apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8000/api/v1',
    healthBase: process.env.NUXT_PUBLIC_HEALTH_BASE || 'http://localhost:8000',
    appName: process.env.NUXT_PUBLIC_APP_NAME || 'Cellular Discovery',
    defaultLat: process.env.NUXT_PUBLIC_DEFAULT_LAT || '-6.150676643667096',
    defaultLon: process.env.NUXT_PUBLIC_DEFAULT_LON || '106.89665223346297',
    // NEW — mission planner backend (port 8001)
    apiBaseMissions:
      process.env.NUXT_PUBLIC_API_BASE_MISSIONS
      || 'http://192.168.1.108:8001/api/v1'
  }
}
```

### Step 2 — `.env.example`

Append:

```
# Mission planner backend (NEW API on port 8001)
NUXT_PUBLIC_API_BASE_MISSIONS=http://192.168.1.108:8001/api/v1
```

### Step 3 — `app/services/missionApi.ts`

Mirror the legacy `api.ts` pattern, but resolve `apiBaseMissions`:

```ts
// app/services/missionApi.ts
let _missionBaseOverride: string | null = null

export function setMissionBaseURL(url: string) {
  _missionBaseOverride = url
}

export function resolveMissionBaseURL(): string {
  if (_missionBaseOverride) return _missionBaseOverride
  try {
    const config = useRuntimeConfig()
    return (config.public.apiBaseMissions as string)
      || 'http://192.168.1.108:8001/api/v1'
  } catch {
    // Outside Nuxt context (unit tests, SSR partial hydration).
    return 'http://192.168.1.108:8001/api/v1'
  }
}

export async function missionApiRequest<T>(
  endpoint: string,
  options?: RequestInit & { params?: Record<string, string | number | undefined> }
): Promise<T> {
  const baseURL = resolveMissionBaseURL()
  const url = new URL(`${baseURL}${endpoint}`)

  if (options?.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value))
      }
    })
  }

  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string>),
    'Content-Type': 'application/json'
  }

  const { params: _, ...fetchOptions } = options ?? {}
  const response = await $fetch(url.toString(), {
    ...fetchOptions,
    headers,
    retry: false
  })

  return response as T
}
```

### Step 4 — WebSocket URL helper (used later by Feature 05)

The legacy `utils/websocket.ts` `buildWsUrl` already accepts any `apiBase` string and strips `/api/v1` correctly. Feature 05 will call it with `apiBaseMissions`; no changes here in this feature.

---

## 5. Unit Tests (Vitest)

File: `app/services/__tests__/missionApi.test.ts`

| Test | Assertion |
|------|-----------|
| `resolveMissionBaseURL returns default 8001 when no override` | Sets `_missionBaseOverride = null`, ensures runtimeConfig throws, expect default `http://192.168.1.108:8001/api/v1` |
| `setMissionBaseURL overrides resolution` | Override to `http://test.local:9999/api/v1`, expect that exact string |
| `missionApiRequest builds URL with query params` | Stub `$fetch`, call `missionApiRequest('/missions', { params: { page: 2, page_size: 5 } })`, assert URL is `…/api/v1/missions?page=2&page_size=5` |
| `missionApiRequest omits empty params` | `params: { page: 1, search: '' }`, assert `search` not present |
| `missionApiRequest propagates fetch errors` | `$fetch` rejects, assert the error bubbles (no swallowing) |

Use the existing `tests/setup.ts` mocking conventions.

---

## 6. E2E Tests (Playwright)

Not required for this feature (configuration only). The e2e suite in Feature 18 indirectly validates `apiBaseMissions`.

Add a **smoke test** later in Feature 18:

- `tests/e2e/missions/api-base.spec.ts` — Navigate to `/missions`, intercept the request, assert URL host is `192.168.1.108:8001` (configurable per env).

---

## 7. Definition of Done

- [ ] `nuxt.config.ts` exposes `apiBaseMissions` reading `NUXT_PUBLIC_API_BASE_MISSIONS`.
- [ ] `.env.example` documents the new variable.
- [ ] `app/services/missionApi.ts` exports `resolveMissionBaseURL`, `setMissionBaseURL`, `missionApiRequest`.
- [ ] Unit tests for `missionApi.ts` pass.
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm build` green.
- [ ] No existing test fails (legacy `api.ts` untouched).
- [ ] Commit message: `feat(mission-planner): add mission API base config on port 8001 (#01)`

---

## 8. Commit Message

```
feat(mission-planner): add mission API base config on port 8001 (#01)

- Add NUXT_PUBLIC_API_BASE_MISSIONS runtime config (default http://192.168.1.108:8001/api/v1)
- Add app/services/missionApi.ts with missionApiRequest helper
- Update .env.example with the new variable
- Add unit tests for missionApi
- No changes to legacy scan API (port 8000) — backwards compatible
```