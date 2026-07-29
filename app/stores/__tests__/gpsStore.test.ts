import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGpsStore } from '../gpsStore'

describe('gpsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initial state has default coordinates', () => {
    const store = useGpsStore()
    expect(store.latitude).toBe(-6.150676643667096)
    expect(store.longitude).toBe(106.89665223346297)
    expect(store.provider).toBeNull()
    expect(store.connected).toBe(false)
  })

  it('updatePosition changes coordinates', () => {
    const store = useGpsStore()
    store.updatePosition(-6.2, 106.8)
    expect(store.latitude).toBe(-6.2)
    expect(store.longitude).toBe(106.8)
  })

  it('setProvider updates provider', () => {
    const store = useGpsStore()
    store.setProvider('gps')
    expect(store.provider).toBe('gps')
  })

  it('setConnected updates connection status', () => {
    const store = useGpsStore()
    store.setConnected(true)
    expect(store.connected).toBe(true)

    store.setConnected(false)
    expect(store.connected).toBe(false)
  })
})
