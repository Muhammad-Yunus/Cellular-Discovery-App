import { defineStore } from 'pinia'
import type { ScanSummary, PaginationMeta } from '~/types'
import * as scanService from '~/services/scan.service'

interface ScanState {
  scans: ScanSummary[]
  selectedScanId: string | null
  loading: boolean
  creating: boolean
  error: string | null
  wsConnected: boolean
  loadingMore: boolean
  ratFilter: string | null // 'ALL' or specific RAT like 'LTE'
  dateRange: { startDate: string | null; endDate: string | null } // ISO datetime strings
  pagination: PaginationMeta
}

export const useScanStore = defineStore('scan', {
  state: (): ScanState => ({
    scans: [],
    selectedScanId: null,
    loading: false,
    creating: false,
    error: null,
    wsConnected: false,
    loadingMore: false,
    ratFilter: 'ALL',
    dateRange: { startDate: null, endDate: null },
    pagination: {
      currentPage: 1,
      limit: 10,
      totalItems: 0,
      offset: 0,
      totalPages: 0,
      searchTerm: ''
    }
  }),

  getters: {
    selectedScan: (state): ScanSummary | null => {
      if (!state.selectedScanId) return null
      return state.scans.find(s => s.id === state.selectedScanId) ?? null
    }
  },

  actions: {
    async fetchScans() {
      this.loading = true
      this.loadingMore = false
      this.error = null
      try {
        console.log('[store] Fetching scans with dateRange:', this.dateRange)
        const result = await scanService.getScans({
          pageSize: this.pagination.limit,
          page: this.pagination.currentPage,
          search: this.pagination.searchTerm || undefined,
          rat: this.ratFilter,
          ...(this.dateRange.startDate !== null ? { startDate: this.dateRange.startDate } : {}),
          ...(this.dateRange.endDate !== null ? { endDate: this.dateRange.endDate } : {})
        })
        // Backend now returns flat items (one per scan_result). Map fields
        // to the ScanSummary shape expected by UI (operator name -> operator).
        this.scans = result.items.map(item => ({
          id: item.id,
          operator: item.operator_name,
          mcc: item.mcc,
          mnc: item.mnc,
          rat: item.rat,
          latitude: item.latitude,
          longitude: item.longitude,
          scan_time: item.scan_time,
        }))
        this.pagination.totalItems = result.total
        this.pagination.totalPages = Math.ceil(result.total / this.pagination.limit)
        this.pagination.offset = (this.pagination.currentPage - 1) * this.pagination.limit
        // Default selection: pick the latest entry by timestamp (scans
        // are returned newest-first by the backend). If the previously
        // selected entry is still in the list, keep it; otherwise pick the
        // first one (latest entry).
        const stillExists = this.selectedScanId
          ? this.scans.some(s => s.id === this.selectedScanId)
          : false
        if (!stillExists) {
          this.selectedScanId = this.scans[0]?.id ?? null
        }
      } catch (e) {
        const { parseApiError } = await import('~/types/api')
        const appError = parseApiError(e)
        this.error = appError.message
        // Kosongkan data tabel agar user tidak bingung
        this.scans = []
        this.pagination.totalItems = 0
        this.pagination.totalPages = 0
      } finally {
        this.loading = false
      }
    },

    async createScan() {
      this.creating = true
      this.error = null
      try {
        // Minimal payload required by backend (only tty)
        // @ts-ignore
        await (scanService as any).createScan({ tty: '/dev/ttyUSB0' })
        // Refresh scans list from server
        await this.fetchScans()
        // Select the latest scan (most recent scan_time)
        if (this.scans.length > 0) {
          const sorted = [...this.scans].sort(
            (a, b) => new Date(b.scan_time).getTime() - new Date(a.scan_time).getTime()
          )
          this.selectedScanId = sorted[0].id
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

    setWsConnected(connected: boolean) {
      this.wsConnected = connected
    },

    selectScan(id: string | null) {
      this.selectedScanId = id
    },

    async deleteScan(id: string) {
      this.error = null
      try {
        await scanService.deleteScan(id)
        this.scans = this.scans.filter(s => s.id !== id)
        if (this.selectedScanId === id) {
          this.selectedScanId = null
        }
      } catch (e) {
        const { parseApiError } = await import('~/types/api')
        const appError = parseApiError(e)
        this.error = appError.message
        throw appError
      }
    },

    setPage(page: number) {
      this.pagination.currentPage = page
      this.pagination.offset = (page - 1) * this.pagination.limit
      this.fetchScans()
    },

    setSearch(search: string) {
      this.pagination.searchTerm = search
      this.pagination.currentPage = 1
      this.pagination.offset = 0
      this.fetchScans()
    },

    setRat(rat: string) {
      this.ratFilter = rat
      this.pagination.currentPage = 1
      this.pagination.offset = 0
      this.fetchScans()
    },

    setDateRange(startDate?: string | null, endDate?: string | null) {
      this.dateRange.startDate = startDate ?? null
      this.dateRange.endDate = endDate ?? null
      this.pagination.currentPage = 1
      this.pagination.offset = 0
      this.fetchScans()
    },

    setLimit(limit: number) {
      this.pagination.limit = limit
      this.pagination.currentPage = 1
      this.pagination.offset = 0
      this.fetchScans()
    },

    /**
     * Load the next page of scans and append them to the existing list.
     * Called when the user scrolls to the bottom of the sidebar list.
     */
    async loadMoreScans() {
      // Guard against concurrent requests
      if (this.loadingMore) return

      // No more pages available
      if (this.pagination.currentPage >= this.pagination.totalPages) {
        return
      }

      const nextPage = this.pagination.currentPage + 1
      this.loadingMore = true
      try {
        const result = await scanService.getScans({
          pageSize: this.pagination.limit,
          page: nextPage,
          search: this.pagination.searchTerm,
          rat: this.ratFilter,
          ...(this.dateRange.startDate !== null ? { startDate: this.dateRange.startDate } : {}),
          ...(this.dateRange.endDate !== null ? { endDate: this.dateRange.endDate } : {})
        })

        // Append the new items (one per scan_result) to the UI list
        const newItems = result.items.map(item => ({
          id: item.id,
          operator: item.operator_name,
          mcc: item.mcc,
          mnc: item.mnc,
          rat: item.rat,
          latitude: item.latitude,
          longitude: item.longitude,
          scan_time: item.scan_time,
        }))

        this.scans = [...this.scans, ...newItems]
        // Update pagination metadata
        this.pagination.currentPage = nextPage
        this.pagination.offset = (nextPage - 1) * this.pagination.limit
        this.pagination.totalItems = result.total
        this.pagination.totalPages = Math.ceil(result.total / this.pagination.limit)
      } catch (err) {
        console.error('Failed to load more scans', err)
        // Could show a toast notification here
      } finally {
        this.loadingMore = false
      }
    }
  }
})
