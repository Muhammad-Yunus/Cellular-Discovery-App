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
    pagination: {
      currentPage: 1,
      limit: 20,
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
      this.error = null
      try {
        const result = await scanService.getScans({
          limit: this.pagination.limit,
          offset: this.pagination.offset,
          search: this.pagination.searchTerm || undefined
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

    setLimit(limit: number) {
      this.pagination.limit = limit
      this.pagination.currentPage = 1
      this.pagination.offset = 0
      this.fetchScans()
    }
  }
})
