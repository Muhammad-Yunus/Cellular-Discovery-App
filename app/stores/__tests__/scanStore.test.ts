import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useScanStore } from '../scanStore'

vi.mock('~/services/scan.service', () => ({
  getScans: vi.fn(),
  createScan: vi.fn(),
  deleteScan: vi.fn()
}))

vi.mock('~/types/api', () => ({
  parseApiError: vi.fn((e: Error) => ({
    message: e.message,
    type: 'UNKNOWN'
  }))
}))

vi.stubGlobal('useRuntimeConfig', () => ({
  public: {
    defaultLat: '-6.150676643667096',
    defaultLon: '106.89665223346297'
  }
}))

describe('scanStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initial state', () => {
    const store = useScanStore()
    expect(store.scans).toEqual([])
    expect(store.selectedScanId).toBeNull()
    expect(store.loading).toBe(false)
    expect(store.creating).toBe(false)
    expect(store.error).toBeNull()
    expect(store.pagination.currentPage).toBe(1)
    expect(store.pagination.limit).toBe(10)
  })

  it('selectScan sets selected id', () => {
    const store = useScanStore()
    store.scans = [{ id: '1', operator: 'Test', mcc: '123', mnc: '456', rat: 'LTE', latitude: 0, longitude: 0, scan_time: '2024-01-01T00:00:00Z' }]

    store.selectScan('1')
    expect(store.selectedScanId).toBe('1')

    store.selectScan(null)
    expect(store.selectedScanId).toBeNull()
  })

  it('selectedScan getter returns correct scan', () => {
    const store = useScanStore()
    const scan = { id: '1', operator: 'Test', mcc: '123', mnc: '456', rat: 'LTE', latitude: 0, longitude: 0, scan_time: '2024-01-01T00:00:00Z' }
    store.scans = [scan]
    store.selectedScanId = '1'

    expect(store.selectedScan).toEqual(scan)
  })

  it('selectedScan returns null when no selection', () => {
    const store = useScanStore()
    expect(store.selectedScan).toBeNull()
  })

  it('setPage updates pagination and fetches', async () => {
    const store = useScanStore()
    const { getScans } = await import('~/services/scan.service')
    vi.mocked(getScans).mockResolvedValueOnce({ items: [], total: 0, limit: 20, offset: 20 })

    store.setPage(2)

    expect(store.pagination.currentPage).toBe(2)
    expect(store.pagination.offset).toBe(10)
    expect(getScans).toHaveBeenCalledWith(expect.objectContaining({ pageSize: 10, page: 2, search: undefined }))
  })

  it('setSearch resets page and fetches', async () => {
    const store = useScanStore()
    const { getScans } = await import('~/services/scan.service')
    vi.mocked(getScans).mockResolvedValueOnce({ items: [], total: 0, limit: 20, offset: 0 })

    store.setPage(3)
    store.setSearch('test')

    expect(store.pagination.currentPage).toBe(1)
    expect(store.pagination.searchTerm).toBe('test')
  })

  it('deleteScan removes scan from list', async () => {
    const store = useScanStore()
    const { deleteScan } = await import('~/services/scan.service')
    vi.mocked(deleteScan).mockResolvedValueOnce(undefined)

    store.scans = [
      { id: '1', operator: 'A', mcc: '1', mnc: '1', rat: 'LTE', latitude: 0, longitude: 0, scan_time: '' },
      { id: '2', operator: 'B', mcc: '2', mnc: '2', rat: 'NR', latitude: 0, longitude: 0, scan_time: '' }
    ]
    store.selectedScanId = '1'

    await store.deleteScan('1')

    expect(store.scans.length).toBe(1)
    expect(store.scans[0].id).toBe('2')
    expect(store.selectedScanId).toBeNull()
  })

  it('fetchScans auto-selects the latest scan when none is selected', async () => {
    const store = useScanStore()
    const { getScans } = await import('~/services/scan.service')

    const latest = { id: 'scan-latest', operator: 'A', mcc: '1', mnc: '1', rat: 'LTE', latitude: 0, longitude: 0, scan_time: '2024-01-02T00:00:00Z' }
    const older = { id: 'scan-older', operator: 'B', mcc: '2', mnc: '2', rat: 'NR', latitude: 0, longitude: 0, scan_time: '2024-01-01T00:00:00Z' }
    // Backend returns newest-first
    vi.mocked(getScans).mockResolvedValueOnce({ items: [latest, older], total: 2, limit: 20, offset: 0 })

    expect(store.selectedScanId).toBeNull()
    await store.fetchScans()

    expect(store.selectedScanId).toBe('scan-latest')
  })

  it('fetchScans keeps existing selection when the selected scan is still in the list', async () => {
    const store = useScanStore()
    const { getScans } = await import('~/services/scan.service')

    const a = { id: 'a', operator: 'A', mcc: '1', mnc: '1', rat: 'LTE', latitude: 0, longitude: 0, scan_time: '' }
    const b = { id: 'b', operator: 'B', mcc: '2', mnc: '2', rat: 'NR', latitude: 0, longitude: 0, scan_time: '' }
    vi.mocked(getScans).mockResolvedValueOnce({ items: [a, b], total: 2, limit: 20, offset: 0 })

    store.selectScan('b')
    await store.fetchScans()

    expect(store.selectedScanId).toBe('b')
  })

  it('fetchScans falls back to latest when the previously selected scan disappeared', async () => {
    const store = useScanStore()
    const { getScans } = await import('~/services/scan.service')

    const a = { id: 'a', operator: 'A', mcc: '1', mnc: '1', rat: 'LTE', latitude: 0, longitude: 0, scan_time: '' }
    store.selectScan('stale-id')
    vi.mocked(getScans).mockResolvedValueOnce({ items: [a], total: 1, limit: 20, offset: 0 })

    await store.fetchScans()

    expect(store.selectedScanId).toBe('a')
  })
})
