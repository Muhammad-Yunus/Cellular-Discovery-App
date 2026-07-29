import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUiStore } from '../uiStore'

describe('uiStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initial state', () => {
    const store = useUiStore()
    expect(store.sidebarOpen).toBe(true)
    expect(store.bottomPanelOpen).toBe(true)
    expect(store.activeInfoTab).toBe('signal')
  })

  it('toggleSidebar flips state', () => {
    const store = useUiStore()
    store.toggleSidebar()
    expect(store.sidebarOpen).toBe(false)
    store.toggleSidebar()
    expect(store.sidebarOpen).toBe(true)
  })

  it('toggleBottomPanel flips state', () => {
    const store = useUiStore()
    store.toggleBottomPanel()
    expect(store.bottomPanelOpen).toBe(false)
    store.toggleBottomPanel()
    expect(store.bottomPanelOpen).toBe(true)
  })

  it('setActiveTab changes active tab', () => {
    const store = useUiStore()
    store.setActiveTab('gps')
    expect(store.activeInfoTab).toBe('gps')

    store.setActiveTab('system')
    expect(store.activeInfoTab).toBe('system')
  })
})
