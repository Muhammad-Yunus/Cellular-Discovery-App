/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
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
  tryUseNuxtApp: vi.fn()
}))

vi.mock('~/app/composables/useSystem', () => ({
  useSystem: vi.fn()
}))

const UIStubs = {
  UCard: {
    props: ['color', 'variant', 'size'],
    template: '<div class="u-card"><slot name="header" /><slot /><slot name="footer" /></div>'
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

  it('renders app name', async () => {
    const { useSystem } = await import('~/app/composables/useSystem')
    vi.mocked(useSystem).mockReturnValue({
      health: ref(null),
      loading: ref(false)
    } as any)

    const Page = (await import('../about.vue')).default
    const wrapper = mount(Page, { global: { stubs: UIStubs } })
    expect(wrapper.text()).toContain('LTE Scanner')
  }, 15000)

  it('renders description', async () => {
    const { useSystem } = await import('~/app/composables/useSystem')
    vi.mocked(useSystem).mockReturnValue({
      health: ref(null),
      loading: ref(false)
    } as any)

    const Page = (await import('../about.vue')).default
    const wrapper = mount(Page, { global: { stubs: UIStubs } })
    expect(wrapper.text()).toContain('USB Modem LTE Network Discovery Web Frontend')
  })

  it('renders technology stack', async () => {
    const { useSystem } = await import('~/app/composables/useSystem')
    vi.mocked(useSystem).mockReturnValue({
      health: ref(null),
      loading: ref(false)
    } as any)

    const Page = (await import('../about.vue')).default
    const wrapper = mount(Page, { global: { stubs: UIStubs } })
    expect(wrapper.text()).toContain('Nuxt 4')
    expect(wrapper.text()).toContain('Vue 3')
    expect(wrapper.text()).toContain('TypeScript')
    expect(wrapper.text()).toContain('Vite')
    expect(wrapper.text()).toContain('Pinia')
    expect(wrapper.text()).toContain('TailwindCSS')
    expect(wrapper.text()).toContain('Leaflet')
  })

  it('renders backend info when health available', async () => {
    const { useSystem } = await import('~/app/composables/useSystem')
    vi.mocked(useSystem).mockReturnValue({
      health: ref({ status: 'ok', version: '1.0.0', uptime: 3600, timestamp: '' }),
      loading: ref(false)
    } as any)

    const Page = (await import('../about.vue')).default
    const wrapper = mount(Page, { global: { stubs: UIStubs } })
    expect(wrapper.text()).toContain('1.0.0')
    expect(wrapper.text()).toContain('Online')
  })
})
