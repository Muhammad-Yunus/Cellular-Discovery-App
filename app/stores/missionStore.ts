// app/stores/missionStore.ts
//
// Pinia store for the Mission Planner feature. Mirrors the API surface
// defined in `app/services/missionService.ts` and exposes reactive state
// that the list/grid, detail, and editor screens consume.

import { defineStore } from 'pinia'
import type {
  Mission,
  MissionStatus,
  WaypointCreateInput,
  WaypointUpdateInput
} from '~/types/mission'
import type { PaginationMeta } from '~/types'
import * as missionService from '~/services/missionService'

interface MissionState {
  missions: Mission[]
  selectedMissionId: string | null
  loading: boolean
  creating: boolean
  saving: boolean
  deleting: boolean
  error: string | null
  loadingMore: boolean
  search: string
  statusFilter: MissionStatus | 'all'
  sortColumn: string | null
  sortDirection: 'asc' | 'desc' | null
  pagination: PaginationMeta
}

export const useMissionStore = defineStore('mission', {
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
      limit: 25,
      totalItems: 0,
      offset: 0,
      totalPages: 0,
      searchTerm: ''
    }
  }),

  getters: {
    selectedMission: (state): Mission | null => {
      if (!state.selectedMissionId) return null
      return state.missions.find(m => m.id === state.selectedMissionId) ?? null
    }
  },

  actions: {
    /**
     * Fetch missions from the backend. Called on page load, when filters
     * change, or when pagination changes.
     */
    async fetchMissions() {
      this.loading = true
      this.loadingMore = false
      this.error = null
      try {
        const result = await missionService.listMissions({
          page: this.pagination.currentPage,
          pageSize: this.pagination.limit,
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
     * Create a new mission. On success, re-fetch the list so the new
     * mission appears at the top of the grid.
     */
    async createMission(data: import('~/types/mission').MissionCreateInput) {
      this.creating = true
      this.error = null
      try {
        await missionService.createMission(data)
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
     * Update an existing mission (PATCH). Re-fetches the list on success.
     */
    async updateMission(id: string, data: import('~/types/mission').MissionUpdateInput) {
      this.saving = true
      this.error = null
      try {
        await missionService.updateMission(id, data)
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
     * Delete a mission. Removes it from the local list and clears
     * selection if the deleted mission was selected.
     */
    async deleteMission(id: string) {
      this.deleting = true
      this.error = null
      try {
        await missionService.deleteMission(id)
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
     * Execute a lifecycle action on a mission (start / resume / pause /
     * complete / cancel). Re-fetches to sync with the backend.
     */
    async patchMissionStatus(id: string, action: 'start' | 'resume' | 'pause' | 'complete' | 'cancel') {
      this.saving = true
      this.error = null
      try {
        await missionService.patchMissionStatus(id, action)
        // Refresh the full list
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

    // ── Waypoint actions ──────────────────────────────────────────────────

    /** Append a waypoint to the given mission. */
    async addWaypoint(missionId: string, data: WaypointCreateInput) {
      this.saving = true
      this.error = null
      try {
        await missionService.createWaypoint(missionId, data)
        // Refresh the full list (waypoints are embedded in missions)
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

    /** Update a waypoint in place. */
    async updateWaypoint(missionId: string, waypointId: string, data: WaypointUpdateInput) {
      this.saving = true
      this.error = null
      try {
        await missionService.updateWaypoint(missionId, waypointId, data)
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

    /** Delete a waypoint from a mission. */
    async deleteWaypoint(missionId: string, waypointId: string) {
      this.saving = true
      this.error = null
      try {
        await missionService.deleteWaypoint(missionId, waypointId)
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

    setStatusFilter(status: MissionStatus | 'all') {
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
        const result = await missionService.listMissions({
          page: nextPage,
          pageSize: this.pagination.limit,
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

    /** Replace all waypoints for a mission (delete + recreate). */
    async replaceWaypoints(missionId: string, data: WaypointCreateInput[]) {
      this.saving = true
      this.error = null
      try {
        // Delete existing waypoints
        const mission = this.missions.find(m => m.id === missionId)
        if (mission?.waypoints) {
          for (const wp of mission.waypoints) {
            try {
              await missionService.deleteWaypoint(missionId, wp.id)
            } catch {
              // Ignore individual delete errors
            }
          }
        }
        // Create new waypoints
        for (const wp of data) {
          await missionService.createWaypoint(missionId, wp)
        }
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

    /** Check if a mission has waypoints loaded. */
    hasWaypoints(id: string): boolean {
      const mission = this.missions.find(m => m.id === id)
      return !!mission && mission.waypoints.length > 0
    },

    /** Export telemetry CSV for a mission (triggers download). */
    async exportTelemetryCsv(missionId: string) {
      try {
        const blob = await missionService.exportTelemetryCsv(missionId)
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `telemetry-${missionId}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      } catch (e) {
        const { parseApiError } = await import('~/types/api')
        const appError = parseApiError(e)
        this.error = appError.message
        throw appError
      }
    }
  }
})
