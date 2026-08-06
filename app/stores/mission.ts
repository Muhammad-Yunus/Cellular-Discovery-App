// app/stores/mission.ts
//
// New collector-backend store (Feature 02+) that coexists with the legacy
// `missionStore.ts`. This store uses the simplified 5-state lifecycle
// (`MissionStatus5`) and mission/location types defined in `~/types/mission`,
// and calls the collector service layer (`~/services/missionService`)
// functions whose names are prefixed with `collector`.
//
// Pages consuming this store:
//   - pages/missions/index.vue
//   - pages/missions/[id].vue
//   - pages/missions/[id]/edit.vue
//
// The existing `missionStore.ts` remains in place so legacy pages continue
// to work unchanged. Consumers should pick the store that matches the API
// surface they target.

import { defineStore } from 'pinia'
import type {
  MissionRecord,
  MissionStatus5,
  MissionLocation,
  MissionLocationCreate
} from '~/types/mission'
import type { PaginationMeta } from '~/types'
import * as missionService from '~/services/missionService'

interface MissionState {
  missions: MissionRecord[]
  selectedMissionId: string | null
  loading: boolean
  creating: boolean
  saving: boolean
  deleting: boolean
  error: string | null
  loadingMore: boolean
  search: string
  statusFilter: MissionStatus5 | 'all'
  sortColumn: string | null
  sortDirection: 'asc' | 'desc' | null
  pagination: PaginationMeta
  // Locations state
  locations: MissionLocation[]
  locationsLoading: boolean
  locationsError: string | null
  // WebSocket state (Feature 05)
  wsConnected: boolean
  wsStatus: 'connected' | 'disconnected' | 'reconnecting'
}

