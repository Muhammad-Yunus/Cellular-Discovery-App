import { ref, computed } from 'vue'
import type { MissionLocation, MissionLocationCreate } from '~/types/mission'
import * as locationService from '~/services/missionService'
import { useCustomToast } from '@/composables/useCustomToast'

export function useLocation(missionId: string) {
  const toast = useCustomToast()
  const locations = ref<MissionLocation[]>([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const page = ref(1)
  const pageSize = ref(20)
  const sort = ref<string | null>(null)

  const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

  async function fetchLocations() {
    loading.value = true
    error.value = null
    try {
      const params: import('~/types/mission').ListLocationsParams = {
        page: page.value,
        page_size: pageSize.value,
        ...(sort.value ? { sort: sort.value } : {})
      }
      const result = await locationService.listLocations(missionId, params)
      locations.value = result.items
      total.value = result.total
    } catch (e) {
      const { parseApiError } = await import('~/types/api')
      error.value = parseApiError(e).message
    } finally {
      loading.value = false
    }
  }

  async function addLocation(data: MissionLocationCreate) {
    loading.value = true
    error.value = null
    try {
      const result = await locationService.createLocation(missionId, data)
      locations.value.push(result)
      total.value += 1
      toast.add({ title: 'Location added', description: 'Location created successfully', color: 'success' })
    } catch (e) {
      const { parseApiError } = await import('~/types/api')
      error.value = parseApiError(e).message
      toast.add({ title: 'Failed to add location', description: error.value ?? 'Unknown error', color: 'error' })
      throw e
    } finally {
      loading.value = false
    }
  }

  async function removeLocation(locationId: string) {
    loading.value = true
    error.value = null
    try {
      await locationService.deleteLocation(missionId, locationId)
      locations.value = locations.value.filter(l => l.id !== locationId)
      total.value -= 1
      toast.add({ title: 'Location deleted', description: 'Location removed successfully', color: 'success' })
    } catch (e) {
      const { parseApiError } = await import('~/types/api')
      error.value = parseApiError(e).message
      toast.add({ title: 'Failed to delete location', description: error.value ?? 'Unknown error', color: 'error' })
      throw e
    } finally {
      loading.value = false
    }
  }

  async function uploadCSV(file: File) {
    loading.value = true
    error.value = null
    try {
      const result = await locationService.uploadLocationsCSV(missionId, file)
      toast.add({
        title: 'Upload complete',
        description: `${result.successful} succeeded, ${result.failed} failed`,
        color: result.failed > 0 ? 'warning' : 'success'
      })
      await fetchLocations()
    } catch (e) {
      const { parseApiError } = await import('~/types/api')
      error.value = parseApiError(e).message
      toast.add({ title: 'Upload failed', description: error.value ?? 'Unknown error', color: 'error' })
      throw e
    } finally {
      loading.value = false
    }
  }

  function setPage(p: number) {
    page.value = p
    fetchLocations()
  }

  function setSort(s: string) {
    sort.value = s
    fetchLocations()
  }

  return {
    locations,
    total,
    loading,
    error,
    page,
    pageSize,
    sort,
    totalPages,
    fetchLocations,
    addLocation,
    removeLocation,
    uploadCSV,
    setPage,
    setSort
  }
}

// Expose globally
declare module '#imports' {
  interface NuxtApp {
    $useLocation: (missionId: string) => ReturnType<typeof useLocation>
  }
}

export default useLocation
