import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'

vi.mock('~/stores/settingsStore', () => ({
  useSettingsStore: vi.fn()
}))

const toastAddSpy = vi.fn()

vi.mock('@/composables/useCustomToast', () => ({
  useCustomToast: () => ({
    toasts: ref([]),
    add: toastAddSpy,
    remove: vi.fn(),
    colorClass: vi.fn()
  })
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

  it('updateField calls store updateField with key/value', async () => {
    const { useSettingsStore } = await import('~/stores/settingsStore')
    const mockUpdate = vi.fn()
    const store = createMockStore()
    store.updateField = mockUpdate
    vi.mocked(useSettingsStore).mockReturnValue(store)

    const { useSettings } = await import('../useSettings')
    const result = useSettings()
    result.updateField('theme', 'dark')

    expect(mockUpdate).toHaveBeenCalledWith('theme', 'dark')
  })

  it('reset calls store reset', async () => {
    const { useSettingsStore } = await import('~/stores/settingsStore')
    const mockReset = vi.fn()
    const store = createMockStore()
    store.reset = mockReset
    vi.mocked(useSettingsStore).mockReturnValue(store)

    const { useSettings } = await import('../useSettings')
    const result = useSettings()
    result.reset()

    expect(mockReset).toHaveBeenCalled()
  })

  it('fetchSettings calls store fetchSettings', async () => {
    const { useSettingsStore } = await import('~/stores/settingsStore')
    const mockFetch = vi.fn().mockResolvedValue(undefined)
    const store = createMockStore()
    store.fetchSettings = mockFetch
    vi.mocked(useSettingsStore).mockReturnValue(store)

    const { useSettings } = await import('../useSettings')
    const result = useSettings()
    await result.fetchSettings()

    expect(mockFetch).toHaveBeenCalled()
  })

  it('save notifies success toast on success', async () => {
    toastAddSpy.mockClear()
    const { useSettingsStore } = await import('~/stores/settingsStore')
    const store = createMockStore()
    store.saveSettings = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useSettingsStore).mockReturnValue(store)

    const { useSettings } = await import('../useSettings')
    const result = useSettings()
    await result.save()

    expect(toastAddSpy).toHaveBeenCalledWith(expect.objectContaining({
      color: 'success'
    }))
  })

  it('save notifies error toast on failure', async () => {
    toastAddSpy.mockClear()
    const { useSettingsStore } = await import('~/stores/settingsStore')
    const store = createMockStore()
    store.saveSettings = vi.fn().mockRejectedValue(new Error('save failed'))
    vi.mocked(useSettingsStore).mockReturnValue(store)

    const { useSettings } = await import('../useSettings')
    const result = useSettings()
    await result.save()

    expect(toastAddSpy).toHaveBeenCalledWith(expect.objectContaining({
      color: 'error'
    }))
  })
})
