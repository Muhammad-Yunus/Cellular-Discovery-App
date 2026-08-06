import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'

// Mock setTimeout - intercept and collect calls
let timeoutCalls: Array<{ timer: ReturnType<typeof setTimeout>, delay: number }> = []

const originalSetTimeout = globalThis.setTimeout
const originalClearTimeout = globalThis.clearTimeout

beforeEach(() => {
  timeoutCalls = []
  globalThis.setTimeout = ((fn: () => void, delay: number) => {
    const timer = originalSetTimeout(fn, delay)
    timeoutCalls.push({ timer, delay })
    return timer
  }) as unknown as typeof originalSetTimeout

  globalThis.clearTimeout = ((timer: ReturnType<typeof setTimeout>) => {
    timeoutCalls = timeoutCalls.filter(tc => tc.timer !== timer)
    return originalClearTimeout(timer)
  }) as unknown as typeof originalClearTimeout
})

afterEach(() => {
  globalThis.setTimeout = originalSetTimeout
  globalThis.clearTimeout = originalClearTimeout
})

describe('useToast', () => {
  it('returns toasts, add, remove, and colorClass', async () => {
    vi.resetModules()
    const { useToast } = await import('../useToast')
    const result = useToast()

    expect(result.toasts).toBeDefined()
    expect(typeof result.add).toBe('function')
    expect(typeof result.remove).toBe('function')
    expect(typeof result.colorClass).toBe('function')
  })

  it('adds a toast when add is called', async () => {
    vi.resetModules()
    const { useToast } = await import('../useToast')
    const result = useToast()

    result.add({
      title: 'Test Toast',
      description: 'Test description',
      color: 'success'
    })

    await nextTick()
    expect(result.toasts.value.length).toBeGreaterThanOrEqual(1)
    const myToast = result.toasts.value.find(t => t.title === 'Test Toast')
    expect(myToast).toBeDefined()
    expect(myToast!.description).toBe('Test description')
    expect(myToast!.color).toBe('success')
  })

  it('removes a toast when remove is called', async () => {
    vi.resetModules()
    const { useToast } = await import('../useToast')
    const result = useToast()

    result.add({
      title: 'Remove Me',
      color: 'info'
    })

    await nextTick()
    const myToast = result.toasts.value.find(t => t.title === 'Remove Me')
    expect(myToast).toBeDefined()

    result.remove(myToast!.id)
    await nextTick()
    expect(result.toasts.value.find(t => t.id === myToast!.id)).toBeUndefined()
  })

  it('removes timeout references when toast is removed', async () => {
    vi.resetModules()
    const { useToast } = await import('../useToast')
    const result = useToast()

    result.add({
      title: 'Remove Me',
      color: 'info'
    })

    expect(timeoutCalls.length).toBeGreaterThan(0)
    const initialCount = timeoutCalls.length

    const myToast = result.toasts.value[result.toasts.value.length - 1]
    result.remove(myToast!.id)
    // After removing, we shouldn't see additional timeouts queued
    expect(timeoutCalls.length).toBe(initialCount)
  })

  it('returns correct color classes', async () => {
    vi.resetModules()
    const { useToast } = await import('../useToast')
    const result = useToast()

    expect(result.colorClass('success')).toBe('bg-green-600 text-white')
    expect(result.colorClass('error')).toBe('bg-red-600 text-white')
    expect(result.colorClass('info')).toBe('bg-blue-600 text-white')
    expect(result.colorClass('warning')).toBe('bg-amber-600 text-white')
  })

  it('uses default timeout of 5000ms', async () => {
    vi.resetModules()
    const { useToast } = await import('../useToast')
    const result = useToast()

    const beforeCount = timeoutCalls.length
    result.add({
      title: 'Auto Remove',
      color: 'error'
    })

    const newTimeouts = timeoutCalls.slice(beforeCount)
    expect(newTimeouts.some(tc => tc.delay === 5000)).toBe(true)
  })

  it('uses custom timeout when provided', async () => {
    vi.resetModules()
    const { useToast } = await import('../useToast')
    const result = useToast()

    const beforeCount = timeoutCalls.length
    result.add({
      title: 'Custom Timeout',
      color: 'warning',
      timeout: 2000
    })

    const newTimeouts = timeoutCalls.slice(beforeCount)
    expect(newTimeouts.some(tc => tc.delay === 2000)).toBe(true)
  })

  it('generates unique IDs for each toast', async () => {
    vi.resetModules()
    const { useToast } = await import('../useToast')
    const result = useToast()

    result.add({ title: 'Toast Unique', color: 'success' })
    result.add({ title: 'Toast Unique 2', color: 'error' })
    result.add({ title: 'Toast Unique 3', color: 'info' })

    await nextTick()
    const myToasts = result.toasts.value.filter(t => t.title.startsWith('Toast Unique'))
    expect(myToasts.length).toBe(3)

    const ids = myToasts.map(t => t.id)
    expect(new Set(ids).size).toBe(3)
  })
})