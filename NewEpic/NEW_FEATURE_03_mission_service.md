# Feature 03 — Mission service (`app/services/missionService.ts`)

| Field | Value |
|-------|-------|
| **Feature #** | 03 |
| **Title** | Mission HTTP service layer |
| **Depends on** | 01, 02 |
| **Blocks** | 04, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18 |

---

## 1. Objective

Wrap all mission REST endpoints using `missionApiRequest` (from Feature 01). No business logic — only HTTP translation.

---

## 2. Files

### Create
- `app/services/missionService.ts`

### Modify
- `app/services/__tests__/missionService.test.ts` (new unit test file)

---

## 3. API endpoints used

| Method | Path | Service function |
|--------|------|------------------|
| GET | `/missions` | `listMissions` |
| POST | `/missions` | `createMission` |
| GET | `/missions/{id}` | `getMission` |
| PATCH | `/missions/{id}` | `updateMission` |
| DELETE | `/missions/{id}` | `deleteMission` |
| POST | `/missions/{id}/start` | `startMission` |
| POST | `/missions/{id}/pause` | `pauseMission` |
| POST | `/missions/{id}/resume` | `resumeMission` |
| POST | `/missions/{id}/complete` | `completeMission` |
| GET | `/missions/{id}/locations` | `listLocations` |
| POST | `/missions/{id}/locations/upload` | `uploadLocationsCSV` |
| GET | `/missions/{id}/locations/{locId}` | `getLocation` |
| DELETE | `/missions/{id}/locations/{locId}` | `deleteLocation` |
| GET | `/missions/{id}/scans` | `listMissionScans` |
| GET | `/missions/{id}/scans/export.csv` | `exportMissionScans` |

---

## 4. Implementation Steps

### Step 1 — Create `app/services/missionService.ts`

```ts
// app/services/missionService.ts
import type {
  Mission,
  MissionCreate,
  MissionUpdate,
  MissionPaginated,
  MissionLocation,
  LocationPaginated,
  ListMissionsParams,
  ListLocationsParams,
  MissionStatus,
  CSVUploadResult
} from '~/types/mission'
import { missionApiRequest } from './missionApi'

export async function listMissions(params?: ListMissionsParams): Promise<MissionPaginated> {
  return missionApiRequest<MissionPaginated>('/missions', {
    params: {
      page: params?.page ?? 1,
      page_size: params?.page_size ?? 10,
      search: params?.search,
      status: params?.status ? (params.status === 'all' ? undefined : params.status) : undefined,
      sort: params?.sort
    }
  })
}

export async function createMission(data: MissionCreate): Promise<Mission> {
  return missionApiRequest<Mission>('/missions', { method: 'POST', body: data })
}

export async function getMission(id: string): Promise<Mission> {
  return missionApiRequest<Mission>(`/missions/${id}`)
}

export async function updateMission(id: string, data: MissionUpdate): Promise<Mission> {
  return missionApiRequest<Mission>(`/missions/${id}`, { method: 'PATCH', body: data })
}

export async function deleteMission(id: string): Promise<void> {
  await missionApiRequest<void>(`/missions/${id}`, { method: 'DELETE' })
}

export async function startMission(id: string): Promise<Mission> {
  return missionApiRequest<Mission>(`/missions/${id}/start`, { method: 'POST' })
}

export async function pauseMission(id: string): Promise<Mission> {
  return missionApiRequest<Mission>(`/missions/${id}/pause`, { method: 'POST' })
}

export async function resumeMission(id: string): Promise<Mission> {
  return missionApiRequest<Mission>(`/missions/${id}/resume`, { method: 'POST' })
}

export async function completeMission(id: string): Promise<Mission> {
  return missionApiRequest<Mission>(`/missions/${id}/complete`, { method: 'POST' })
}

export async function listLocations(
  missionId: string,
  params?: ListLocationsParams
): Promise<LocationPaginated> {
  return missionApiRequest<LocationPaginated>(`/missions/${missionId}/locations`, {
    params: {
      page: params?.page ?? 1,
      page_size: params?.page_size ?? 20,
      sort: params?.sort
    }
  })
}

export async function uploadLocationsCSV(
  missionId: string,
  file: File
): Promise<CSVUploadResult> {
  const formData = new FormData()
  formData.append('file', file)
  return missionApiRequest<CSVUploadResult>(`/missions/${missionId}/locations/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'multipart/form-data' },
    body: formData
  })
}

export async function getLocation(missionId: string, locationId: string): Promise<MissionLocation> {
  return missionApiRequest<MissionLocation>(
    `/missions/${missionId}/locations/${locationId}`
  )
}

export async function deleteLocation(missionId: string, locationId: string): Promise<void> {
  await missionApiRequest<void>(
    `/missions/${missionId}/locations/${locationId}`,
    { method: 'DELETE' }
  )
}

export async function listMissionScans(
  missionId: string,
  params?: {
    page?: number
    page_size?: number
    search?: string
    rat?: string
    sort?: string
  }
): Promise<any> {
  // The scans endpoint is shared with the legacy scan service; we return any
  // because the exact shape isn't known at this writing and will be refined
  // alongside the backend. Callers cast to their own type.
  return missionApiRequest<any>(`/missions/${missionId}/scans`, {
    params: {
      page: params?.page ?? 1,
      page_size: params?.page_size ?? 10,
      search: params?.search,
      rat: params?.rat,
      sort: params?.sort
    }
  })
}

export async function exportMissionScans(missionId: string): Promise<Blob> {
  return missionApiRequest<Blob>(`/missions/${missionId}/scans/export.csv`, {
    response: 'blob' as any
  })
}
```

> **Note:** The service uses `import type` where possible to avoid runtime circular deps.

### Step 2 — Add unit tests `app/services/__tests__/missionService.test.ts`

| Test | Assertion |
|------|-----------|
| `listMissions calls /missions with page & page_size` | Stub `missionApiRequest`, call `listMissions({ page: 2, page_size: 20 })`, assert URL `/missions` with expected params |
| `createMission calls POST /missions` | Assert method:POST, body: `{ name: 'Test' }` |
| `uploadLocationsCSV builds FormData` | Assert `Content-Type` is multipart, body is `FormData` instance |
| `deleteMission calls DELETE /missions/{id}` | Assert URL and method |
| `exportMissionScans requests blob` | Assert response type is blob (use a mock that returns a Blob) |
| `startMission, pauseMission, resumeMission, completeMission` | Assert each POSTs to the correct sub-path |

---

## 5. Definition of Done

- [ ] `app/services/missionService.ts` exports all listed functions.
- [ ] Unit tests pass.
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm build` green.
- [ ] No conflicts with existing `scan.service.ts` or `api.ts`.
- [ ] Commit message: `feat(mission-planner): add mission service layer (#03)`

---

## 6. Commit Message

```
feat(mission-planner): add mission service layer (#03)

- Create app/services/missionService.ts
- Export: listMissions, createMission, getMission, updateMission, deleteMission
- Export: startMission, pauseMission, resumeMission, completeMission
- Export: listLocations, uploadLocationsCSV, getLocation, deleteLocation
- Export: listMissionScans, exportMissionScans
- Add unit tests for missionService
```