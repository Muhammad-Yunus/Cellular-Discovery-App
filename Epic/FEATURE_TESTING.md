# FEATURE: Testing (Unit & E2E)
**Epic:** #15
**Depends on:** All Epics (final validation layer)
**Status:** Pending

## User Story
Sebagai developer, saya ingin memiliki test suite yang komprehensif (unit + E2E) sehingga saya bisa memvalidasi bahwa aplikasi berfungsi dengan benar dan tidak ada regression.

## Acceptance Criteria
- [ ] Vitest terkonfigurasi dengan jsdom environment
- [ ] @vue/test-utils terinstall untuk component testing
- [ ] Pinia testing: setActivePinia(createPinia()) untuk setiap test
- [ ] Service mocking: vi.mock() untuk $fetch di service layer
- [ ] Component tests: render, props, events, slots, snapshots
- [ ] Store tests: state mutations, actions, getters
- [ ] Composable tests: lifecycle, error handling
- [ ] Page integration tests (optional — bisa berat)
- [ ] Playwright E2E tests (basic flow): navigate, sidebar, scan workflow, settings, history
- [ ] Test coverage reporting (optional)
- [ ] All tests pass dengan `pnpm test`

## Tasks
- [ ] Setup Vitest config (`vitest.config.ts`):
  - environment: jsdom
  - global: true (for describe/it/expect)
  - deps optimizer for @nuxt/ui
- [ ] Setup test utils in `tests/` folder:
  - `tests/setup.ts` — global mocks (Leaflet, WebSocket, ResizeObserver, etc.)
  - `tests/helpers.ts` — reusable render functions (with Pinia, with router)
- [ ] Unit tests untuk Epic #2 (Services):
  - scan.service.test.ts
  - settings.service.test.ts
  - system.service.test.ts
- [ ] Unit tests untuk Epic #3 (Stores):
  - scanStore.test.ts
  - gpsStore.test.ts
  - settingsStore.test.ts
  - systemStore.test.ts
  - uiStore.test.ts
- [ ] Unit tests untuk Epic #3 (Composables):
  - useScan.test.ts
  - useGPS.test.ts
  - useSettings.test.ts
  - useSystem.test.ts
  - useMap.test.ts (mock Leaflet)
- [ ] Unit tests untuk Epic #4 (Layout & Navigation):
  - AppNavbar.test.ts
- [ ] Unit tests untuk Epic #5 (Map):
  - MapView.test.ts
  - MapMarker.test.ts
- [ ] Unit tests untuk Epic #6 (Sidebar):
  - Sidebar.test.ts
  - HistoryList.test.ts
  - HistoryCard.test.ts
  - SearchBox.test.ts
  - FilterPanel.test.ts
- [ ] Unit tests untuk Epic #7 (Bottom Panel):
  - BottomPanel.test.ts
  - SignalPanel.test.ts
  - GPSPanel.test.ts
  - SystemPanel.test.ts
- [ ] Unit tests untuk Epic #8 (Scan Workflow):
  - LoadingOverlay.test.ts
  - StatusBadge.test.ts
  - ConfirmationDialog.test.ts
- [ ] Unit tests untuk Epic #11 (Home Page):
  - index.vue integration test
- [ ] Unit tests untuk Epic #12 (Settings Page):
  - settings.vue test
- [ ] Unit tests untuk Epic #13 (History Page):
  - history.vue test
- [ ] Unit tests untuk Epic #14 (About Page):
  - about.vue test
- [ ] Setup Playwright (`playwright.config.ts`):
  - Install Playwright browsers
  - Basic E2E spec: `/` loads, sidebar visible, navbar links work
  - E2E scan workflow (mock backend)
  - E2E settings page
  - E2E history page + pagination
- [ ] Setup `pnpm test:e2e` script
- [ ] Verifikasi semua test pass

## Components Touched
- tests/ (all files)
- vitest.config.ts
- playwright.config.ts
- package.json (scripts)

## Definition of Done (from AGENT.md)
- [ ] implementation finished
- [ ] typed
- [ ] documented
- [ ] follows folder structure
- [ ] follows technology constraints
- [ ] passes lint
- [ ] passes unit tests
- [ ] contains no duplicated logic
- [ ] code reviewed

## Technical Notes
- Vitest: `pnpm add -D vitest @vue/test-utils jsdom`
- Playwright: `pnpm add -D @playwright/test && pnpm exec playwright install`
- Global mocks needed: Leaflet (L), WebSocket, ResizeObserver, IntersectionObserver
- Component test pattern:
  ```ts
  import { mount } from '@vue/test-utils'
  import { describe, it, expect } from 'vitest'
  import MyComponent from './MyComponent.vue'

  describe('MyComponent', () => {
    it('renders', () => {
      const wrapper = mount(MyComponent, { props: { ... } })
      expect(wrapper.text()).toContain('...')
    })
  })
  ```
- Store test pattern:
  ```ts
  import { setActivePinia, createPinia } from 'pinia'
  import { useScanStore } from '~/stores/scanStore'

  describe('scanStore', () => {
    beforeEach(() => setActivePinia(createPinia()))

    it('initial state', () => {
      const store = useScanStore()
      expect(store.scans).toEqual([])
    })
  })
  ```
- Service test: mock Nuxt $fetch via vi.mock('nuxt/app') or useNuxtApp
- E2E: mock API dengan Playwright route interception (`page.route('**/api/v1/**', ...)`)
- Coverage: `pnpm vitest --coverage` jika dibutuhkan
- Pastikan test tidak bergantung pada backend real — semua harus mock
