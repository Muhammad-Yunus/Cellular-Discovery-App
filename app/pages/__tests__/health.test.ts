/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

vi.mock('#app/composables/router', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  useRoute: vi.fn(() => ({ path: '/health' }))
}))

vi.mock('#app/nuxt', () => ({
  useRuntimeConfig: vi.fn(() => ({
    public: { appName: 'LTE Scanner', apiBase: 'http://localhost:8001/api/v1', defaultLat: '-6.15', defaultLon: '106.89' }
  })),
  useNuxtApp: vi.fn(() => ({ vueApp: { use: vi.fn() }, $config: { public: {} }, _route: { path: '/' } })),
  defineNuxtPlugin: vi.fn(),
  definePayloadPlugin: vi.fn(),
  defineAppConfig: vi.fn(),
  tryUseNuxtApp: vi.fn(),
  definePageMeta: vi.fn()
}))

vi.mock('~/composables/useSystem', () => ({
  useSystem: vi.fn(() => ({
    backendStatus: 'ok',
    cliStatus: 'unknown',
    responseTime: null,
    lastCheck: null,
    error: null,
    checkNow: vi.fn(),
    startPolling: vi.fn(),
    stopPolling: vi.fn()
  }))
}))

const UIStubs = {
  UCard: {
    props: ['color', 'variant', 'size'],
    template: '<div class="u-card"><slot name="header" /><slot /></div>'
  },
  UButton: {
    props: ['label', 'color', 'size', 'icon', 'disabled'],
    template: '<button class="u-button">{{ label }}</button>'
  },
  UAlert: {
    props: ['title', 'color', 'icon'],
    template: '<div class="u-alert">{{ title }}</div>'
  },
  StatusBadge: {
    props: ['status', 'label', 'pulse'],
    template: '<span class="status-badge" :data-status="status">{{ label }}</span>'
  }
}

describe('HealthPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders page title', async () => {
    const { useSystem } = await import('~/composables/useSystem')
    vi.mocked(useSystem).mockReturnValue({
      backendStatus: ref('ok'),
      cliStatus: ref('ok'),
      responseTime: ref(42),
      lastCheck: ref(new Date().toISOString()),
      error: ref(null),
      checkNow: vi.fn(),
      startPolling: vi.fn(),
      stopPolling: vi.fn()
    } as any)

    const Page = (await import('../health.vue')).default
    const wrapper = mount(Page, { global: { stubs: UIStubs } })
    await vi.waitFor(() => expect(wrapper.text()).toContain('System Health'))
  }, 30000)

  it('shows backend status as Online when ok', async () => {
    const { useSystem } = await import('~/composables/useSystem')
    vi.mocked(useSystem).mockReturnValue({
      backendStatus: ref('ok'),
      cliStatus: ref('ok'),
      responseTime: ref(42),
      lastCheck: ref(new Date().toISOString()),
      error: ref(null),
      checkNow: vi.fn(),
      startPolling: vi.fn(),
      stopPolling: vi.fn()
    } as any)

    const Page = (await import('../health.vue')).default
    const wrapper = mount(Page, { global: { stubs: UIStubs } })
    expect(wrapper.text()).toContain('Online')
  })

  it('shows backend status as Offline when unavailable', async () => {
    const { useSystem } = await import('~/composables/useSystem')
    vi.mocked(useSystem).mockReturnValue({
      backendStatus: ref('unavailable'),
      cliStatus: ref('unknown'),
      responseTime: ref(null),
      lastCheck: ref(null),
      error: ref('Backend is not responding'),
      checkNow: vi.fn(),
      startPolling: vi.fn(),
      stopPolling: vi.fn()
    } as any)

    const Page = (await import('../health.vue')).default
    const wrapper = mount(Page, { global: { stubs: UIStubs } })
    expect(wrapper.text()).toContain('Offline')
  })

  it('shows error alert when error exists', async () => {
    const { useSystem } = await import('~/composables/useSystem')
    vi.mocked(useSystem).mockReturnValue({
      backendStatus: ref('unavailable'),
      cliStatus: ref('unknown'),
      responseTime: ref(null),
      lastCheck: ref(null),
      error: ref('Backend is not responding'),
      checkNow: vi.fn(),
      startPolling: vi.fn(),
      stopPolling: vi.fn()
    } as any)

    const Page = (await import('../health.vue')).default
    const wrapper = mount(Page, { global: { stubs: UIStubs } })
    expect(wrapper.text()).toContain('Backend is not responding')
  })

  it('shows response time', async () => {
    const { useSystem } = await import('~/composables/useSystem')
    vi.mocked(useSystem).mockReturnValue({
      backendStatus: ref('ok'),
      cliStatus: ref('ok'),
      responseTime: ref(120),
      lastCheck: ref(new Date().toISOString()),
      error: ref(null),
      checkNow: vi.fn(),
      startPolling: vi.fn(),
      stopPolling: vi.fn()
    } as any)

    const Page = (await import('../health.vue')).default
    const wrapper = mount(Page, { global: { stubs: UIStubs } })
    expect(wrapper.text()).toContain('120ms')
  })

  it('has Check Now button', async () => {
    const { useSystem } = await import('~/composables/useSystem')
    vi.mocked(useSystem).mockReturnValue({
      backendStatus: ref('ok'),
      cliStatus: ref('ok'),
      responseTime: ref(42),
      lastCheck: ref(new Date().toISOString()),
      error: ref(null),
      checkNow: vi.fn(),
      startPolling: vi.fn(),
      stopPolling: vi.fn()
    } as any)

    const Page = (await import('../health.vue')).default
    const wrapper = mount(Page, { global: { stubs: UIStubs } })
    expect(wrapper.text()).toContain('Check Now')
  })
})
