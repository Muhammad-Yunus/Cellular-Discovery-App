import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('#app/nuxt', () => ({
  useRuntimeConfig: vi.fn(() => ({
    public: {
      appName: 'LTE Scanner',
      apiBase: 'http://localhost:8000/api/v1',
      defaultLat: '-6.150676643667096',
      defaultLon: '106.89665223346297'
    }
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

vi.mock('#app/composables/router', () => ({
  useRoute: vi.fn(() => ({ path: '/' })),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  onBeforeRouteLeave: vi.fn(),
  onBeforeRouteUpdate: vi.fn()
}))

describe('AppNavbar', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders app name', async () => {
    const AppNavbar = await import('../AppNavbar.vue')
    const wrapper = mount(AppNavbar.default, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' }
        }
      }
    })

    expect(wrapper.text()).toContain('LTE Scanner')
  })

  it('renders all navigation links', async () => {
    const AppNavbar = await import('../AppNavbar.vue')
    const wrapper = mount(AppNavbar.default, {
      global: {
        stubs: {
          NuxtLink: { template: '<a><slot /></a>' }
        }
      }
    })

    expect(wrapper.text()).toContain('Home')
    expect(wrapper.text()).toContain('Scan Result')
    expect(wrapper.text()).toContain('Settings')
    expect(wrapper.text()).toContain('About')
  })
})
