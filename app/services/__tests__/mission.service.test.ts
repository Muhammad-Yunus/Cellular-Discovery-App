import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  listMissions,
  getMissionById,
  createMission,
  updateMission,
  deleteMission,
  createWaypoint,
  getWaypoint,
  updateWaypoint,
  deleteWaypoint,
  listDrones,
  getDroneById,
  listSurveyAreas,
  getSurveyAreaById,
  exportTelemetryCsv,
  exportMissionReportPdf,
  // Collector backend (Feature 02+)
  listCollectorMissions,
  getCollectorMission,
  createCollectorMission,
  updateCollectorMission,
  deleteCollectorMission,
  startCollectorMission,
  pauseCollectorMission,
  resumeCollectorMission,
  collectorMissionAction,
  listLocations,
  createLocation,
  deleteLocation,
  uploadLocationsCSV
} from '../missionService'

const mockMissionApiRequest = vi.hoisted(() => vi.fn())

vi.mock('../missionApi', () => ({
  missionApiRequest: mockMissionApiRequest
}))

describe('missionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ────────────────────────────────────────────────────────────────────────
  // Missions
  // ────────────────────────────────────────────────────────────────────────

  describe('listMissions', () => {
    const mockResponse = {
      items: [],
      total: 0,
      limit: 25,
      offset: 0
    }

    it('calls GET /missions with defaults when no params given', async () => {
      mockMissionApiRequest.mockResolvedValueOnce(mockResponse)

      const result = await listMissions()

      expect(mockMissionApiRequest).toHaveBeenCalledWith('/missions', {
        params: {
          page: 1,
          page_size: 25
        }
      })
      expect(result).toEqual(mockResponse)
    })

    it('calls GET /missions with filters when params provided', async () => {
      mockMissionApiRequest.mockResolvedValueOnce(mockResponse)

      await listMissions({
        page: 2,
        pageSize: 10,
        status: 'IDLE',
        drone_id: 'drone-001',
        search: 'survey',
        sort: '-created_at'
      })

      expect(mockMissionApiRequest).toHaveBeenCalledWith('/missions', {
        params: {
          page: 2,
          page_size: 10,
          status: 'IDLE',
          drone_id: 'drone-001',
          search: 'survey',
          sort: '-created_at'
        }
      })
    })

    it('omits status filter when set to "all"', async () => {
      mockMissionApiRequest.mockResolvedValueOnce(mockResponse)

      await listMissions({ status: 'all' })

      expect(mockMissionApiRequest).toHaveBeenCalledWith('/missions', {
        params: {
          page: 1,
          page_size: 25
        }
      })
    })
  })

  describe('getMissionById', () => {
    const mockMission = {
      id: 'm-001',
      name: 'Test Mission',
      status: 'IDLE',
      coordinate_frame: 'wgs84',
      waypoints: [],
      created_at: '2025-01-15T10:00:00Z',
      updated_at: '2025-01-15T10:00:00Z'
    }

    it('calls GET /missions/{id}', async () => {
      mockMissionApiRequest.mockResolvedValueOnce(mockMission)

      const result = await getMissionById('m-001')

      expect(mockMissionApiRequest).toHaveBeenCalledWith('/missions/m-001')
      expect(result).toEqual(mockMission)
    })
  })

  describe('createMission', () => {
    const mockData: import('~/types/mission').MissionCreateInput = {
      name: 'New Mission',
      status: 'IDLE',
      coordinate_frame: 'wgs84'
    }
    const mockResponse = {
      id: 'm-002',
      ...mockData,
      waypoints: [],
      created_at: '2025-01-15T10:00:00Z',
      updated_at: '2025-01-15T10:00:00Z'
    }

    it('calls POST /missions with body', async () => {
      mockMissionApiRequest.mockResolvedValueOnce(mockResponse)

      const result = await createMission(mockData)

      expect(mockMissionApiRequest).toHaveBeenCalledWith('/missions', {
        method: 'POST',
        body: mockData
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('updateMission', () => {
    const mockUpdate: import('~/types/mission').MissionUpdateInput = {
      name: 'Updated Mission',
      status: 'planned'
    }
    const mockResponse = {
      id: 'm-001',
      name: 'Updated Mission',
      status: 'planned',
      coordinate_frame: 'wgs84',
      waypoints: [],
      created_at: '2025-01-15T10:00:00Z',
      updated_at: '2025-01-15T11:00:00Z'
    }

    it('calls PATCH /missions/{id} with data', async () => {
      mockMissionApiRequest.mockResolvedValueOnce(mockResponse)

      const result = await updateMission('m-001', mockUpdate)

      expect(mockMissionApiRequest).toHaveBeenCalledWith('/missions/m-001', {
        method: 'PATCH',
        body: mockUpdate
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('deleteMission', () => {
    it('calls DELETE /missions/{id}', async () => {
      mockMissionApiRequest.mockResolvedValueOnce(undefined)

      const result = await deleteMission('m-001')

      expect(mockMissionApiRequest).toHaveBeenCalledWith('/missions/m-001', {
        method: 'DELETE'
      })
      expect(result).toBeUndefined()
    })
  })

  describe('patchMissionStatus', () => {
    // NOTE: patchMissionStatus was removed from missionService.ts when the
    // collector API moved to dedicated /start|pause|resume|stop endpoints.
    // It is still used by the legacy missionStore.ts, which has its own
    // helper. No tests for it here.
    it.skip('removed (covered by legacy missionStore)', () => {})
  })

  // ────────────────────────────────────────────────────────────────────────
  // Waypoints
  // ────────────────────────────────────────────────────────────────────────

  describe('createWaypoint', () => {
    const mockData = {
      sequence: 0,
      latitude: -6.2088,
      longitude: 106.8456,
      altitude: 100
    }
    const mockResponse = {
      id: 'wp-001',
      ...mockData,
      created_at: '2025-01-15T10:00:00Z',
      updated_at: '2025-01-15T10:00:00Z'
    }

    it('calls POST /missions/{id}/waypoints with body', async () => {
      mockMissionApiRequest.mockResolvedValueOnce(mockResponse)

      const result = await createWaypoint('m-001', mockData)

      expect(mockMissionApiRequest).toHaveBeenCalledWith(
        '/missions/m-001/waypoints',
        {
          method: 'POST',
          body: mockData
        }
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getWaypoint', () => {
    const mockResponse = {
      id: 'wp-001',
      sequence: 0,
      latitude: -6.2088,
      longitude: 106.8456,
      altitude: 100,
      created_at: '2025-01-15T10:00:00Z',
      updated_at: '2025-01-15T10:00:00Z'
    }

    it('calls GET /missions/{id}/waypoints/{waypointId}', async () => {
      mockMissionApiRequest.mockResolvedValueOnce(mockResponse)

      const result = await getWaypoint('m-001', 'wp-001')

      expect(mockMissionApiRequest).toHaveBeenCalledWith(
        '/missions/m-001/waypoints/wp-001'
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('updateWaypoint', () => {
    const mockUpdate = { altitude: 150 }
    const mockResponse = {
      id: 'wp-001',
      sequence: 0,
      latitude: -6.2088,
      longitude: 106.8456,
      altitude: 150,
      created_at: '2025-01-15T10:00:00Z',
      updated_at: '2025-01-15T11:00:00Z'
    }

    it('calls PATCH /missions/{id}/waypoints/{waypointId} with data', async () => {
      mockMissionApiRequest.mockResolvedValueOnce(mockResponse)

      const result = await updateWaypoint('m-001', 'wp-001', mockUpdate)

      expect(mockMissionApiRequest).toHaveBeenCalledWith(
        '/missions/m-001/waypoints/wp-001',
        {
          method: 'PATCH',
          body: mockUpdate
        }
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('deleteWaypoint', () => {
    it('calls DELETE /missions/{id}/waypoints/{waypointId}', async () => {
      mockMissionApiRequest.mockResolvedValueOnce(undefined)

      const result = await deleteWaypoint('m-001', 'wp-001')

      expect(mockMissionApiRequest).toHaveBeenCalledWith(
        '/missions/m-001/waypoints/wp-001',
        { method: 'DELETE' }
      )
      expect(result).toBeUndefined()
    })
  })

  // ────────────────────────────────────────────────────────────────────────
  // Drones
  // ────────────────────────────────────────────────────────────────────────

  describe('listDrones', () => {
    const mockResponse = {
      items: [],
      total: 0,
      limit: 25,
      offset: 0
    }

    it('calls GET /drones with defaults', async () => {
      mockMissionApiRequest.mockResolvedValueOnce(mockResponse)

      const result = await listDrones()

      expect(mockMissionApiRequest).toHaveBeenCalledWith('/drones', {
        params: {
          page: 1,
          page_size: 25
        }
      })
      expect(result).toEqual(mockResponse)
    })

    it('calls GET /drones with filters', async () => {
      mockMissionApiRequest.mockResolvedValueOnce(mockResponse)

      await listDrones({
        page: 2,
        pageSize: 10,
        search: 'DJI',
        status: 'available'
      })

      expect(mockMissionApiRequest).toHaveBeenCalledWith('/drones', {
        params: {
          page: 2,
          page_size: 10,
          search: 'DJI',
          status: 'available'
        }
      })
    })
  })

  describe('getDroneById', () => {
    const mockDrone = {
      id: 'drone-001',
      callsign: 'UAV-01',
      model: 'DJI Mavic 3',
      status: 'available'
    }

    it('calls GET /drones/{id}', async () => {
      mockMissionApiRequest.mockResolvedValueOnce(mockDrone)

      const result = await getDroneById('drone-001')

      expect(mockMissionApiRequest).toHaveBeenCalledWith('/drones/drone-001')
      expect(result).toEqual(mockDrone)
    })
  })

  // ────────────────────────────────────────────────────────────────────────
  // Survey Areas
  // ────────────────────────────────────────────────────────────────────────

  describe('listSurveyAreas', () => {
    const mockResponse = {
      items: [],
      total: 0,
      limit: 25,
      offset: 0
    }

    it('calls GET /survey-areas with defaults', async () => {
      mockMissionApiRequest.mockResolvedValueOnce(mockResponse)

      const result = await listSurveyAreas()

      expect(mockMissionApiRequest).toHaveBeenCalledWith('/survey-areas', {
        params: {
          page: 1,
          page_size: 25
        }
      })
      expect(result).toEqual(mockResponse)
    })

    it('calls GET /survey-areas with search', async () => {
      mockMissionApiRequest.mockResolvedValueOnce(mockResponse)

      await listSurveyAreas({ search: 'test' })

      expect(mockMissionApiRequest).toHaveBeenCalledWith('/survey-areas', {
        params: {
          page: 1,
          page_size: 25,
          search: 'test'
        }
      })
    })
  })

  describe('getSurveyAreaById', () => {
    const mockArea = {
      id: 'area-001',
      name: 'Test Area',
      coordinates: [[106.8456, -6.2088], [106.8556, -6.2088]]
    }

    it('calls GET /survey-areas/{id}', async () => {
      mockMissionApiRequest.mockResolvedValueOnce(mockArea)

      const result = await getSurveyAreaById('area-001')

      expect(mockMissionApiRequest).toHaveBeenCalledWith('/survey-areas/area-001')
      expect(result).toEqual(mockArea)
    })
  })

  // ────────────────────────────────────────────────────────────────────────
  // Telemetry & Reports
  // ────────────────────────────────────────────────────────────────────────

  describe('exportTelemetryCsv', () => {
    const mockBlob = new Blob(['col1,col2\n1,2'], { type: 'text/csv' })

    it('calls GET /missions/{id}/telemetry with blob response', async () => {
      mockMissionApiRequest.mockResolvedValueOnce(mockBlob)

      const result = await exportTelemetryCsv('m-001')

      expect(mockMissionApiRequest).toHaveBeenCalledWith(
        '/missions/m-001/telemetry',
        { response: 'blob' }
      )
      expect(result).toBeInstanceOf(Blob)
    })
  })

  describe('exportMissionReportPdf', () => {
    const mockBlob = new Blob([ '%PDF-1.4' ], { type: 'application/pdf' })

    it('calls GET /missions/{id}/report with blob response', async () => {
      mockMissionApiRequest.mockResolvedValueOnce(mockBlob)

      const result = await exportMissionReportPdf('m-001')

      expect(mockMissionApiRequest).toHaveBeenCalledWith(
        '/missions/m-001/report',
        { response: 'blob' }
      )
      expect(result).toBeInstanceOf(Blob)
    })
  })

  // ────────────────────────────────────────────────────────────────────────
  // MissionRecord / MissionLocation (Feature 02+)
  // ────────────────────────────────────────────────────────────────────────

  describe('listCollectorMissions', () => {
    const mockResponse = {
      items: [],
      total: 0,
      limit: 10,
      offset: 0
    }

    it('calls GET /missions with defaults', async () => {
      mockMissionApiRequest.mockResolvedValueOnce(mockResponse)

      const result = await listCollectorMissions()

      expect(mockMissionApiRequest).toHaveBeenCalledWith('/missions', {
        params: { page: 1, page_size: 10 }
      })
      expect(result).toEqual(mockResponse)
    })

    it('passes filters when provided', async () => {
      mockMissionApiRequest.mockResolvedValueOnce(mockResponse)

      await listCollectorMissions({
        page: 2,
        page_size: 5,
        search: 'survey',
        status: 'IDLE',
        sort: '-created_at'
      })

      expect(mockMissionApiRequest).toHaveBeenCalledWith('/missions', {
        params: {
          page: 2,
          page_size: 5,
          search: 'survey',
          status: 'IDLE',
          sort: '-created_at'
        }
      })
    })

    it('omits status filter when set to "all"', async () => {
      mockMissionApiRequest.mockResolvedValueOnce(mockResponse)

      await listCollectorMissions({ status: 'all' })

      expect(mockMissionApiRequest).toHaveBeenCalledWith('/missions', {
        params: { page: 1, page_size: 10 }
      })
    })
  })

  describe('getCollectorMission', () => {
    const mockMission = {
      id: 'cm-001',
      name: 'Collector Mission',
      status: 'IDLE' as const,
      created_at: '2025-01-15T10:00:00Z',
      updated_at: '2025-01-15T10:00:00Z'
    }

    it('calls GET /missions/{id}', async () => {
      mockMissionApiRequest.mockResolvedValueOnce(mockMission)

      const result = await getCollectorMission('cm-001')

      expect(mockMissionApiRequest).toHaveBeenCalledWith('/missions/cm-001')
      expect(result).toEqual(mockMission)
    })
  })

  describe('createCollectorMission', () => {
    const mockData = { name: 'New Mission' }
    const mockResponse = { id: 'cm-002', ...mockData, status: 'IDLE', created_at: '2025-01-15T10:00:00Z', updated_at: '2025-01-15T10:00:00Z' }

    it('calls POST /missions with body', async () => {
      mockMissionApiRequest.mockResolvedValueOnce(mockResponse)

      const result = await createCollectorMission(mockData)

      expect(mockMissionApiRequest).toHaveBeenCalledWith('/missions', {
        method: 'POST',
        body: mockData
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('updateCollectorMission', () => {
    const mockUpdate = { status: 'RUNNING' as const }
    const mockResponse = { id: 'cm-001', name: 'Test', ...mockUpdate, created_at: '2025-01-15T10:00:00Z', updated_at: '2025-01-15T11:00:00Z' }

    it('calls PATCH /missions/{id} with data', async () => {
      mockMissionApiRequest.mockResolvedValueOnce(mockResponse)

      const result = await updateCollectorMission('cm-001', mockUpdate)

      expect(mockMissionApiRequest).toHaveBeenCalledWith('/missions/cm-001', {
        method: 'PATCH',
        body: mockUpdate
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('deleteCollectorMission', () => {
    it('calls DELETE /missions/{id}', async () => {
      mockMissionApiRequest.mockResolvedValueOnce(undefined)

      const result = await deleteCollectorMission('cm-001')

      expect(mockMissionApiRequest).toHaveBeenCalledWith('/missions/cm-001', {
        method: 'DELETE'
      })
      expect(result).toBeUndefined()
    })
  })

  describe('collector lifecycle actions', () => {
    const mockResponse = {
      id: 'cm-001',
      name: 'Test',
      status: 'RUNNING' as const,
      created_at: '2025-01-15T10:00:00Z',
      updated_at: '2025-01-15T11:00:00Z'
    }

    it('startCollectorMission calls POST /missions/{id}/start', async () => {
      mockMissionApiRequest.mockResolvedValueOnce(mockResponse)
      const result = await startCollectorMission('cm-001')
      expect(mockMissionApiRequest).toHaveBeenCalledWith('/missions/cm-001/start', { method: 'POST' })
      expect(result.status).toBe('RUNNING')
    })

    it('pauseCollectorMission calls POST /missions/{id}/pause', async () => {
      mockMissionApiRequest.mockResolvedValueOnce(mockResponse)
      await pauseCollectorMission('cm-001')
      expect(mockMissionApiRequest).toHaveBeenCalledWith('/missions/cm-001/pause', { method: 'POST' })
    })

    it('resumeCollectorMission calls POST /missions/{id}/resume', async () => {
      mockMissionApiRequest.mockResolvedValueOnce(mockResponse)
      await resumeCollectorMission('cm-001')
      expect(mockMissionApiRequest).toHaveBeenCalledWith('/missions/cm-001/resume', { method: 'POST' })
    })
  })

  describe('collectorMissionAction', () => {
    const mockResponse = {
      id: 'cm-001',
      name: 'Test',
      status: 'RUNNING' as const,
      created_at: '2025-01-15T10:00:00Z',
      updated_at: '2025-01-15T11:00:00Z'
    }

    it('delegates start to startCollectorMission', async () => {
      mockMissionApiRequest.mockResolvedValueOnce(mockResponse)
      const result = await collectorMissionAction('cm-001', 'start')
      expect(mockMissionApiRequest).toHaveBeenCalledWith('/missions/cm-001/start', { method: 'POST' })
      expect(result.status).toBe('RUNNING')
    })

    it('delegates pause to pauseCollectorMission', async () => {
      mockMissionApiRequest.mockResolvedValueOnce(mockResponse)
      await collectorMissionAction('cm-001', 'pause')
      expect(mockMissionApiRequest).toHaveBeenCalledWith('/missions/cm-001/pause', { method: 'POST' })
    })

    it('delegates resume to resumeCollectorMission', async () => {
      mockMissionApiRequest.mockResolvedValueOnce(mockResponse)
      await collectorMissionAction('cm-001', 'resume')
      expect(mockMissionApiRequest).toHaveBeenCalledWith('/missions/cm-001/resume', { method: 'POST' })
    })

    it('delegates stop to stopCollectorMission', async () => {
      mockMissionApiRequest.mockResolvedValueOnce(mockResponse)
      await collectorMissionAction('cm-001', 'stop')
      expect(mockMissionApiRequest).toHaveBeenCalledWith('/missions/cm-001/stop', { method: 'POST' })
    })
  })

  describe('listLocations', () => {
    const mockResponse = {
      items: [],
      total: 0,
      limit: 20,
      offset: 0
    }

    it('calls GET /missions/{id}/locations with defaults', async () => {
      mockMissionApiRequest.mockResolvedValueOnce(mockResponse)

      const result = await listLocations('cm-001')

      expect(mockMissionApiRequest).toHaveBeenCalledWith('/missions/cm-001/locations', {
        params: { page: 1, page_size: 20 }
      })
      expect(result).toEqual(mockResponse)
    })

    it('passes sort param', async () => {
      mockMissionApiRequest.mockResolvedValueOnce(mockResponse)
      await listLocations('cm-001', { sort: '-order_index' })
      expect(mockMissionApiRequest).toHaveBeenCalledWith('/missions/cm-001/locations', {
        params: { page: 1, page_size: 20, sort: '-order_index' }
      })
    })
  })

  describe('createLocation', () => {
    const mockData = { latitude: -6.2088, longitude: 106.8456, order_index: 0 }
    const mockResponse = { id: 'loc-001', mission_id: 'cm-001', ...mockData, created_at: '2025-01-15T10:00:00Z', updated_at: '2025-01-15T10:00:00Z' }

    it('calls POST /missions/{id}/locations', async () => {
      mockMissionApiRequest.mockResolvedValueOnce(mockResponse)
      const result = await createLocation('cm-001', mockData)
      expect(mockMissionApiRequest).toHaveBeenCalledWith('/missions/cm-001/locations', {
        method: 'POST',
        body: mockData
      })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('deleteLocation', () => {
    it('calls DELETE /missions/{id}/locations/{locationId}', async () => {
      mockMissionApiRequest.mockResolvedValueOnce(undefined)
      const result = await deleteLocation('cm-001', 'loc-001')
      expect(mockMissionApiRequest).toHaveBeenCalledWith('/missions/cm-001/locations/loc-001', {
        method: 'DELETE'
      })
      expect(result).toBeUndefined()
    })
  })

  describe('uploadLocationsCSV', () => {
    const mockResult = { total_rows: 5, success_rows: 4, failed_rows: 1, errors: [] }

    it('calls POST /missions/{id}/locations/upload with FormData', async () => {
      mockMissionApiRequest.mockResolvedValueOnce(mockResult)

      const file = new File(['lat,lon\n-6.2,106.8'], 'locations.csv', { type: 'text/csv' })
      const result = await uploadLocationsCSV('cm-001', file)

      expect(mockMissionApiRequest).toHaveBeenCalledWith(
        '/missions/cm-001/locations/upload',
        expect.objectContaining({ method: 'POST' })
      )
      expect(result).toEqual(mockResult)
    })
  })
})
