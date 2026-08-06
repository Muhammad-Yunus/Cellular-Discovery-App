# Feature 04 — Mission store (Pinia)

| Field | Value |
|-------|-------|
| **Feature #** | 04 |
| **Title** | `app/stores/mission.ts` Pinia store |
| **Depends on** | 01, 02, 03 |
| **Blocks** | 05, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18 |

---

## 1. Objective

Persist mission state (list, selected, pagination, loading, errors, WS status) in a Pinia store, mirroring the existing `scanStore` style.

---

## 2. Files

### Create
- `app/stores/mission.ts`
- `app/stores/__tests__/missionStore.test.ts`

---

## 3. Implementation Steps

### Step 1 — Create `app/stores/mission.ts`

```ts
// app/stores/mission.ts
import { defineStore } from 'pinia'
import type {
  Mission,
  MissionPaginated,
  MissionStatus,
  MissionLocation,
  LocationPaginated
} from '~/types/mission'
import * as missionService from '~/services/missionService'

interface MissionState {
  missions: Mission[]
  selectedId: string | null
  loading: boolean
  creating: boolean
  updating: boolean
  error: string | null
  wsConnected: boolean
  wsStatus: 'connected' | 'disconnected' | 'reconnecting'
  pagination: MissionPaginated['pagination']
  search: string
  statusFilter: MissionStatus | 'all'
  sort: string
  locationSearch: string
  locationPagination: { currentPage: number; limit: number; total: number }
  selectedLocation: MissionLocation | null
}

export const useMissionStore = defineStore('mission', {
  state: (): MissionState => ({
    missions: [],
    selectedId: null,
    loading: false,
    creating: false,
    updating: false,
    error: null,
    wsConnected: false,
    wsStatus: 'disconnected',
    pagination: {
      currentPage: 1,
      limit: 10,
      totalItems: 0,
      offset: 0,
      totalPages: 0,
      searchTerm: ''
    },
    search: '',
    statusFilter: 'all',
    sort: '-created_at',
    locationSearch: '',
    locationPagination: { currentPage: 1, limit: 20, total: 0 },
    selectedLocation: null
  }),

  getters: {
    selectedMission: (state): Mission | null =>
      state.missions.find(m => m.id === state.selectedId) ?? null,

    isLoading: (state): boolean => state.loading || state.creating || state.updating
  },

  actions: {
    async fetchMissions() {
      this.loading = true
      this.error = null
      try {
        const result = await missionService.listMissions({
          page: this.pagination.currentPage,
          page_size: this.pagination.limit,
          search: this.search || undefined,
          status: this.statusFilter === 'all' ? undefined : this.statusFilter,
          sort: this.sort
        })
        this.missions = result.items
        this.pagination.totalItems = result.total
        this.pagination.totalPages = Math.ceil(result.total / this.pagination.limit)
        this.pagination.offset = (this.pagination.currentPage - 1) * this.pagination.limit
        // Keep selection if it still exists; otherwise clear.
        const stillExists = this.selectedId
          ? this.missions.some(m => m.id === this.selectedId)
          : false
        if (!stillExists) {
          this.selectedId = this.missions[0]?.id ?? null
        }
      } catch (e) {
        const { parseApiError } = await import('~/types/api')
        const appError = parseApiError(e)
        this.error = appError.message
        this.missions = []
        this.pagination.totalItems = 0
        this.pagination.totalPages = 0
      } finally {
        this.loading = false
      }
    },

    async createMission(data: { name: string; description?: string | null }) {
      this.creating = true
      this.error = null
      try {
        const mission = await missionService.createMission(data)
        this.missions.unshift(mission)
        this.pagination.totalItems += 1
        this.pagination.totalPages = Math.ceil(this.pagination.totalItems / this.pagination.limit)
        this.selectedId = mission.id
        return mission
      } catch (e) {
        const { parseApiError } = await import('~/types/api')
        const appError = parseApiError(e)
        this.error = appError.message
        throw appError
      } finally {
        this.creating = false
      }
    },

    async updateMission(id: string, data: { name?: string; description?: string | null; status?: MissionStatus }) {
      this.updating = true
      this.error = null
      try {
        const updated = await missionService.updateMission(id, data)
        const idx = this.missions.findIndex(m => m.id === id)
        if (idx >= 0) this.missions[idx] = updated
        return updated
      } catch (e) {
        const { parseApiError } = await import('~/types/api')
        const appError = parseApiError(e)
        this.error = appError.message
        throw appError
      } finally {
        this.updating = false
      }
    },

    async deleteMission(id: string) {
      this.error = null
      try {
        await missionService.deleteMission(id)
        this.missions = this.missions.filter(m => m.id !== id)
        this.pagination.totalItems -= 1
        this.pagination.totalPages = Math.ceil(this.pagination.totalItems / this.pagination.limit)
        if (this.selectedId === id) this.selectedId = null
      } catch (e) {
        const { parseApiError } = await import('~/types/api')
        const appError = parseApiError(e)
        this.error = appError.message
        throw appError
      }
    },

    async startMission(id: string) {
      const updated = await missionService.startMission(id)
      const idx = this.missions.findIndex(m => m.id === id)
      if (idx >= 0) this.missions[idx] = updated
      return updated
    },

    async pauseMission(id: string) {
      const updated = await missionService.pauseMission(id)
      const idx = this.missions.findIndex(m => m.id === id)
      if (idx >= 0) this.missions[idx] = updated
      return updated
    },

    async resumeMission(id: string) {
      const updated = await missionService.resumeMission(id)
      const idx = this.missions.findIndex(m => m.id === id)
      if (idx >= 0) this.missions[idx] = updated
      return updated
    },

    async completeMission(id: string) {
      const updated = await missionService.completeMission(id)
      const idx = this.missions.findIndex(m => m.id === id)
      if (idx >= 0) this.missions[idx] = updated
      return updated
    },

    setSelectedId(id: string | null) {
      this.selectedId = id
    },

    setSearch(search: string) {
      this.search = search
      this.pagination.currentPage = 1
      this.pagination.offset = 0
      this.fetchMissions()
    },

    setStatusFilter(status: MissionStatus | 'all') {
      this.statusFilter = status
      this.pagination.currentPage = 1
      this.pagination.offset = 0
      this.fetchMissions()
    },

    setSort(sort: string) {
      this.sort = sort
      this.pagination.currentPage = 1
      this.pagination.offset = 0
      this.fetchMissions()
    },

    setPage(page: number) {
      this.pagination.currentPage = page
      this.pagination.offset = (page - 1) * this.pagination.limit
      this.fetchMissions()
    },

    setWsConnected(connected: boolean) {
      this.wsConnected = connected
    },

    setWsStatus(status: 'connected' | 'disconnected' | 'reconnecting') {
      this.wsStatus = status
    },

    // --- Locations (within a mission) --------------------------
    async fetchLocations(missionId: string) {
      this.error = null
      try {
        const result = await missionService.listLocations(missionId, {
          page: this.locationPagination.currentPage,
          page_size: this.locationPagination.limit
        })
        // Attach to the selected mission's locations (not in top-level state for simplicity)
        const mission = this.missions.find(m => m.id === missionId)
        if (mission) {
          ;(mission as any)._locations = result.items as any
          ;(mission as any)._locationTotal = result.total
        }
        this.locationPagination.total = result.total
      } catch (e) {
        const { parseApiError } = await import('~/types/api')
        this.error = parseApiError(e).message
      }
    },

    async uploadLocationsCSV(missionId: string, file: File) {
      this.creating = true
      this.error = null
      try {
        const result = await missionService.uploadLocationsCSV(missionId, file)
        this.fetchLocations(missionId)
        return result
      } catch (e) {
        const { parseApiError } = await import('~/types/api')
        const appError = parseApiError(e)
        this.error = appError.message
        throw appError
      } finally {
        this.creating = false
      }
    },

    async deleteLocation(missionId: string, locationId: string) {
      this.error = null
      try {
        await missionService.deleteLocation(missionId, locationId)
        await this.fetchLocations(missionId)
      } catch (e) {
        const { parseApiError } = await import('~/types/api')
        this.error = parseApiError(e).message
        throw parseApiError(e)
      }
    }
  }
})
```

