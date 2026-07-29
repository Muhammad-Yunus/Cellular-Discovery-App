import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'

vi.mock('~/stores/settingsStore', () => ({
  useSettingsStore: vi.fn()
}))

describe('useSettings', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  function createMockStore() {
    return {
      settings: ref([]),
      loading: ref(false),
      saving: ref(false),
      dirty: ref(false),
      error: ref(null) as unknown,
      fetchSettings: vi.fn(),
      updateField: vi.fn(),
      saveSettings: vi.fn(),
      reset: vi.fn()
    } as unknown as ReturnType<typeof import('~/stores/settingsStore')['useSettingsStore']>
  }

  it('returns settings state and actions', async () => {
    const { useSettingsStore } = await import('~/stores/settingsStore')
    vi.mocked(useSettingsStore).mockReturnValue(createMockStore())

    const { useSettings } = await import('../useSettings')
    const result = useSettings()

    expect(result.settings).toBeDefined()
    expect(result.loading).toBeDefined()
    expect(result.dirty).toBeDefined()
    expect(result.fetchSettings).toBeDefined()
    expect(result.updateField).toBeDefined()
    expect(result.save).toBeDefined()
    expect(result.reset).toBeDefined()
  })

  it('save calls saveSettings on store', async () => {
    const { useSettingsStore } = await import('~/stores/settingsStore')
    const mockSave = vi.fn().mockResolvedValue(undefined)
    const store = createMockStore()
    store.saveSettings = mockSave
    vi.mocked(useSettingsStore).mockReturnValue(store)

    const { useSettings } = await import('../useSettings')
    const result = useSettings()
    await result.save()

    expect(mockSave).toHaveBeenCalled()
  })
})
