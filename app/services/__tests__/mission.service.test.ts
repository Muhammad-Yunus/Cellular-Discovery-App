import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  listMissions,
  getMissionById,
  createMission,
  updateMission,
  deleteMission,
  patchMissionStatus,
  createWaypoint,
  getWaypoint,
  updateWaypoint,
  deleteWaypoint,
  listDrones,
  getDroneById,
  listSurveyAreas,
  getSurveyAreaById,
  exportTelemetryCsv,
  exportMissionReportPdf
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
        status: 'draft',
        drone_id: 'drone-001',
        search: 'survey',
        sort: '-created_at'
      })

      expect(mockMissionApiRequest).toHaveBeenCalledWith('/missions', {
        params: {
          page: 2,
          page_size: 10,
          status: 'draft',
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
      status: 'draft',
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
      status: 'draft',
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
    const mockResponse = {
      id: 'm-001',
      name: 'Test Mission',
      status: 'in_progress',
      coordinate_frame: 'wgs84',
      waypoints: [],
      created_at: '2025-01-15T10:00:00Z',
      updated_at: '2025-01-15T11:00:00Z'
    }

    it('calls PATCH /missions/{id}/actions/{action} for start', async () => {
      mockMissionApiRequest.mockResolvedValueOnce(mockResponse)

      const result = await patchMissionStatus('m-001', 'start')

      expect(mockMissionApiRequest).toHaveBeenCalledWith(
        '/missions/m-001/actions/start',
        { method: 'PATCH' }
      )
      expect(result.status).toBe('in_progress')
    })

    it('calls PATCH /missions/{id}/actions/{action} for pause', async () => {
      mockMissionApiRequest.mockResolvedValueOnce(mockResponse)

      await patchMissionStatus('m-001', 'pause')

      expect(mockMissionApiRequest).toHaveBeenCalledWith(
        '/missions/m-001/actions/pause',
        { method: 'PATCH' }
      )
    })

    it('calls PATCH /missions/{id}/actions/{action} for resume', async () => {
      mockMissionApiRequest.mockResolvedValueOnce(mockResponse)

      await patchMissionStatus('m-001', 'resume')

      expect(mockMissionApiRequest).toHaveBeenCalledWith(
        '/missions/m-001/actions/resume',
        { method: 'PATCH' }
      )
    })

    it('calls PATCH /missions/{id}/actions/{action} for complete', async () => {
      mockMissionApiRequest.mockResolvedValueOnce(mockResponse)

      await patchMissionStatus('m-001', 'complete')

      expect(mockMissionApiRequest).toHaveBeenCalledWith(
        '/missions/m-001/actions/complete',
        { method: 'PATCH' }
      )
    })

    it('calls PATCH /missions/{id}/actions/{action} for cancel', async () => {
      mockMissionApiRequest.mockResolvedValueOnce(mockResponse)

      await patchMissionStatus('m-001', 'cancel')

      expect(mockMissionApiRequest).toHaveBeenCalledWith(
        '/missions/m-001/actions/cancel',
        { method: 'PATCH' }
      )
    })
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
})