import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCollectorMissionStore } from '../mission'

const mockListCollectorMissions = vi.fn()
const mockCreateCollectorMission = vi.fn()
const mockUpdateCollectorMission = vi.fn()
const mockDeleteCollectorMission = vi.fn()
const mockCollectorMissionAction = vi.fn()
const mockListLocations = vi.fn()
const mockCreateLocation = vi.fn()
const mockDeleteLocation = vi.fn()
const mockUploadLocationsCSV = vi.fn()

vi.mock('~/services/missionService', () => ({
  listCollectorMissions: (...args: unknown[]) => mockListCollectorMissions(...args),
  createCollectorMission: (...args: unknown[]) => mockCreateCollectorMission(...args),
  updateCollectorMission: (...args: unknown[]) => mockUpdateCollectorMission(...args),
  deleteCollectorMission: (...args: unknown[]) => mockDeleteCollectorMission(...args),
  collectorMissionAction: (...args: unknown[]) => mockCollectorMissionAction(...args),
  listLocations: (...args: unknown[]) => mockListLocations(...args),
  createLocation: (...args: unknown[]) => mockCreateLocation(...args),
  deleteLocation: (...args: unknown[]) => mockDeleteLocation(...args),
  uploadLocationsCSV: (...args: unknown[]) => mockUploadLocationsCSV(...args)
}))

vi.mock('~/types/api', () => ({
  parseApiError: vi.fn((e: Error) => ({
    message: e.message,
    type: 'UNKNOWN'
  }))
}))

const mockRecord = (overrides: Partial<import('~/types/mission').MissionRecord> = {}) => ({
  id: 'cm-001',
  name: 'Test Mission',
  status: 'draft' as const,
  created_at: '2025-01-15T10:00:00Z',
  updated_at: '2025-01-15T10:00:00Z',
  ...overrides
})

const mockLocation = (overrides: Partial<import('~/types/mission').MissionLocation> = {}) => ({
  id: 'loc-001',
  mission_id: 'cm-001',
  latitude: -6.2088,
  longitude: 106.8456,
  altitude: null,
  order_index: 0,
  created_at: '2025-01-15T10:00:00Z',
  updated_at: '2025-01-15T10:00:00Z',
  ...overrides
})

