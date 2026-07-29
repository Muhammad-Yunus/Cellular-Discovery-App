import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSystemStore } from '../systemStore'

describe('systemStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initial state', () => {
    const store = useSystemStore()
    expect(store.backendStatus).toBe('unavailable')
    expect(store.cliStatus).toBe('unknown')
    expect(store.responseTime).toBeNull()
    expect(store.lastCheck).toBeNull()
    expect(store.error).toBeNull()
  })

  it('setHealth updates status and response time', () => {
    const store = useSystemStore()
    store.setHealth('ok', 42)

    expect(store.backendStatus).toBe('ok')
    expect(store.responseTime).toBe(42)
    expect(store.lastCheck).toBeTruthy()
  })

  it('setCLIStatus updates cli status', () => {
    const store = useSystemStore()
    store.setCLIStatus('ok')
    expect(store.cliStatus).toBe('ok')
  })

  it('setError updates error message', () => {
    const store = useSystemStore()
    store.setError('Backend is not responding')
    expect(store.error).toBe('Backend is not responding')

    store.setError(null)
    expect(store.error).toBeNull()
  })
})
