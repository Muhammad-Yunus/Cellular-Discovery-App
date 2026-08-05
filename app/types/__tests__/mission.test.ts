import { describe, it, expect } from 'vitest'
import type {
  Mission,
  MissionCreateInput,
  MissionUpdateInput,
  Waypoint,
  WaypointCreateInput,
  Drone,
  SurveyArea,
  MissionStatus,
  WaypointAction,
  CoordinateFrame,
  MissionListResponse,
  // Feature 02 — spec-compliant types
  MissionStatus5,
  MissionLocationCreate,
  MissionLocationUploadRow,
  MissionRecord,
  MissionRecordCreate,
  MissionRecordUpdate,
  MissionPaginated,
  LocationPaginated,
  ListMissionsParams,
  ListLocationsParams,
  MissionWSAction,
  MissionWSEvent,
  MissionGPSUpdate,
  MissionLogEntry,
  CSVUploadResult,
  CSVUploadError
} from '../mission'
import {
  MISSION_STATUS_LABELS,
  MISSION_STATUS_COLOR
} from '../mission'

describe('Mission Types', () => {
  describe('MissionStatus', () => {
    it('accepts all valid status values', () => {
      const statuses: MissionStatus[] = [
        'draft',
        'planned',
        'approved',
        'in_progress',
        'paused',
        'completed',
        'failed',
        'cancelled'
      ]
      statuses.forEach(status => expect(typeof status).toBe('string'))
    })
  })

  describe('WaypointAction', () => {
    it('accepts all valid action values', () => {
      const actions: WaypointAction[] = [
        'survey',
        'scan',
        'hover',
        'photo',
        'video',
        'sensor_read'
      ]
      actions.forEach(action => expect(typeof action).toBe('string'))
    })
  })

  describe('CoordinateFrame', () => {
    it('accepts valid coordinate frames', () => {
      const frames: CoordinateFrame[] = ['wgs84', 'utm']
      frames.forEach(frame => expect(typeof frame).toBe('string'))
    })
  })

  describe('Waypoint', () => {
    it('creates a valid waypoint with required fields', () => {
      const waypoint: Waypoint = {
        id: 'wp-001',
        sequence: 0,
        latitude: -6.2088,
        longitude: 106.8456,
        altitude: 100
      }
      expect(waypoint.id).toBe('wp-001')
      expect(waypoint.sequence).toBe(0)
      expect(waypoint.latitude).toBe(-6.2088)
      expect(waypoint.longitude).toBe(106.8456)
      expect(waypoint.altitude).toBe(100)
    })

    it('allows optional fields', () => {
      const waypoint: Waypoint = {
        id: 'wp-002',
        sequence: 1,
        latitude: -6.2088,
        longitude: 106.8456,
        altitude: 150,
        speed: 5,
        hold_time: 10,
        action: 'survey',
        notes: 'Test waypoint'
      }
      expect(waypoint.speed).toBe(5)
      expect(waypoint.hold_time).toBe(10)
      expect(waypoint.action).toBe('survey')
    })
  })

  describe('WaypointCreateInput', () => {
    it('creates valid input without id and timestamps', () => {
      const input: WaypointCreateInput = {
        sequence: 0,
        latitude: -6.2088,
        longitude: 106.8456,
        altitude: 100
      }
      expect(input.sequence).toBe(0)
      expect(input.latitude).toBe(-6.2088)
    })
  })

  describe('Drone', () => {
    it('creates a valid drone with required fields', () => {
      const drone: Drone = {
        id: 'drone-001',
        callsign: 'UAV-01',
        model: 'DJI Mavic 3',
        status: 'available'
      }
      expect(drone.id).toBe('drone-001')
      expect(drone.callsign).toBe('UAV-01')
      expect(drone.status).toBe('available')
    })

    it('allows optional fields', () => {
      const drone: Drone = {
        id: 'drone-002',
        callsign: 'UAV-02',
        model: 'DJI Phantom 4',
        firmware_version: '1.0.0',
        last_known_latitude: -6.2088,
        last_known_longitude: 106.8456,
        last_seen_at: '2025-01-15T10:00:00Z',
        status: 'assigned',
        notes: 'Primary UAV'
      }
      expect(drone.firmware_version).toBe('1.0.0')
      expect(drone.status).toBe('assigned')
    })
  })

  describe('SurveyArea', () => {
    it('creates a valid survey area with required fields', () => {
      const area: SurveyArea = {
        id: 'area-001',
        name: 'Test Area',
        coordinates: [
          [106.8456, -6.2088],
          [106.8556, -6.2088],
          [106.8556, -6.2188],
          [106.8456, -6.2188]
        ]
      }
      expect(area.name).toBe('Test Area')
      expect(area.coordinates.length).toBe(4)
    })

    it('allows optional area and notes', () => {
      const area: SurveyArea = {
        id: 'area-002',
        name: 'Large Area',
        coordinates: [[106.8456, -6.2088], [106.8556, -6.2088]],
        area_m2: 1500,
        notes: 'Survey zone A'
      }
      expect(area.area_m2).toBe(1500)
    })
  })

  describe('Mission', () => {
    it('creates a valid mission with required fields', () => {
      const mission: Mission = {
        id: 'mission-001',
        name: 'Test Mission',
        status: 'draft',
        coordinate_frame: 'wgs84',
        waypoints: [],
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z'
      }
      expect(mission.id).toBe('mission-001')
      expect(mission.status).toBe('draft')
      expect(mission.waypoints).toEqual([])
    })

    it('allows optional fields', () => {
      const mission: Mission = {
        id: 'mission-002',
        name: 'Complex Mission',
        description: 'A detailed survey mission',
        status: 'planned',
        drone_id: 'drone-001',
        survey_area_id: 'area-001',
        coordinate_frame: 'wgs84',
        planned_start_at: '2025-01-20T08:00:00Z',
        planned_end_at: '2025-01-20T10:00:00Z',
        started_at: '2025-01-20T08:05:00Z',
        waypoints: [],
        drone: undefined,
        survey_area: undefined,
        metrics: { battery: 85, distance: 1200 },
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:05:00Z'
      }
      expect(mission.drone_id).toBe('drone-001')
      expect(mission.metrics?.battery).toBe(85)
    })
  })

  describe('MissionCreateInput', () => {
    it('creates valid input without backend-assigned fields', () => {
      const input: MissionCreateInput = {
        name: 'New Mission',
        description: 'Mission description',
        status: 'draft',
        coordinate_frame: 'wgs84',
        planned_start_at: '2025-01-20T08:00:00Z',
        planned_end_at: '2025-01-20T10:00:00Z'
      }
      expect(input.name).toBe('New Mission')
      expect(input.status).toBe('draft')
    })

    it('allows waypoints in create input', () => {
      const input: MissionCreateInput = {
        name: 'Mission with waypoints',
        status: 'draft',
        coordinate_frame: 'wgs84',
        waypoints: [
          { sequence: 0, latitude: -6.2088, longitude: 106.8456, altitude: 100 }
        ]
      }
      expect(input.waypoints).toHaveLength(1)
      expect(input.waypoints![0]!.sequence).toBe(0)
    })
  })

  describe('MissionUpdateInput', () => {
    it('allows partial updates', () => {
      const update: MissionUpdateInput = {
        name: 'Updated Mission',
        status: 'approved'
      }
      expect(update.name).toBe('Updated Mission')
      expect(update.status).toBe('approved')
    })

    it('allows updating status', () => {
      const update: MissionUpdateInput = {
        status: 'completed'
      }
      expect(update.status).toBe('completed')
    })
  })

  describe('MissionListResponse', () => {
    it('contains paginated mission data', () => {
      const response: MissionListResponse = {
        items: [],
        total: 10,
        limit: 25,
        offset: 0
      }
      expect(response.total).toBe(10)
      expect(response.limit).toBe(25)
    })

    it('handles empty items', () => {
      const response: MissionListResponse = {
        items: [],
        total: 0,
        limit: 10,
        offset: 0
      }
      expect(response.items).toEqual([])
      expect(response.total).toBe(0)
    })
  })

  // ===================================================================
  // Feature 02 — Spec-compliant types (MissionStatus5, labels, color)
  // ===================================================================

  describe('MISSION_STATUS_LABELS', () => {
    it('contains all 5 status values', () => {
      const keys = Object.keys(MISSION_STATUS_LABELS)
      expect(keys).toHaveLength(5)
      expect(keys).toContain('draft')
      expect(keys).toContain('active')
      expect(keys).toContain('paused')
      expect(keys).toContain('completed')
      expect(keys).toContain('cancelled')
    })
  })

  describe('MISSION_STATUS_COLOR', () => {
    it('contains all 5 status values with valid colors', () => {
      const keys = Object.keys(MISSION_STATUS_COLOR)
      expect(keys).toHaveLength(5)
      expect(keys).toContain('draft')
      expect(keys).toContain('active')
      expect(keys).toContain('paused')
      expect(keys).toContain('completed')
      expect(keys).toContain('cancelled')
    })

    it('assigns valid color values', () => {
      const validColors = ['default', 'success', 'warning', 'info', 'error']
      for (const color of Object.values(MISSION_STATUS_COLOR)) {
        expect(validColors).toContain(color)
      }
    })
  })

  describe('MissionStatus5', () => {
    it('accepts all valid status values', () => {
      const statuses: MissionStatus5[] = ['draft', 'active', 'paused', 'completed', 'cancelled']
      statuses.forEach(s => expect(typeof s).toBe('string'))
    })
  })

  // ===================================================================
  // Feature 02 — MissionLocation types
  // ===================================================================

  describe('MissionLocationCreate', () => {
    it('creates valid location without required fields', () => {
      const location: MissionLocationCreate = {
        latitude: -6.2,
        longitude: 106.8
      }
      expect(location.latitude).toBe(-6.2)
      expect(location.longitude).toBe(106.8)
      expect(location.altitude).toBeUndefined()
      expect(location.order_index).toBeUndefined()
    })

    it('allows optional altitude and order_index', () => {
      const location: MissionLocationCreate = {
        latitude: -6.2,
        longitude: 106.8,
        altitude: 100,
        order_index: 0
      }
      expect(location.altitude).toBe(100)
      expect(location.order_index).toBe(0)
    })
  })

  describe('MissionLocationUploadRow', () => {
    it('accepts string values', () => {
      const row: MissionLocationUploadRow = {
        latitude: '-6.2',
        longitude: '106.8'
      }
      expect(row.latitude).toBe('-6.2')
      expect(row.longitude).toBe('106.8')
    })

    it('accepts numeric values', () => {
      const row: MissionLocationUploadRow = {
        latitude: -6.2,
        longitude: 106.8,
        altitude: 100,
        order: 0
      }
      expect(row.latitude).toBe(-6.2)
      expect(row.altitude).toBe(100)
      expect(row.order).toBe(0)
    })
  })

  // ===================================================================
  // Feature 02 — MissionRecord types
  // ===================================================================

  describe('MissionRecord', () => {
    it('creates a valid mission record with required fields', () => {
      const mission: MissionRecord = {
        id: 'm-001',
        name: 'Test Mission',
        status: 'draft',
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z'
      }
      expect(mission.id).toBe('m-001')
      expect(mission.name).toBe('Test Mission')
      expect(mission.status).toBe('draft')
    })

    it('allows optional fields', () => {
      const mission: MissionRecord = {
        id: 'm-002',
        name: 'Complex Mission',
        status: 'active',
        description: 'A detailed mission',
        location_count: 10,
        scan_count: 5,
        center_lat: -6.2,
        center_lon: 106.8,
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:05:00Z'
      }
      expect(mission.location_count).toBe(10)
      expect(mission.scan_count).toBe(5)
      expect(mission.center_lat).toBe(-6.2)
      expect(mission.center_lon).toBe(106.8)
    })
  })

  describe('MissionRecordCreate', () => {
    it('creates valid input without backend-assigned fields', () => {
      const input: MissionRecordCreate = {
        name: 'New Mission',
        description: 'Mission description'
      }
      expect(input.name).toBe('New Mission')
      expect(input.description).toBe('Mission description')
      expect(input.center_lat).toBeUndefined()
      expect(input.center_lon).toBeUndefined()
    })

    it('allows optional center coordinates', () => {
      const input: MissionRecordCreate = {
        name: 'Start at known point',
        center_lat: -6.2088,
        center_lon: 106.8456
      }
      expect(input.center_lat).toBe(-6.2088)
      expect(input.center_lon).toBe(106.8456)
    })
  })

  describe('MissionRecordUpdate', () => {
    it('allows partial updates', () => {
      const update: MissionRecordUpdate = {
        name: 'Updated Mission',
        status: 'active'
      }
      expect(update.name).toBe('Updated Mission')
      expect(update.status).toBe('active')
    })

    it('allows null description', () => {
      const update: MissionRecordUpdate = {
        description: null
      }
      expect(update.description).toBeNull()
    })
  })

  // ===================================================================
  // Feature 02 — Paginated types
  // ===================================================================

  describe('MissionPaginated', () => {
    it('contains paginated mission data', () => {
      const response: MissionPaginated = {
        items: [],
        total: 10,
        limit: 25,
        offset: 0
      }
      expect(response.total).toBe(10)
      expect(response.limit).toBe(25)
    })
  })

  describe('LocationPaginated', () => {
    it('contains paginated location data', () => {
      const response: LocationPaginated = {
        items: [],
        total: 5,
        limit: 10,
        offset: 0
      }
      expect(response.total).toBe(5)
      expect(response.items).toEqual([])
    })
  })

  // ===================================================================
  // Feature 02 — Query params
  // ===================================================================

  describe('ListMissionsParams', () => {
    it('has valid default values', () => {
      const params: ListMissionsParams = {}
      expect(params.page).toBeUndefined()
      expect(params.page_size).toBeUndefined()
    })

    it('allows all optional fields', () => {
      const params: ListMissionsParams = {
        page: 1,
        page_size: 25,
        search: 'test',
        status: 'active',
        sort: '-created_at'
      }
      expect(params.page).toBe(1)
      expect(params.status).toBe('active')
      expect(params.sort).toBe('-created_at')
    })
  })

  describe('ListLocationsParams', () => {
    it('has valid default values', () => {
      const params: ListLocationsParams = {}
      expect(params.page).toBeUndefined()
    })

    it('allows optional fields', () => {
      const params: ListLocationsParams = {
        page: 1,
        page_size: 20,
        sort: 'order_index'
      }
      expect(params.page).toBe(1)
      expect(params.sort).toBe('order_index')
    })
  })

  // ===================================================================
  // Feature 02 — WebSocket event types
  // ===================================================================

  describe('MissionWSAction', () => {
    it('is a union literal', () => {
      const actions: MissionWSAction[] = [
        'mission.status_changed',
        'mission.location_uploaded',
        'mission.scan_collected',
        'mission.gps_update',
        'mission.log_entry'
      ]
      actions.forEach(action => expect(typeof action).toBe('string'))
    })
  })

  describe('MissionWSEvent', () => {
    it('creates a valid event', () => {
      const event: MissionWSEvent = {
        action: 'mission.status_changed',
        mission_id: 'm-001',
        data: { from: 'draft', to: 'active' },
        timestamp: '2025-01-15T10:00:00Z'
      }
      expect(event.action).toBe('mission.status_changed')
      expect(event.mission_id).toBe('m-001')
      expect(event.data).toEqual({ from: 'draft', to: 'active' })
    })

    it('allows any data shape', () => {
      const event: MissionWSEvent = {
        action: 'mission.gps_update',
        mission_id: 'm-001',
        data: { lat: -6.2, lon: 106.8 },
        timestamp: '2025-01-15T10:00:00Z'
      }
      expect(event.data).toHaveProperty('lat')
      expect(event.data).toHaveProperty('lon')
    })
  })

  describe('MissionGPSUpdate', () => {
    it('creates valid GPS update', () => {
      const gps: MissionGPSUpdate = {
        lat: -6.2088,
        lon: 106.8456
      }
      expect(gps.lat).toBe(-6.2088)
      expect(gps.lon).toBe(106.8456)
      expect(gps.alt).toBeUndefined()
    })

    it('allows optional altitude', () => {
      const gps: MissionGPSUpdate = {
        lat: -6.2088,
        lon: 106.8456,
        alt: 150
      }
      expect(gps.alt).toBe(150)
    })
  })

  describe('MissionLogEntry', () => {
    it('creates a valid log entry', () => {
      const entry: MissionLogEntry = {
        level: 'info',
        message: 'Mission started',
        ts: '2025-01-15T10:00:00Z'
      }
      expect(entry.level).toBe('info')
      expect(entry.message).toBe('Mission started')
    })

    it('allows warn and error levels', () => {
      expect(() => {
        const _warn: MissionLogEntry = {
          level: 'warn',
          message: 'Low battery',
          ts: '2025-01-15T10:00:00Z'
        }
      }).not.toThrow()

      expect(() => {
        const _error: MissionLogEntry = {
          level: 'error',
          message: 'GPS lost',
          ts: '2025-01-15T10:00:00Z'
        }
      }).not.toThrow()
    })
  })

  // ===================================================================
  // Feature 02 — CSV upload types
  // ===================================================================

  describe('CSVUploadError', () => {
    it('is a discriminated-ish shape with required fields', () => {
      const error: CSVUploadError = {
        row: 1,
        message: 'Invalid latitude'
      }
      expect(error.row).toBe(1)
      expect(error.message).toBe('Invalid latitude')
    })

    it('allows optional column', () => {
      const error: CSVUploadError = {
        row: 2,
        column: 'latitude',
        message: 'Expected number, got "abc"'
      }
      expect(error.column).toBe('latitude')
    })
  })

  describe('CSVUploadResult', () => {
    it('creates valid result with no errors', () => {
      const result: CSVUploadResult = {
        total_rows: 5,
        success_rows: 5,
        failed_rows: 0,
        errors: []
      }
      expect(result.total_rows).toBe(5)
      expect(result.success_rows).toBe(5)
      expect(result.failed_rows).toBe(0)
      expect(result.errors).toEqual([])
    })

    it('creates result with errors', () => {
      const result: CSVUploadResult = {
        total_rows: 3,
        success_rows: 2,
        failed_rows: 1,
        errors: [
          { row: 2, column: 'latitude', message: 'Invalid coordinate' }
        ]
      }
      expect(result.failed_rows).toBe(1)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]!.row).toBe(2)
    })
  })
})
