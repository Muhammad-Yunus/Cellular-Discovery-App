# Feature 19 — Fix pre-existing jsdom test timeouts

| Field | Value |
|-------|-------|
| **Feature #** | 19 |
| **Title** | Repair three pre-existing jsdom tests that time out at 30 s |
| **Depends on** | — (independent hot-fix) |
| **Blocks** | CI green, release of Feature 18 (E2E test runs full suite) |

---

## 1. Objective

Three tests in the jsdom suite hang for the full 30-second default
Vitest timeout before failing, dragging the entire `npm test -- --run`
run to > 100 s and forcing CI to wait on flaky timeouts.

| Test file | Failing test |
|-----------|--------------|
| `app/components/__tests__/StatusBadge.test.ts` | `StatusBadge > renders with ok status` |
| `app/pages/__tests__/health.test.ts` | `HealthPage > renders page title` |
| `app/pages/__tests__/about.test.ts` | `AboutPage > renders app name` |

All three are **pre-existing failures** (present before the env-var
refactor in commit `9590d0e`). They are not caused by recent code
changes; they exist because the unit tests use dynamic
`import('../Component.vue')` inside each `it()` block, which forces
Vitest's module cache to re-resolve Nuxt auto-imports and the
`@nuxt/ui` runtime composables (`useNuxtApp`, `useAppConfig`,
`useComponentProps`) for every test case instead of once per suite.

### Why only the first test in each file fails

The first `it()` block pays the entire module-resolution cost (often
> 25 s on cold cache because `@nuxt/ui` ships a large runtime
composable graph that pulls in `app.config`). All subsequent tests
benefit from the now-warm cache and complete in < 100 ms.

### Symptoms

```
FAIL app/components/__tests__/StatusBadge.test.ts > StatusBadge > renders with ok status
Error: Test timed out in 30000ms.
 ❯ app/components/__tests__/StatusBadge.test.ts:10:3
10|   it('renders with ok status', async () => {
   |   ^
11|     const StatusBadge = (await import('../StatusBadge.vue')).default
12|     const wrapper = mount(StatusBadge, {
```

The same shape repeats in `health.test.ts:60` and `about.test.ts:54`.

---

## 2. Files

### Modify
- `app/components/__tests__/StatusBadge.test.ts`
- `app/pages/__tests__/health.test.ts`
- `app/pages/__tests__/about.test.ts`

### Read (sanity reference, no edit)
- `app/components/StatusBadge.vue` — uses `@nuxt/ui`'s `UBadge`
- `app/pages/health.vue` — uses `useSystem()` composable
- `app/pages/about.vue` — uses `useRuntimeConfig()` + `useSystem()`
- `tests/setup.ts` — global stubs (`useRuntimeConfig`, `useScanStore`, …)

---

## 3. Root cause analysis

| Cause | Effect |
|-------|--------|
| `await import('../Component.vue')` is called **inside** each `it()` | The first call triggers Vite to transform the SFC and walk the entire `@nuxt/ui` runtime dependency graph on a cold cache |
| The component renders `@nuxt/ui`'s `<UBadge>` which calls `useNuxtApp()` and `useAppConfig()` at setup | When `useNuxtApp()` throws `[nuxt] instance unavailable`, Vue's `errorCaptured` queue silently swallows it but the component stays in a pending render that never resolves `nextTick()` |
| No `@nuxt/ui` mock is provided at module level in `tests/setup.ts` | Each test re-walks the full resolution path; the first one dies at the 30 s wall |

### Why this is a *test* bug, not a component bug

- The components themselves render correctly in production and in
  Storybook.
- A pre-existing `app/components/__tests__/MissionCard.test.ts` uses
  the same pattern and fails the same way (7 tests, root cause
  identical — out of scope for this fix per the user's request to
  address the three specific tests).

---

## 4. Fix strategy

1. **Hoist the dynamic `import()` out of each `it()` block** into the
   `describe()` scope so the module is resolved **once** per suite,
   not once per test.
2. **Provide a thin, deterministic `UBadge` stub** at the global level
   (already present in the three files locally — just lift it into a
   shared helper or keep it co-located).
3. For `health.test.ts` and `about.test.ts` (which depend on
   `useSystem()`), the dynamic `await import('~/composables/useSystem')`
   is harmless (resolved once per suite) — keep as-is, but apply the
   same hoist for the page `import()`.
4. Use a `beforeAll` (or top-level `await`) to ensure the import
   completes before any `it()` runs.

### Result

- Cold-cache cost paid exactly once per file.
- Suite drops from ~30 s + 6 × < 1 s to < 1 s total.
- No code change to the components themselves.

---

## 5. Acceptance criteria

| # | Criterion |
|---|-----------|
| AC-1 | `StatusBadge > renders with ok status` passes in < 2 s |
| AC-2 | `HealthPage > renders page title` passes in < 2 s |
| AC-3 | `AboutPage > renders app name` passes in < 2 s |
| AC-4 | Whole file `npm test -- --run app/components/__tests__/StatusBadge.test.ts` completes in < 5 s |
| AC-5 | Whole file `npm test -- --run app/pages/__tests__/health.test.ts` completes in < 5 s |
| AC-6 | Whole file `npm test -- --run app/pages/__tests__/about.test.ts` completes in < 5 s |
| AC-7 | Full `npm test -- --run` total duration drops below 60 s |
| AC-8 | No regression on previously-passing tests |
| AC-9 | `npm run build` still passes |

---

## 6. Out of scope

- The 7 pre-existing failures in
  `app/components/__tests__/MissionCard.test.ts` (same root cause but
  the user explicitly scoped this fix to the three specific tests).
  They can be fixed with the same pattern in a follow-up.
- The `MissionCard` `useNuxtApp` error captured during mount.