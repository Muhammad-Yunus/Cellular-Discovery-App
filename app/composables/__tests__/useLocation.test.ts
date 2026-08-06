import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'

vi.mock('~/services/missionService', () => ({
  listLocations: vi.fn(),
  createLocation: vi.fn(),
  deleteLocation: vi.fn(),
  uploadLocationsCSV: vi.fn()
}))

vi.mock('@/composables/useCustomToast', () => ({
  useCustomToast: () => ({
    toasts: ref([]),
    add: (...args: unknown[]) => toastAddSpy(...args),
    remove: vi.fn(),
    colorClass: vi.fn()
  })
}))

const toastAddSpy = vi.fn()

describe('useLocation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('returns locations, total, loading, error, and actions', async () => {
    const { useLocation } = await import('../useLocation')
    const result = useLocation('mission-1')

    expect(result.locations).toBeDefined()
    expect(result.total).toBeDefined()
    expect(result.loading).toBeDefined()
    expect(result.error).toBeDefined()
    expect(result.fetchLocations).toBeDefined()
    expect(result.addLocation).toBeDefined()
    expect(result.removeLocation).toBeDefined()
    expect(result.uploadCSV).toBeDefined()
    expect(result.setPage).toBeDefined()
    expect(result.setSort).toBeDefined()
  })

  it('fetches locations on init', async () => {
    const { listLocations } = await import('~/services/missionService')
    vi.mocked(listLocations).mockResolvedValue({
      items: [],
      total: 0,
      limit: 20,
      offset: 0
    })

    const { useLocation } = await import('../useLocation')
    const result = useLocation('mission-1')

    await result.fetchLocations()

    expect(listLocations).toHaveBeenCalledWith('mission-1', { page: 1, page_size: 20 })
    expect(result.locations.value).toEqual([])
    expect(result.total.value).toBe(0)
  })

  it('shows error when fetch fails', async () => {
    const { listLocations } = await import('~/services/missionService')
    vi.mocked(listLocations).mockRejectedValue(new Error('fetch failed'))

    const { useLocation } = await import('../useLocation')
    const result = useLocation('mission-1')

    await result.fetchLocations()

    expect(result.error.value).toBeDefined()
  })

  it('calculates totalPages correctly', async () => {
    const { listLocations } = await import('~/services/missionService')
    vi.mocked(listLocations).mockResolvedValue({
      items: [],
      total: 50,
      limit: 20,
      offset: 0
    })

    const { useLocation } = await import('../useLocation')
    const result = useLocation('mission-1')

    await result.fetchLocations()

    expect(result.totalPages.value).toBe(3)
  })

  it('adds location and shows success toast', async () => {
    const { createLocation } = await import('~/services/missionService')
    vi.mocked(createLocation).mockResolvedValue({
      id: 'loc-1',
      mission_id: 'mission-1',
      latitude: -6.2,
      longitude: 106.8,
      order_index: 0,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z'
    })

    const { useLocation } = await import('../useLocation')
    const result = useLocation('mission-1')

    await result.addLocation({ latitude: -6.2, longitude: 106.8 })

    expect(createLocation).toHaveBeenCalled()
    expect(toastAddSpy).toHaveBeenCalledWith(expect.objectContaining({
      color: 'success'
    }))
  })

  it('shows error toast when adding fails', async () => {
    const { createLocation } = await import('~/services/missionService')
    vi.mocked(createLocation).mockRejectedValue(new Error('add failed'))

    const { useLocation } = await import('../useLocation')
    const result = useLocation('mission-1')

    await result.addLocation({ latitude: -6.2, longitude: 106.8 }).catch(() => {})

    expect(toastAddSpy).toHaveBeenCalledWith(expect.objectContaining({
      color: 'error'
    }))
  })

  it('removes location and updates total', async () => {
    const { deleteLocation } = await import('~/services/missionService')
    vi.mocked(deleteLocation).mockResolvedValue(undefined)

    const { useLocation } = await import('../useLocation')
    const result = useLocation('mission-1')

    // Add a location first
    result.locations.value = [{
      id: 'loc-1',
      mission_id: 'mission-1',
      latitude: -6.2,
      longitude: 106.8,
      order_index: 0,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z'
    }]
    result.total.value = 1

    await result.removeLocation('loc-1')

    expect(deleteLocation).toHaveBeenCalledWith('mission-1', 'loc-1')
    expect(result.locations.value).toEqual([])
    expect(result.total.value).toBe(0)
  })

  it('shows error toast when deleting fails', async () => {
    const { deleteLocation } = await import('~/services/missionService')
    vi.mocked(deleteLocation).mockRejectedValue(new Error('delete failed'))

    const { useLocation } = await import('../useLocation')
    const result = useLocation('mission-1')

    await result.removeLocation('loc-1').catch(() => {})

    expect(toastAddSpy).toHaveBeenCalledWith(expect.objectContaining({
      color: 'error'
    }))
  })

  it('uploads CSV and refreshes locations', async () => {
    const { uploadLocationsCSV } = await import('~/services/missionService')
    vi.mocked(uploadLocationsCSV).mockResolvedValue({
      total_rows: 5,
      success_rows: 5,
      failed_rows: 0,
      errors: []
    })

    const { useLocation } = await import('../useLocation')
    const result = useLocation('mission-1')

    const file = new File(['lat,lon\n-6.2,106.8'], 'locations.csv', { type: 'text/csv' })
    await result.uploadCSV(file)

    expect(uploadLocationsCSV).toHaveBeenCalledWith('mission-1', file)
    expect(toastAddSpy).toHaveBeenCalledWith(expect.objectContaining({
      color: 'success'
    }))
  })

  it('shows warning toast when CSV upload has failures', async () => {
    const { uploadLocationsCSV } = await import('~/services/missionService')
    vi.mocked(uploadLocationsCSV).mockResolvedValue({
      total_rows: 7,
      success_rows: 5,
      failed_rows: 2,
      errors: [{ row: 3, message: 'Invalid row 3' }]
    })

    const { useLocation } = await import('../useLocation')
    const result = useLocation('mission-1')

    const file = new File(['lat,lon\n-6.2,106.8'], 'locations.csv', { type: 'text/csv' })
    await result.uploadCSV(file)

    expect(toastAddSpy).toHaveBeenCalledWith(expect.objectContaining({
      color: 'warning'
    }))
  })
})
