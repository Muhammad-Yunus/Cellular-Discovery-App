# FEATURE: Types & Services Layer
**Epic:** #2
**Depends on:** #1 Project Setup
**Status:** Pending

## User Story
Sebagai frontend, saya ingin memiliki TypeScript interfaces dan service layer yang mirror backend Pydantic models, sehingga komponen dan store dapat berkomunikasi dengan API secara type-safe.

## Acceptance Criteria
- [ ] Semua TypeScript interfaces terdefinisi di `types/index.ts` mirroring backend schemas
- [ ] `services/scan.service.ts` membungkus endpoint POST/GET/DELETE `/scans`
- [ ] `services/settings.service.ts` membungkus endpoint GET/PUT `/settings`
- [ ] `services/system.service.ts` membungkus endpoint GET `/health`
- [ ] All services menggunakan Nuxt `$fetch` dengan base URL dari env
- [ ] Semua fungsi service memiliki tipe return yang jelas
- [ ] Error handling di service layer (catch, format, re-throw)

## Tasks
- [ ] Buat `types/index.ts` dengan interfaces: ScanResponse, ScanSummary, ScanCreate, ScanPaginated, Setting, SystemHealth, GPSData, WSEvent
- [ ] Buat `types/api.ts` dengan type untuk API response wrapper dan error format
- [ ] Buat `services/scan.service.ts`: createScan(), getScans(), getScanById(), deleteScan()
- [ ] Buat `services/settings.service.ts`: getSettings(), updateSettings()
- [ ] Buat `services/system.service.ts`: getHealth(), checkCLIStatus()
- [ ] Implementasi base URL dari runtimeConfig.public.apiBase
- [ ] Implementasi error parser: network vs validation vs server errors
- [ ] Unit test semua service dengan vi.mock($fetch)

## Components Touched
- services/scan.service.ts
- services/settings.service.ts
- services/system.service.ts
- types/index.ts
- types/api.ts

## Definition of Done (from AGENT.md)
- [ ] implementation finished
- [ ] typed
- [ ] documented
- [ ] reusable
- [ ] follows folder structure
- [ ] follows technology constraints
- [ ] passes lint
- [ ] passes unit tests
- [ ] contains no duplicated logic
- [ ] contains no hardcoded backend URL
- [ ] code reviewed

## Technical Notes
- Base URL dari `useRuntimeConfig().public.apiBase` — JANGAN hardcode
- Service functions return Promise<T> dengan error handling
- Error format backend: `{ "detail": "error message" }`
- Network errors: catch, wrap jadi `NetworkError`, `BackendOffline`, dll.
- Gunakan AbortController untuk cancel request jika perlu
