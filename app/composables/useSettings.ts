import { storeToRefs } from 'pinia'
import { useSettingsStore } from '~/stores/settingsStore'
import { useCustomToast } from '@/composables/useCustomToast'

export function useSettings() {
  const toast = useCustomToast()
  const settingsStore = useSettingsStore()
  const { settings, loading, saving, dirty, error } = storeToRefs(settingsStore)

  async function fetchSettings() {
    await settingsStore.fetchSettings()
  }

  function updateField(key: string, value: string) {
    settingsStore.updateField(key, value)
  }

  async function save() {
    try {
      await settingsStore.saveSettings()
      notify('Settings saved', 'success', 'i-lucide-check-circle')
    } catch {
      notify('Failed to save settings', 'error', 'i-lucide-alert-circle')
    }
  }

  function reset() {
    settingsStore.reset()
  }

  onMounted(() => {
    settingsStore.fetchSettings()
  })

  function notify(title: string, color: 'success' | 'error', icon: string) {
    toast.add({ title, description: undefined, color, icon })
  }

  return {
    settings,
    loading,
    saving,
    dirty,
    error,
    fetchSettings,
    updateField,
    save,
    reset
  }
}
