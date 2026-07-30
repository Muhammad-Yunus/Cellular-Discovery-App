import { storeToRefs } from 'pinia'
import { useScanStore } from '~/stores/scanStore'
import { ReconnectingWebSocket, buildWsUrl } from '~/utils/websocket'
import type { WSEvent } from '~/types'
import { useCustomToast } from '@/composables/useCustomToast'

export function useScan() {
  const toast = useCustomToast()
  const scanStore = useScanStore()
  const { scans, selectedScan, loading, creating, error, pagination, selectedScanId, wsConnected } = storeToRefs(scanStore)

  let ws: ReconnectingWebSocket | null = null

  function notify(title: string, color: 'success' | 'error', icon: string) {
    toast.add({ title, description: undefined, color, icon })
  }

  function getWebSocketUrl(): string {
    const config = useRuntimeConfig()
    return buildWsUrl(config.public.apiBase as string, '/ws/scan')
  }

  function connectWs() {
    ws = new ReconnectingWebSocket(getWebSocketUrl())

    ws.onMessage((data) => {
      const event = data as WSEvent
      if (event.event === 'scan_complete') {
        scanStore.fetchScans()
        notify('Scan complete', 'success', 'i-lucide-check-circle-2')
      }
    })

    ws.onStatusChange((status) => {
      scanStore.setWsConnected(status === 'connected')
    })

    ws.connect()
  }

  async function fetchScans() {
    await scanStore.fetchScans()
  }

  async function startScan() {
    try {
      const result = await scanStore.createScan()
      notify('Scan started successfully', 'success', 'i-lucide-check-circle')
      return result
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Scan failed. Please try again.'
      notify(msg, 'error', 'i-lucide-alert-circle')
      throw e
    }
  }

  function selectScan(id: string | null) {
    scanStore.selectScan(id)
  }

  async function removeScan(id: string) {
    try {
      await scanStore.deleteScan(id)
      notify('Scan deleted', 'success', 'i-lucide-trash-2')
    } catch {
      notify('Failed to delete scan', 'error', 'i-lucide-alert-circle')
    }
  }

  function setPage(page: number) {
    scanStore.setPage(page)
  }

  function setSearch(search: string) {
    scanStore.setSearch(search)
  }

  function setDateRange(startDate?: string | null, endDate?: string | null) {
    scanStore.setDateRange(startDate, endDate)
  }

  onMounted(() => {
    connectWs()
    scanStore.fetchScans()
  })

  onUnmounted(() => {
    ws?.disconnect()
    ws = null
  })

  return {
    scans,
    selectedScan,
    selectedScanId,
    loading,
    creating,
    error,
    pagination,
    wsConnected,
    fetchScans,
    startScan,
    selectScan,
    removeScan,
    setPage,
    setSearch,
    setDateRange
  }
}