> **Note:** We use a private `_locations` / `_locationTotal` on the Mission object to avoid a second top-level list. This keeps the store compact while serving both list and detail pages.

### Step 2 — Unit tests `app/stores/__tests__/missionStore.test.ts`

| Test | Assertion |
|------|-----------|
| `fetchMissions populates state` | Mock `listMissions`, call `fetchMissions`, assert `missions` is set |
| `fetchMissions sets pagination` | Assert `pagination.totalItems`, `totalPages`, `offset` match mock |
| `createMission prepends & sets selectedId` | Mock `createMission`, assert `missions[0]` is the new mission and `selectedId === new.id` |
| `updateMission mutates in-place` | Mock `updateMission`, assert the mission at matching `id` is replaced |
| `deleteMission removes & clears selectedId if needed` | Delete the selected mission, assert `selectedId` is null |
| `setSearch resets pagination & refetches` | Assert `pagination.currentPage === 1` and service was called |
| `setStatusFilter resets pagination` | Same as above |
| `setWsConnected updates wsConnected` | Direct action call, assert value |
| `uploadLocationsCSV calls service & refreshes` | Mock service, call `uploadLocationsCSV`, assert service called & locations refreshed |

---

## 4. Definition of Done

- [ ] `app/stores/mission.ts` exports `useMissionStore`.
- [ ] Unit tests pass.
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm build` green.
- [ ] Commit message: `feat(mission-planner): add mission Pinia store (#04)`

---

## 5. Commit Message

```
feat(mission-planner): add mission Pinia store (#04)

- Create app/stores/mission.ts with useMissionStore
- Actions: fetchMissions, createMission, updateMission, deleteMission
- Actions: startMission, pauseMission, resumeMission, completeMission
- Actions: setSearch, setStatusFilter, setSort, setPage
- Actions: uploadLocationsCSV, deleteLocation
- Selectors: selectedMission, isLoading
- Add unit tests for missionStore
```