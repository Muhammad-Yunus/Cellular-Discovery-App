// app/components/__tests__/MissionsWebSocket.test.ts
//
// Unit tests for the MissionsWebSocket side-effect component.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('~/composables/useMissionWebSocket', () => ({
  useMissionWebSocket: vi.fn()
}))

describe('MissionsWebSocket', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('calls useMissionWebSocket on mount', async () => {
    const MissionsWebSocket = await import('~/components/MissionsWebSocket.vue')
    mount(MissionsWebSocket.default)
    const { useMissionWebSocket } = await import('~/composables/useMissionWebSocket')
    expect(useMissionWebSocket).toHaveBeenCalledTimes(1)
  })

  it('renders no visible output', async () => {
    const MissionsWebSocket = await import('~/components/MissionsWebSocket.vue')
    const wrapper = mount(MissionsWebSocket.default)
    expect(wrapper.find('.hidden').exists()).toBe(true)
    const { useMissionWebSocket } = await import('~/composables/useMissionWebSocket')
    expect(useMissionWebSocket).toHaveBeenCalledTimes(1)
  })
})