describe('collectorMission store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockListCollectorMissions.mockReset()
    mockCreateCollectorMission.mockReset()
    mockUpdateCollectorMission.mockReset()
    mockDeleteCollectorMission.mockReset()
    mockCollectorMissionAction.mockReset()
    mockListLocations.mockReset()
    mockCreateLocation.mockReset()
    mockDeleteLocation.mockReset()
    mockUploadLocationsCSV.mockReset()
  })

  it('initial state', () => {
    const store = useCollectorMissionStore()
    expect(store.missions).toEqual([])
    expect(store.selectedMissionId).toBeNull()
    expect(store.loading).toBe(false)
    expect(store.creating).toBe(false)
    expect(store.saving).toBe(false)
    expect(store.deleting).toBe(false)
    expect(store.error).toBeNull()
    expect(store.loadingMore).toBe(false)
    expect(store.search).toBe('')
    expect(store.statusFilter).toBe('all')
    expect(store.sortColumn).toBeNull()
    expect(store.sortDirection).toBeNull()
    expect(store.pagination.currentPage).toBe(1)
    expect(store.pagination.limit).toBe(10)
    expect(store.locations).toEqual([])
    expect(store.locationsLoading).toBe(false)
    expect(store.locationsError).toBeNull()
  })

  it('selectedMission returns null when no selection', () => {
    const store = useCollectorMissionStore()
    expect(store.selectedMission).toBeNull()
  })

  it('selectedMission returns the matched record', () => {
    const store = useCollectorMissionStore()
    const record = mockRecord({ id: 'cm-001', name: 'Test Mission' })
    store.missions = [record]
    store.selectMission('cm-001')
    expect(store.selectedMission).toEqual(record)
  })

  describe('selectMission', () => {
    it('sets selectedMissionId', () => {
      const store = useCollectorMissionStore()
      store.selectMission('cm-001')
      expect(store.selectedMissionId).toBe('cm-001')
      store.selectMission(null)
      expect(store.selectedMissionId).toBeNull()
    })
  })

  describe('fetchMissions', () => {
    it('sets loading state and populates missions', async () => {
      mockListCollectorMissions.mockResolvedValueOnce({
        items: [mockRecord({ id: 'cm-001' })],
        total: 1,
        limit: 10,
        offset: 0
      })

      const store = useCollectorMissionStore()
      await store.fetchMissions()

      expect(store.loading).toBe(false)
      expect(store.missions).toHaveLength(1)
      expect(store.missions[0]!.id).toBe('cm-001')
      expect(store.pagination.totalItems).toBe(1)
    })

    it('auto-selects the first mission when none selected', async () => {
      mockListCollectorMissions.mockResolvedValueOnce({
        items: [mockRecord({ id: 'cm-001' })],
        total: 1,
        limit: 10,
        offset: 0
      })

      const store = useCollectorMissionStore()
      expect(store.selectedMissionId).toBeNull()
      await store.fetchMissions()
      expect(store.selectedMissionId).toBe('cm-001')
    })

    it('keeps existing selection when the selected mission is still in the list', async () => {
      mockListCollectorMissions.mockResolvedValueOnce({
        items: [mockRecord({ id: 'cm-a' }), mockRecord({ id: 'cm-b' })],
        total: 2,
        limit: 10,
        offset: 0
      })

      const store = useCollectorMissionStore()
      store.selectMission('cm-b')
      await store.fetchMissions()
      expect(store.selectedMissionId).toBe('cm-b')
    })

    it('auto-selects first mission when selectedMissionId is null', async () => {
      mockListCollectorMissions.mockResolvedValueOnce({
        items: [mockRecord({ id: 'cm-a' })],
        total: 1,
        limit: 10,
        offset: 0
      })

      const store = useCollectorMissionStore()
      expect(store.selectedMissionId).toBeNull()
      await store.fetchMissions()
      expect(store.selectedMissionId).toBe('cm-a')
    })

    it('sets error on failure', async () => {
      mockListCollectorMissions.mockRejectedValueOnce(new Error('Connection refused'))

      const store = useCollectorMissionStore()
      await store.fetchMissions()

      expect(store.error).toBeTruthy()
      expect(store.missions).toHaveLength(0)
      expect(store.loading).toBe(false)
    })

    it('passes sort params correctly', async () => {
      mockListCollectorMissions.mockResolvedValueOnce({
        items: [],
        total: 0,
        limit: 10,
        offset: 0
      })

      const store = useCollectorMissionStore()
      store.sortColumn = 'name'
      store.sortDirection = 'desc'
      await store.fetchMissions()

      expect(mockListCollectorMissions).toHaveBeenCalledWith(
        expect.objectContaining({ sort: '-name' })
      )
    })

    it('omits sort param when sortColumn is null', async () => {
      mockListCollectorMissions.mockResolvedValueOnce({
        items: [],
        total: 0,
        limit: 10,
        offset: 0
      })

      const store = useCollectorMissionStore()
      store.sortColumn = null
      await store.fetchMissions()

      expect(mockListCollectorMissions).toHaveBeenCalledWith(
        expect.objectContaining({ sort: undefined })
      )
    })
  })

  describe('createMission', () => {
    it('calls createCollectorMission and refreshes list', async () => {
      mockCreateCollectorMission.mockResolvedValueOnce(mockRecord({ id: 'cm-new' }))
      mockListCollectorMissions.mockResolvedValueOnce({
        items: [mockRecord({ id: 'cm-new', name: 'New Mission' })],
        total: 1,
        limit: 10,
        offset: 0
      })

      const store = useCollectorMissionStore()
      await store.createMission({
        name: 'New Mission'
      })

      expect(mockCreateCollectorMission).toHaveBeenCalled()
      expect(store.missions).toHaveLength(1)
      expect(store.selectedMissionId).toBe('cm-new')
    })

    it('propagates error on failure', async () => {
      mockCreateCollectorMission.mockRejectedValueOnce(new Error('Backend error'))

      const store = useCollectorMissionStore()
      await expect(
        store.createMission({ name: 'Fail' })
      ).rejects.toThrow('Backend error')
      expect(store.error).toBeTruthy()
    })
  })

  describe('updateMission', () => {
    it('calls updateCollectorMission and refreshes', async () => {
      mockUpdateCollectorMission.mockResolvedValueOnce(mockRecord({ id: 'cm-001', status: 'active' }))
      mockListCollectorMissions.mockResolvedValueOnce({
        items: [mockRecord({ id: 'cm-001', status: 'active' })],
        total: 1,
        limit: 10,
        offset: 0
      })

      const store = useCollectorMissionStore()
      await store.updateMission('cm-001', { name: 'Updated', status: 'active' })

      expect(mockUpdateCollectorMission).toHaveBeenCalledWith('cm-001', expect.objectContaining({ name: 'Updated' }))
      expect(store.missions[0]!.status).toBe('active')
    })
  })

  describe('deleteMission', () => {
    it('removes the mission and clears selection', async () => {
      mockDeleteCollectorMission.mockResolvedValueOnce(undefined)

      const store = useCollectorMissionStore()
      store.missions = [
        mockRecord({ id: 'cm-001' }),
        mockRecord({ id: 'cm-002' })
      ]
      store.selectMission('cm-001')

      await store.deleteMission('cm-001')

      expect(store.missions).toHaveLength(1)
      expect(store.missions[0]!.id).toBe('cm-002')
      expect(store.selectedMissionId).toBeNull()
    })
  })

  describe('patchMissionStatus', () => {
    it('calls collectorMissionAction and refreshes', async () => {
      mockCollectorMissionAction.mockResolvedValueOnce(mockRecord({ id: 'cm-001', status: 'active' }))
      mockListCollectorMissions.mockResolvedValueOnce({
        items: [mockRecord({ id: 'cm-001', status: 'active' })],
        total: 1,
        limit: 10,
        offset: 0
      })

      const store = useCollectorMissionStore()
      await store.patchMissionStatus('cm-001', 'start')

      expect(mockCollectorMissionAction).toHaveBeenCalledWith('cm-001', 'start')
      expect(store.missions[0]!.status).toBe('active')
    })

    it('handles pause action', async () => {
      mockCollectorMissionAction.mockResolvedValueOnce(mockRecord({ id: 'cm-001', status: 'paused' }))
      mockListCollectorMissions.mockResolvedValueOnce({
        items: [mockRecord({ id: 'cm-001', status: 'paused' })],
        total: 1,
        limit: 10,
        offset: 0
      })

      const store = useCollectorMissionStore()
      await store.patchMissionStatus('cm-001', 'pause')
      expect(mockCollectorMissionAction).toHaveBeenCalledWith('cm-001', 'pause')
      expect(store.missions[0]!.status).toBe('paused')
    })

    it('handles resume action', async () => {
      mockCollectorMissionAction.mockResolvedValueOnce(mockRecord({ id: 'cm-001', status: 'active' }))
      mockListCollectorMissions.mockResolvedValueOnce({
        items: [mockRecord({ id: 'cm-001', status: 'active' })],
        total: 1,
        limit: 10,
        offset: 0
      })

      const store = useCollectorMissionStore()
      await store.patchMissionStatus('cm-001', 'resume')
      expect(mockCollectorMissionAction).toHaveBeenCalledWith('cm-001', 'resume')
    })

    it('handles complete action', async () => {
      mockCollectorMissionAction.mockResolvedValueOnce(mockRecord({ id: 'cm-001', status: 'completed' }))
      mockListCollectorMissions.mockResolvedValueOnce({
        items: [mockRecord({ id: 'cm-001', status: 'completed' })],
        total: 1,
        limit: 10,
        offset: 0
      })

      const store = useCollectorMissionStore()
      await store.patchMissionStatus('cm-001', 'complete')
      expect(mockCollectorMissionAction).toHaveBeenCalledWith('cm-001', 'complete')
    })
  })

  describe('filtering & pagination', () => {
    it('setSearch resets page and fetches', async () => {
      mockListCollectorMissions.mockResolvedValueOnce({ items: [], total: 0, limit: 10, offset: 0 })

      const store = useCollectorMissionStore()
      store.setPage(3)
      store.setSearch('test')

      expect(store.pagination.currentPage).toBe(1)
      expect(store.search).toBe('test')
      expect(mockListCollectorMissions).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, page_size: 10, search: 'test' })
      )
    })

    it('setStatusFilter resets page and fetches', async () => {
      mockListCollectorMissions.mockResolvedValueOnce({ items: [], total: 0, limit: 10, offset: 0 })

      const store = useCollectorMissionStore()
      store.setStatusFilter('active')

      expect(store.statusFilter).toBe('active')
      expect(store.pagination.currentPage).toBe(1)
      expect(mockListCollectorMissions).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'active', page: 1 })
      )
    })

    it('setPage updates pagination and fetches', async () => {
      mockListCollectorMissions.mockResolvedValueOnce({ items: [], total: 0, limit: 10, offset: 10 })

      const store = useCollectorMissionStore()
      store.setPage(2)

      expect(store.pagination.currentPage).toBe(2)
      expect(store.pagination.offset).toBe(10)
      expect(mockListCollectorMissions).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }))
    })

    it('toggleSort updates sort params and fetches', async () => {
      mockListCollectorMissions.mockResolvedValueOnce({ items: [], total: 0, limit: 10, offset: 0 })

      const store = useCollectorMissionStore()
      store.toggleSort('name')

      expect(store.sortColumn).toBe('name')
      expect(store.sortDirection).toBe('desc')
      expect(mockListCollectorMissions).toHaveBeenCalledWith(
        expect.objectContaining({ sort: '-name' })
      )

      // Toggle again → asc
      mockListCollectorMissions.mockResolvedValueOnce({ items: [], total: 0, limit: 10, offset: 0 })
      store.toggleSort('name')
      expect(store.sortDirection).toBe('asc')
      expect(mockListCollectorMissions).toHaveBeenCalledWith(
        expect.objectContaining({ sort: 'name' })
      )
    })
  })

  describe('locations', () => {
    it('fetchLocations populates locations', async () => {
      mockListLocations.mockResolvedValueOnce({
        items: [mockLocation({ id: 'loc-1' })],
        total: 1,
        limit: 20,
        offset: 0
      })

      const store = useCollectorMissionStore()
      await store.fetchLocations('cm-001')

      expect(store.locations).toHaveLength(1)
      expect(store.locations[0]!.id).toBe('loc-1')
      expect(store.locationsLoading).toBe(false)
    })

    it('fetchLocations sets error on failure', async () => {
      mockListLocations.mockRejectedValueOnce(new Error('Connection refused'))

      const store = useCollectorMissionStore()
      await store.fetchLocations('cm-001')

      expect(store.locationsError).toBeTruthy()
      expect(store.locations).toHaveLength(0)
      expect(store.locationsLoading).toBe(false)
    })

    it('addLocation calls service and refreshes locations', async () => {
      mockCreateLocation.mockResolvedValueOnce({
        id: 'loc-1',
        mission_id: 'cm-001',
        latitude: 0,
        longitude: 0,
        order_index: 0,
        altitude: null,
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z'
      })
      mockListLocations.mockResolvedValueOnce({
        items: [mockLocation({ id: 'loc-1' })],
        total: 1,
        limit: 20,
        offset: 0
      })

      const store = useCollectorMissionStore()
      await store.addLocation('cm-001', { latitude: 0, longitude: 0, order_index: 0 })

      expect(mockCreateLocation).toHaveBeenCalledWith('cm-001', expect.objectContaining({ latitude: 0 }))
      expect(store.locations).toHaveLength(1)
    })

    it('deleteLocation calls service and refreshes locations', async () => {
      mockDeleteLocation.mockResolvedValueOnce(undefined)
      mockListLocations.mockResolvedValueOnce({ items: [], total: 0, limit: 20, offset: 0 })

      const store = useCollectorMissionStore()
      store.locations = [mockLocation({ id: 'loc-1' })]
      await store.deleteLocation('cm-001', 'loc-1')

      expect(mockDeleteLocation).toHaveBeenCalledWith('cm-001', 'loc-1')
      expect(store.locations).toHaveLength(0)
    })

    it('uploadLocationsCSV calls service and refreshes', async () => {
      mockUploadLocationsCSV.mockResolvedValueOnce({
        total_rows: 5,
        success_rows: 4,
        failed_rows: 1,
        errors: []
      })
      mockListLocations.mockResolvedValueOnce({
        items: [mockLocation({ id: 'loc-1' })],
        total: 1,
        limit: 20,
        offset: 0
      })

      const store = useCollectorMissionStore()
      const file = new File(['lat,lon\n-6.2,106.8'], 'test.csv', { type: 'text/csv' })
      const result = await store.uploadLocationsCSV('cm-001', file)

      expect(mockUploadLocationsCSV).toHaveBeenCalledWith('cm-001', file)
      expect(result).toEqual({
        total_rows: 5,
        success_rows: 4,
        failed_rows: 1,
        errors: []
      })
    })
  })
})
