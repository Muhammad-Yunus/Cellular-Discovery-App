import { storeToRefs } from 'pinia'
import { useSystemStore } from '~/stores/systemStore'
import * as systemService from '~/services/system.service'
import { useCustomToast } from '@/composables/useCustomToast'

export function useSystem() {
  const toast = useCustomToast()
  const systemStore = useSystemStore()
  const { backendStatus, cliStatus, responseTime, lastCheck, error } = storeToRefs(systemStore)

  let healthInterval: ReturnType<typeof setInterval> | null = null
  let cliInterval: ReturnType<typeof setInterval> | null = null
  let previousBackendStatus: string | null = null

  function notify(title: string, color: 'success' | 'error', icon: string) {
    toast.add({ title, description: undefined, color, icon })
  }

  async function checkNow() {
    const startTime = performance.now()
    try {
      const health = await systemService.getHealth()
      const elapsed = Math.round(performance.now() - startTime)

      systemStore.setHealth(
        health.status === 'ok' ? 'ok' : 'unavailable',
        elapsed
      )
      systemStore.setError(null)

      if (previousBackendStatus === 'ok' && health.status !== 'ok') {
        notify('Backend connection lost', 'error', 'i-lucide-alert-triangle')
      }
      previousBackendStatus = health.status === 'ok' ? 'ok' : 'unavailable'
    } catch {
      const elapsed = Math.round(performance.now() - startTime)
      systemStore.setHealth('unavailable', elapsed)
      systemStore.setError('Backend is not responding')

      if (previousBackendStatus === 'ok') {
        notify('Backend connection lost', 'error', 'i-lucide-alert-triangle')
      }
      previousBackendStatus = 'unavailable'
    }
  }

  async function checkCLI() {
    try {
      const status = await systemService.checkCLIStatus()
      systemStore.setCLIStatus(status.status)
    } catch {
      systemStore.setCLIStatus('unknown')
    }
  }

  function startPolling(intervalMs = 30000) {
    checkNow()
    healthInterval = setInterval(checkNow, intervalMs)

    checkCLI()
    cliInterval = setInterval(checkCLI, 60000)
  }

  function stopPolling() {
    if (healthInterval) {
      clearInterval(healthInterval)
      healthInterval = null
    }
    if (cliInterval) {
      clearInterval(cliInterval)
      cliInterval = null
    }
  }

  onMounted(() => {
    startPolling()
  })

  onUnmounted(() => {
    stopPolling()
  })

  return {
    backendStatus,
    cliStatus,
    responseTime,
    lastCheck,
    error,
    checkNow,
    startPolling,
    stopPolling
  }
}
