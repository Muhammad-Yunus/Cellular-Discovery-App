/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { mount, type Component } from '@vue/test-utils'
import { ref } from 'vue'

vi.mock('#app/composables/router', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  useRoute: vi.fn(() => ({ path: '/about' }))
}))

vi.mock('#app/nuxt', () => ({
  useRuntimeConfig: vi.fn(() => ({
    public: { appName: 'LTE Scanner' }
  })),
  useNuxtApp: vi.fn(() => ({
    vueApp: { use: vi.fn() },
    $config: { public: {} },
    _route: { path: '/' }
  })),
  defineNuxtPlugin: vi.fn(),
  definePayloadPlugin: vi.fn(),
  defineAppConfig: vi.fn(),
  tryUseNuxtApp: vi.fn(),
  definePageMeta: vi.fn()
}))

vi.mock('~/composables/useSystem', () => ({
  useSystem: vi.fn(() => ({
    backendStatus: 'ok',
    error: null
  }))
}))

const UIStubs = {
  UCard: {
    props: ['color', 'variant', 'size'],
    template: '<div class="u-card"><slot name="header" /><slot /><slot name="footer" /></div>'
  },
  UBadge: {
    props: ['color', 'variant', 'size'],
    template: '<span class="u-badge"><slot /></span>'
  },
  StatusBadge: {
    props: ['status', 'label'],
    template: '<span class="status-badge" :data-status="status">{{ label }}</span>'
  }
}

describe('AboutPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Hoist the dynamic import out of each it() block.
  let Page: Component
  beforeAll(async () => {
    Page = (await import('../about.vue')).default
  }, 60000)

  it('renders app name', async () => {
    vi.mocked(useSystem).mockReturnValue({
      backendStatus: ref('unavailable'),
      error: ref(null),
      checkNow: vi.fn(),
      startPolling: vi.fn(),
      stopPolling: vi.fn()
    } as any)

    const wrapper = mount(Page, { global: { stubs: UIStubs } })
    expect(wrapper.text()).toContain('LTE Scanner')
  })

  it('renders description', async () => {
    vi.mocked(useSystem).mockReturnValue({
      backendStatus: ref('unavailable'),
      error: ref(null),
      checkNow: vi.fn(),
      startPolling: vi.fn(),
      stopPolling: vi.fn()
    } as any)

    const wrapper = mount(Page, { global: { stubs: UIStubs } })
    expect(wrapper.text()).toContain('Discovering and monitoring LTE, UMTS, and GSM network')
  })

  it('renders technology stack', async () => {
    vi.mocked(useSystem).mockReturnValue({
      backendStatus: ref('unavailable'),
      error: ref(null),
      checkNow: vi.fn(),
      startPolling: vi.fn(),
      stopPolling: vi.fn()
    } as any)

    const wrapper = mount(Page, { global: { stubs: UIStubs } })
    expect(wrapper.text()).toContain('Nuxt')
    expect(wrapper.text()).toContain('Vue 3')
    expect(wrapper.text()).toContain('Vite')
    expect(wrapper.text()).toContain('Pinia')
    expect(wrapper.text()).toContain('Tailwind')
    expect(wrapper.text()).toContain('Leaflet')
  })

  it('renders backend info when health available', async () => {
    vi.mocked(useSystem).mockReturnValue({
      backendStatus: ref('ok'),
      error: ref(null),
      checkNow: vi.fn(),
      startPolling: vi.fn(),
      stopPolling: vi.fn()
    } as any)

    const wrapper = mount(Page, { global: { stubs: UIStubs } })
    expect(wrapper.text()).toContain('Online')
  })
})