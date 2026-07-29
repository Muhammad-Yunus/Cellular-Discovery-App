import { defineStore } from 'pinia'

type BackendStatus = 'ok' | 'unavailable' | 'checking'
type CLIStatusValue = 'ok' | 'warning' | 'error' | 'unknown'

interface SystemState {
  backendStatus: BackendStatus
  cliStatus: CLIStatusValue
  responseTime: number | null
  lastCheck: string | null
  error: string | null
}

export const useSystemStore = defineStore('system', {
  state: (): SystemState => ({
    backendStatus: 'unavailable',
    cliStatus: 'unknown',
    responseTime: null,
    lastCheck: null,
    error: null
  }),

  actions: {
    setHealth(status: BackendStatus, responseTime: number) {
      this.backendStatus = status
      this.responseTime = responseTime
      this.lastCheck = new Date().toISOString()
    },

    setCLIStatus(status: CLIStatusValue) {
      this.cliStatus = status
    },

    setError(message: string | null) {
      this.error = message
    }
  }
})
