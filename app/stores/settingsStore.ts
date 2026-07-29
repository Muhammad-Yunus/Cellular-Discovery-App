import { defineStore } from 'pinia'
import type { Setting } from '~/types'
import * as settingsService from '~/services/settings.service'

interface SettingsState {
  settings: Setting[]
  originalSettings: Setting[]
  loading: boolean
  saving: boolean
  error: string | null
}

export const useSettingsStore = defineStore('settings', {
  state: (): SettingsState => ({
    settings: [],
    originalSettings: [],
    loading: false,
    saving: false,
    error: null
  }),

  getters: {
    dirty: (state): boolean => {
      if (state.settings.length !== state.originalSettings.length) return true
      return state.settings.some((s, i) => {
        const orig = state.originalSettings[i]
        return !orig || s.key !== orig.key || s.value !== orig.value
      })
    }
  },

  actions: {
    async fetchSettings() {
      this.loading = true
      this.error = null
      try {
        const result = await settingsService.getSettings()
        this.settings = result
        this.originalSettings = JSON.parse(JSON.stringify(result))
      } catch (e) {
        const { parseApiError } = await import('~/types/api')
        this.error = parseApiError(e).message
      } finally {
        this.loading = false
      }
    },

    updateField(key: string, value: string) {
      const setting = this.settings.find(s => s.key === key)
      if (setting) {
        setting.value = value
      }
    },

    async saveSettings() {
      this.saving = true
      this.error = null
      try {
        const result = await settingsService.updateSettings(this.settings)
        this.settings = result
        this.originalSettings = JSON.parse(JSON.stringify(result))
      } catch (e) {
        const { parseApiError } = await import('~/types/api')
        this.error = parseApiError(e).message
        throw e
      } finally {
        this.saving = false
      }
    },

    reset() {
      this.settings = JSON.parse(JSON.stringify(this.originalSettings))
    }
  }
})
