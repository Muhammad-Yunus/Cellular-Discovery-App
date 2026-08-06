import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMissionStore } from '../missionStore'

const mockListMissions = vi.fn()
const mockCreateMission = vi.fn()
const mockUpdateMission = vi.fn()
const mockDeleteMission = vi.fn()
const mockPatchMissionStatus = vi.fn()
const mockCreateWaypoint = vi.fn()
const mockUpdateWaypoint = vi.fn()
const mockDeleteWaypoint = vi.fn()

vi.mock('~/services/missionService', () => ({
  listMissions: (...args: unknown[]) => mockListMissions(...args),
  createMission: (...args: unknown[]) => mockCreateMission(...args),
  updateMission: (...args: unknown[]) => mockUpdateMission(...args),
  deleteMission: (...args: unknown[]) => mockDeleteMission(...args),
  patchMissionStatus: (...args: unknown[]) => mockPatchMissionStatus(...args),
  createWaypoint: (...args: unknown[]) => mockCreateWaypoint(...args),
  updateWaypoint: (...args: unknown[]) => mockUpdateWaypoint(...args),
  deleteWaypoint: (...args: unknown[]) => mockDeleteWaypoint(...args)
}))

vi.mock('~/types/api', () => ({
  parseApiError: vi.fn((e: Error) => ({
    message: e.message,
    type: 'UNKNOWN'
  }))
}))

const mockMission = (overrides: Partial<import('~/types/mission').Mission> = {}) => ({
  id: 'm-001',
  name: 'Test Mission',
  status: 'IDLE' as const,
  coordinate_frame: 'wgs84' as const,
  waypoints: [],
  created_at: '2025-01-15T10:00:00Z',
  updated_at: '2025-01-15T10:00:00Z',
  ...overrides
})