export const useCollectorMissionStore = defineStore('collectorMission', {
  state: (): MissionState => ({
    missions: [],
    selectedMissionId: null,
    loading: false,
    creating: false,
    saving: false,
    deleting: false,
    error: null,
    loadingMore: false,
    search: '',
    statusFilter: 'all',
    sortColumn: null,
    sortDirection: null,
    pagination: {
      currentPage: 1,
      limit: 10,
      totalItems: 0,
      offset: 0,
      totalPages: 0,
      searchTerm: ''
    },
    locations: [],
    locationsLoading: false,
    locationsError: null,
    // WebSocket state (Feature 05)
    wsConnected: false,
    wsStatus: 'disconnected' as const
  }),

  getters: {
    selectedMission: (state): MissionRecord | null => {
      if (!state.selectedMissionId) return null
      return state.missions.find(m => m.id === state.selectedMissionId) ?? null
    },
    /** Return the mission record matching the given id, or null. */
    findMission: (state) => (id: string): MissionRecord | undefined => {
      return state.missions.find(m => m.id === id)
    }
  },

  actions: {
    // ── Missions ──────────────────────────────────────────────────────────

    /**
     * Fetch missions from the collector backend. Called on page load, when
     * filters change, or when pagination changes.
     */
    async fetchMissions() {
      this.loading = true
      this.loadingMore = false
      this.error = null
      try {
        const result = await missionService.listCollectorMissions({
          page: this.pagination.currentPage,
          page_size: this.pagination.limit,
          status: this.statusFilter,
          search: this.search || undefined,
          sort: this.sortColumn
            ? `${this.sortDirection === 'asc' ? '' : '-'}${this.sortColumn}`
            : undefined
        })
        this.missions = result.items
        this.pagination.totalItems = result.total
        this.pagination.totalPages = Math.ceil(result.total / this.pagination.limit)
        this.pagination.offset = (this.pagination.currentPage - 1) * this.pagination.limit
        // Auto-select the first mission when none is selected
        if (!this.selectedMissionId && this.missions.length > 0) {
          this.selectedMissionId = this.missions[0]!.id
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

    /**
     * Create a new collector mission. On success, re-fetch the list so the
     * new mission appears at the top of the grid.
     */
    async createMission(data: import('~/types/mission').MissionRecordCreate) {
      this.creating = true
      this.error = null
      try {
        await missionService.createCollectorMission(data)
        // Re-fetch to surface the new mission
        await this.fetchMissions()
        // Auto-select the newly created mission
        if (this.missions.length > 0) {
          this.selectedMissionId = this.missions[0]!.id
        }
      } catch (e) {
        const { parseApiError } = await import('~/types/api')
        const appError = parseApiError(e)
        this.error = appError.message
        throw appError
      } finally {
        this.creating = false
      }
    },

    /**
     * Update an existing collector mission (PATCH). Re-fetches the list on
     * success.
     */
    async updateMission(id: string, data: import('~/types/mission').MissionRecordUpdate) {
      this.saving = true
      this.error = null
      try {
        await missionService.updateCollectorMission(id, data)
        // Refresh the full list to pick up the updated mission
        await this.fetchMissions()
      } catch (e) {
        const { parseApiError } = await import('~/types/api')
        const appError = parseApiError(e)
        this.error = appError.message
        throw appError
      } finally {
        this.saving = false
      }
    },

    /**
     * Delete a collector mission. Removes it from the local list and clears
     * selection if the deleted mission was selected.
     */
    async deleteMission(id: string) {
      this.deleting = true
      this.error = null
      try {
        await missionService.deleteCollectorMission(id)
        this.missions = this.missions.filter(m => m.id !== id)
        if (this.selectedMissionId === id) {
          this.selectedMissionId = null
        }
      } catch (e) {
        const { parseApiError } = await import('~/types/api')
        const appError = parseApiError(e)
        this.error = appError.message
        throw appError
      } finally {
        this.deleting = false
      }
    },

    /**
     * Execute a lifecycle action on a collector mission (START / PAUSE /
     * RESUME / STOP). The backend validates the transition and returns the
     * updated mission.
     *
     * The store optimistically updates the local mission status so the UI
     * reacts instantly. On failure (e.g. backend returns 409 because the
     * mission is in a different status), the optimistic change is rolled
     * back and the underlying error is re-thrown for the caller to surface.
     */
    async patchMissionStatus(
      id: string,
      action: 'start' | 'pause' | 'resume' | 'stop'
    ) {
      this.saving = true
      this.error = null

      // Optimistic UI update: pick the expected post-action status.
      const expectedNext: MissionStatus5 | null = (() => {
        switch (action) {
          case 'start': return 'RUNNING'
          case 'pause': return 'PAUSED'
          case 'resume': return 'RUNNING'
          case 'stop': return 'STOPPED'
        }
      })()

      const previousStatus = this.findMission(id)?.status
      if (expectedNext && previousStatus) {
        this.optimisticStatus(id, expectedNext)
      }

      try {
        await missionService.collectorMissionAction(id, action)
        // Refresh the full list so any backend-driven fields sync up.
        await this.fetchMissions()
      } catch (e) {
        // Roll back optimistic change if we made one.
        if (expectedNext && previousStatus) {
          this.optimisticStatus(id, previousStatus)
        }
        const { parseApiError } = await import('~/types/api')
        const appError = parseApiError(e)
        this.error = appError.message
        throw appError
      } finally {
        this.saving = false
      }
    },

    /**
     * Optimistically set a mission's status in local state. Does not call
     * the backend. Used by patchMissionStatus to give the user immediate
     * feedback while the request is in flight.
     */
    optimisticStatus(id: string, status: MissionStatus5) {
      const mission = this.findMission(id)
      if (mission) {
        mission.status = status
      }
    },

    // ── Location (waypoint) actions ───────────────────────────────────────

    /**
     * List locations for a mission. Populates the locations local state so
     * the detail and editor views can render them without an extra fetch.
     */
    async fetchLocations(missionId: string) {
      this.locationsLoading = true
      this.locationsError = null
      try {
        const result = await missionService.listLocations(missionId)
        this.locations = result.items
      } catch (e) {
        const { parseApiError } = await import('~/types/api')
        const appError = parseApiError(e)
        this.locationsError = appError.message
        this.locations = []
      } finally {
        this.locationsLoading = false
      }
    },

    /** Append a location to the given mission. */
    async addLocation(missionId: string, data: MissionLocationCreate) {
      this.saving = true
      this.error = null
      try {
        await missionService.createLocation(missionId, data)
        // Refresh the location list
        await this.fetchLocations(missionId)
      } catch (e) {
        const { parseApiError } = await import('~/types/api')
        const appError = parseApiError(e)
        this.error = appError.message
        throw appError
      } finally {
        this.saving = false
      }
    },

    /** Delete a location from a mission. */
    async deleteLocation(missionId: string, locationId: string) {
      this.saving = true
      this.error = null
      try {
        await missionService.deleteLocation(missionId, locationId)
        // Refresh the location list
        await this.fetchLocations(missionId)
      } catch (e) {
        const { parseApiError } = await import('~/types/api')
        const appError = parseApiError(e)
        this.error = appError.message
        throw appError
      } finally {
        this.saving = false
      }
    },

    /**
     * Upload a CSV file containing a batch of locations. The backend returns
     * a CSVUploadResult describing successes/failures per row.
     */
    async uploadLocationsCSV(missionId: string, file: File) {
      this.saving = true
      this.error = null
      try {
        const result = await missionService.uploadLocationsCSV(missionId, file)
        // Refresh the location list after upload
        await this.fetchLocations(missionId)
        return result
      } catch (e) {
        const { parseApiError } = await import('~/types/api')
        const appError = parseApiError(e)
        this.error = appError.message
        throw appError
      } finally {
        this.saving = false
      }
    },

    // ── Selection & filters ───────────────────────────────────────────────

    selectMission(id: string | null) {
      this.selectedMissionId = id
    },

    setSearch(search: string) {
      this.search = search
      this.pagination.currentPage = 1
      this.pagination.offset = 0
      this.fetchMissions()
    },

    setStatusFilter(status: MissionStatus5 | 'all') {
      this.statusFilter = status
      this.pagination.currentPage = 1
      this.pagination.offset = 0
      this.fetchMissions()
    },

    setPage(page: number) {
      this.pagination.currentPage = page
      this.pagination.offset = (page - 1) * this.pagination.limit
      this.fetchMissions()
    },

    setLimit(limit: number) {
      this.pagination.limit = limit
      this.pagination.currentPage = 1
      this.pagination.offset = 0
      this.fetchMissions()
    },

    toggleSort(column: string) {
      if (this.sortColumn === column) {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc'
      } else {
        this.sortColumn = column
        this.sortDirection = 'desc'
      }
      this.pagination.currentPage = 1
      this.pagination.offset = 0
      this.fetchMissions()
    },

    /** Load the next page of missions and append to the list. */
    async loadMoreMissions() {
      if (this.loadingMore) return
      if (this.pagination.currentPage >= this.pagination.totalPages) return

      const nextPage = this.pagination.currentPage + 1
      this.loadingMore = true
      try {
        const result = await missionService.listCollectorMissions({
          page: nextPage,
          page_size: this.pagination.limit,
          status: this.statusFilter,
          search: this.search || undefined
        })
        this.missions = [...this.missions, ...result.items]
        this.pagination.currentPage = nextPage
        this.pagination.offset = (nextPage - 1) * this.pagination.limit
        this.pagination.totalItems = result.total
        this.pagination.totalPages = Math.ceil(result.total / this.pagination.limit)
      } catch (err) {
        console.error('Failed to load more missions', err)
      } finally {
        this.loadingMore = false
      }
    },

    // ── WebSocket state (Feature 05) ─────────────────────────────────────

    setWsConnected(connected: boolean) {
      this.wsConnected = connected
    },

    setWsStatus(status: 'connected' | 'disconnected' | 'reconnecting') {
      this.wsStatus = status
    }
  }
})
