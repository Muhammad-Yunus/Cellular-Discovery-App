import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'

// Mock setTimeout - intercept and collect calls
let timeoutCalls: Array<{ timer: ReturnType<typeof setTimeout>, delay: number }> = []

const originalSetTimeout = globalThis.setTimeout

beforeEach(() => {
  timeoutCalls = []
  globalThis.setTimeout = ((fn: () => void, delay: number) => {
    const timer = originalSetTimeout(fn, delay)
    timeoutCalls.push({ timer, delay })
    return timer
  }) as unknown as typeof originalSetTimeout
})

afterEach(() => {
  globalThis.setTimeout = originalSetTimeout
})

describe('useCustomToast', () => {
  it('returns toasts, add, remove, and colorClass', async () => {
    vi.resetModules()
    const { useCustomToast } = await import('../useCustomToast')
    const result = useCustomToast()

    expect(result.toasts).toBeDefined()
    expect(typeof result.add).toBe('function')
    expect(typeof result.remove).toBe('function')
    expect(typeof result.colorClass).toBe('function')
  })

  it('adds a toast with all color variants', async () => {
    vi.resetModules()
    const { useCustomToast } = await import('../useCustomToast')
    const result = useCustomToast()

    result.add({ title: 'Success Toast', color: 'success' })
    result.add({ title: 'Error Toast', color: 'error' })
    result.add({ title: 'Info Toast', color: 'info' })
    result.add({ title: 'Warning Toast', color: 'warning' })

    await nextTick()
    expect(result.toasts.value.length).toBeGreaterThanOrEqual(4)
    expect(result.toasts.value.find(t => t.title === 'Success Toast')?.color).toBe('success')
    expect(result.toasts.value.find(t => t.title === 'Error Toast')?.color).toBe('error')
    expect(result.toasts.value.find(t => t.title === 'Info Toast')?.color).toBe('info')
    expect(result.toasts.value.find(t => t.title === 'Warning Toast')?.color).toBe('warning')
  })

  it('uses default timeout of 5000ms', async () => {
    vi.resetModules()
    const { useCustomToast } = await import('../useCustomToast')
    const result = useCustomToast()

    const beforeCount = timeoutCalls.length
    result.add({ title: 'Default Timeout Toast', color: 'success' })

    const newTimeouts = timeoutCalls.slice(beforeCount)
    expect(newTimeouts.some(tc => tc.delay === 5000)).toBe(true)
  })

  it('uses custom timeout when provided', async () => {
    vi.resetModules()
    const { useCustomToast } = await import('../useCustomToast')
    const result = useCustomToast()

    const beforeCount = timeoutCalls.length
    result.add({ title: 'Custom Timeout', color: 'warning', timeout: 3000 })

    const newTimeouts = timeoutCalls.slice(beforeCount)
    expect(newTimeouts.some(tc => tc.delay === 3000)).toBe(true)
  })

  it('multiple toasts stack properly', async () => {
    vi.resetModules()
    const { useCustomToast } = await import('../useCustomToast')
    const result = useCustomToast()

    result.add({ title: 'Stack 1', color: 'success' })
    result.add({ title: 'Stack 2', color: 'error' })
    result.add({ title: 'Stack 3', color: 'info' })

    await nextTick()
    const stacked = result.toasts.value.filter(t => t.title.startsWith('Stack'))
    expect(stacked.length).toBe(3)
  })

  it('user can manually dismiss toast', async () => {
    vi.resetModules()
    const { useCustomToast } = await import('../useCustomToast')
    const result = useCustomToast()

    result.add({ title: 'Dismiss Me', color: 'info' })
    await nextTick()

    const myToast = result.toasts.value.find(t => t.title === 'Dismiss Me')
    expect(myToast).toBeDefined()

    result.remove(myToast!.id)
    await nextTick()
    expect(result.toasts.value.find(t => t.id === myToast!.id)).toBeUndefined()
  })

  it('returns correct color classes for all variants', async () => {
    vi.resetModules()
    const { useCustomToast } = await import('../useCustomToast')
    const result = useCustomToast()

    expect(result.colorClass('success')).toBe('bg-green-600 text-white')
    expect(result.colorClass('error')).toBe('bg-red-600 text-white')
    expect(typeof result.colorClass('info')).toBe('string')
    expect(typeof result.colorClass('warning')).toBe('string')
  })
})