describe('missionStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockListMissions.mockReset()
    mockCreateMission.mockReset()
    mockUpdateMission.mockReset()
    mockDeleteMission.mockReset()
    mockPatchMissionStatus.mockReset()
    mockCreateWaypoint.mockReset()
    mockUpdateWaypoint.mockReset()
    mockDeleteWaypoint.mockReset()
  })

  it('initial state', () => {
    const store = useMissionStore()
    expect(store.missions).toEqual([])
    expect(store.selectedMissionId).toBeNull()
    expect(store.loading).toBe(false)
    expect(store.creating).toBe(false)
    expect(store.saving).toBe(false)
    expect(store.deleting).toBe(false)
    expect(store.error).toBeNull()
    expect(store.statusFilter).toBe('all')
    expect(store.search).toBe('')
    expect(store.pagination.currentPage).toBe(1)
    expect(store.pagination.limit).toBe(25)
  })

  it('selectedMission returns null when no selection', () => {
    const store = useMissionStore()
    expect(store.selectedMission).toBeNull()
  })

  it('selectedMission returns the matched mission', () => {
    const store = useMissionStore()
    const mission = mockMission({ id: 'm-001', name: 'Test Mission' })
    store.missions = [mission]
    store.selectMission('m-001')
    expect(store.selectedMission).toEqual(mission)
  })

  describe('selectMission', () => {
    it('sets selectedMissionId', () => {
      const store = useMissionStore()
      store.selectMission('m-001')
      expect(store.selectedMissionId).toBe('m-001')
      store.selectMission(null)
      expect(store.selectedMissionId).toBeNull()
    })
  })

  describe('fetchMissions', () => {
    it('sets loading state and populates missions', async () => {
      mockListMissions.mockResolvedValueOnce({
        items: [mockMission({ id: 'm-001' })],
        total: 1,
        limit: 25,
        offset: 0
      })

      const store = useMissionStore()
      await store.fetchMissions()

      expect(store.loading).toBe(false)
      expect(store.missions).toHaveLength(1)
      expect(store.missions[0]!.id).toBe('m-001')
      expect(store.pagination.totalItems).toBe(1)
    })

    it('auto-selects the first mission when none selected', async () => {
      mockListMissions.mockResolvedValueOnce({
        items: [mockMission({ id: 'm-001' })],
        total: 1,
        limit: 25,
        offset: 0
      })

      const store = useMissionStore()
      expect(store.selectedMissionId).toBeNull()
      await store.fetchMissions()
      expect(store.selectedMissionId).toBe('m-001')
    })

    it('keeps existing selection when the selected mission is still in the list', async () => {
      mockListMissions.mockResolvedValueOnce({
        items: [mockMission({ id: 'm-a' }), mockMission({ id: 'm-b' })],
        total: 2,
        limit: 25,
        offset: 0
      })

      const store = useMissionStore()
      store.selectMission('m-b')
      await store.fetchMissions()
      expect(store.selectedMissionId).toBe('m-b')
    })

    it('auto-selects first mission when selectedMissionId is null', async () => {
      mockListMissions.mockResolvedValueOnce({
        items: [mockMission({ id: 'm-a' })],
        total: 1,
        limit: 25,
        offset: 0
      })

      const store = useMissionStore()
      expect(store.selectedMissionId).toBeNull()
      await store.fetchMissions()
      expect(store.selectedMissionId).toBe('m-a')
    })

    it('sets error on failure', async () => {
      mockListMissions.mockRejectedValueOnce(new Error('Connection refused'))

      const store = useMissionStore()
      await store.fetchMissions()

      expect(store.error).toBeTruthy()
      expect(store.missions).toHaveLength(0)
      expect(store.loading).toBe(false)
    })
  })

  describe('createMission', () => {
    it('calls createMission and refreshes list', async () => {
      mockCreateMission.mockResolvedValueOnce(mockMission({ id: 'm-new' }))
      mockListMissions.mockResolvedValueOnce({
        items: [mockMission({ id: 'm-new', name: 'New Mission' })],
        total: 1,
        limit: 25,
        offset: 0
      })

      const store = useMissionStore()
      await store.createMission({
        name: 'New Mission',
        status: 'IDLE',
        coordinate_frame: 'wgs84'
      })

      expect(mockCreateMission).toHaveBeenCalled()
      expect(store.missions).toHaveLength(1)
      expect(store.selectedMissionId).toBe('m-new')
    })

    it('propagates error on failure', async () => {
      mockCreateMission.mockRejectedValueOnce(new Error('Backend error'))

      const store = useMissionStore()
      await expect(
        store.createMission({
          name: 'Fail',
          status: 'IDLE',
          coordinate_frame: 'wgs84'
        })
      ).rejects.toThrow('Backend error')
      expect(store.error).toBeTruthy()
    })
  })

  describe('updateMission', () => {
    it('calls updateMission and refreshes', async () => {
      mockUpdateMission.mockResolvedValueOnce(mockMission({ id: 'm-001', status: 'planned' }))
      mockListMissions.mockResolvedValueOnce({
        items: [mockMission({ id: 'm-001', status: 'planned' })],
        total: 1,
        limit: 25,
        offset: 0
      })

      const store = useMissionStore()
      await store.updateMission('m-001', { name: 'Updated', status: 'planned' })

      expect(mockUpdateMission).toHaveBeenCalledWith('m-001', expect.objectContaining({ name: 'Updated' }))
      expect(store.missions[0]!.status).toBe('planned')
    })
  })

  describe('deleteMission', () => {
    it('removes the mission and clears selection', async () => {
      mockDeleteMission.mockResolvedValueOnce(undefined)

      const store = useMissionStore()
      store.missions = [
        mockMission({ id: 'm-001' }),
        mockMission({ id: 'm-002' })
      ]
      store.selectMission('m-001')

      await store.deleteMission('m-001')

      expect(store.missions).toHaveLength(1)
      expect(store.missions[0]!.id).toBe('m-002')
      expect(store.selectedMissionId).toBeNull()
    })
  })

  describe('filtering & pagination', () => {
    it('setSearch resets page and fetches', async () => {
      mockListMissions.mockResolvedValueOnce({ items: [], total: 0, limit: 25, offset: 0 })

      const store = useMissionStore()
      store.setPage(3)
      store.setSearch('test')

      expect(store.pagination.currentPage).toBe(1)
      expect(store.search).toBe('test')
      expect(mockListMissions).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, pageSize: 25, search: 'test' })
      )
    })

    it('setStatusFilter resets page and fetches', async () => {
      mockListMissions.mockResolvedValueOnce({ items: [], total: 0, limit: 25, offset: 0 })

      const store = useMissionStore()
      store.setStatusFilter('COMPLETED')

      expect(store.statusFilter).toBe('COMPLETED')
      expect(store.pagination.currentPage).toBe(1)
      expect(mockListMissions).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'COMPLETED', page: 1 })
      )
    })

    it('setPage updates pagination and fetches', async () => {
      mockListMissions.mockResolvedValueOnce({ items: [], total: 0, limit: 25, offset: 25 })

      const store = useMissionStore()
      store.setPage(2)

      expect(store.pagination.currentPage).toBe(2)
      expect(store.pagination.offset).toBe(25)
      expect(mockListMissions).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }))
    })

    it('toggleSort updates sort params and fetches', async () => {
      mockListMissions.mockResolvedValueOnce({ items: [], total: 0, limit: 25, offset: 0 })

      const store = useMissionStore()
      store.toggleSort('name')

      expect(store.sortColumn).toBe('name')
      expect(store.sortDirection).toBe('desc')
      expect(mockListMissions).toHaveBeenCalledWith(
        expect.objectContaining({ sort: '-name' })
      )

      // Toggle again → asc
      mockListMissions.mockResolvedValueOnce({ items: [], total: 0, limit: 25, offset: 0 })
      store.toggleSort('name')
      expect(store.sortDirection).toBe('asc')
      expect(mockListMissions).toHaveBeenCalledWith(
        expect.objectContaining({ sort: 'name' })
      )
    })
  })

  describe('waypoint actions', () => {
    it('addWaypoint calls service and refreshes', async () => {
      mockCreateWaypoint.mockResolvedValueOnce({
        id: 'wp-1', sequence: 0, latitude: 0, longitude: 0, altitude: 100
      })
      mockListMissions.mockResolvedValueOnce({ items: [], total: 0, limit: 25, offset: 0 })

      const store = useMissionStore()
      await store.addWaypoint('m-001', {
        sequence: 0, latitude: 0, longitude: 0, altitude: 100
      })

      expect(mockCreateWaypoint).toHaveBeenCalledWith('m-001', expect.objectContaining({ latitude: 0 }))
    })

    it('deleteWaypoint calls service and refreshes', async () => {
      mockDeleteWaypoint.mockResolvedValueOnce(undefined)
      mockListMissions.mockResolvedValueOnce({ items: [], total: 0, limit: 25, offset: 0 })

      const store = useMissionStore()
      await store.deleteWaypoint('m-001', 'wp-1')

      expect(mockDeleteWaypoint).toHaveBeenCalledWith('m-001', 'wp-1')
    })
  })
})
