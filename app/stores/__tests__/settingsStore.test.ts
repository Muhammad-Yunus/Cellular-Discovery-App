import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSettingsStore } from '../settingsStore'

vi.mock('~/services/settings.service', () => ({
  getSettings: vi.fn(),
  updateSettings: vi.fn()
}))

vi.mock('~/types/api', () => ({
  parseApiError: vi.fn((e: Error) => ({
    message: e.message,
    type: 'UNKNOWN'
  }))
}))

describe('settingsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initial state', () => {
    const store = useSettingsStore()
    expect(store.settings).toEqual([])
    expect(store.loading).toBe(false)
    expect(store.saving).toBe(false)
    expect(store.error).toBeNull()
  })

  it('dirty is false when settings unchanged', () => {
    const store = useSettingsStore()
    store.settings = [{ id: '1', key: 'k', value: 'v' }]
    store.originalSettings = [{ id: '1', key: 'k', value: 'v' }]

    expect(store.dirty).toBe(false)
  })

  it('dirty is true when settings changed', () => {
    const store = useSettingsStore()
    store.settings = [{ id: '1', key: 'k', value: 'v2' }]
    store.originalSettings = [{ id: '1', key: 'k', value: 'v1' }]

    expect(store.dirty).toBe(true)
  })

  it('updateField modifies setting value', () => {
    const store = useSettingsStore()
    store.settings = [{ id: '1', key: 'polling_interval', value: '30' }]

    store.updateField('polling_interval', '60')

    expect(store.settings[0].value).toBe('60')
  })

  it('updateField does nothing if key not found', () => {
    const store = useSettingsStore()
    store.updateField('nonexistent', 'value')
    expect(store.settings).toEqual([])
  })

  it('reset restores original settings', () => {
    const store = useSettingsStore()
    store.settings = [{ id: '1', key: 'k', value: 'changed' }]
    store.originalSettings = [{ id: '1', key: 'k', value: 'original' }]

    store.reset()

    expect(store.settings[0].value).toBe('original')
  })
})
