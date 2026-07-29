/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'

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

vi.mock('~/app/composables/useSettings', () => ({
  useSettings: vi.fn()
}))

const mockSettings = [
  { key: 'polling_interval', value: '30', description: 'Polling interval in seconds' },
  { key: 'notification_enabled', value: 'true', description: 'Enable notifications' },
  { key: 'api_endpoint', value: 'http://localhost:8000', description: 'API endpoint URL' },
  { key: 'map_zoom', value: '17', description: 'Default map zoom level' }
]

function createMockUseSettings(overrides: Record<string, unknown> = {}) {
  return {
    settings: ref([]),
    loading: ref(false),
    saving: ref(false),
    dirty: ref(false),
    error: ref(null),
    fetchSettings: vi.fn(),
    updateField: vi.fn(),
    save: vi.fn(),
    reset: vi.fn(),
    ...overrides
  }
}

const UIStubs = {
  USkeleton: { template: '<div class="u-skeleton" />' },
  UAlert: {
    props: ['title', 'description'],
    template: '<div class="u-alert">{{ title }}<div class="desc">{{ description }}</div><slot name="footer" /></div>'
  },
  UButton: {
    props: ['label', 'disabled', 'loading', 'color', 'variant', 'type'],
    template: '<button class="u-button" :disabled="disabled">{{ label }}<slot /></button>'
  },
  UForm: {
    template: '<form class="u-form"><slot /></form>'
  },
  UFormField: {
    props: ['label', 'description', 'error', 'name'],
    template: '<div class="u-form-field"><div class="label">{{ label }}</div><div class="desc">{{ description }}</div><div class="error">{{ error }}</div><slot /></div>'
  },
  UInput: { template: '<input class="u-input" />' },
  USwitch: { template: '<input class="u-switch" type="checkbox" />' },
  NuxtLink: { template: '<a><slot /></a>' }
}

describe('SettingsPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('renders page title', async () => {
    const { useSettings } = await import('~/app/composables/useSettings')
    vi.mocked(useSettings).mockReturnValue(createMockUseSettings() as any)

    const Page = (await import('../settings.vue')).default
    const wrapper = mount(Page, { global: { stubs: UIStubs } })
    expect(wrapper.text()).toContain('Settings')
  }, 15000)

  it('shows loading skeleton when loading', async () => {
    const { useSettings } = await import('~/app/composables/useSettings')
    vi.mocked(useSettings).mockReturnValue(createMockUseSettings({ loading: true }) as any)

    const Page = (await import('../settings.vue')).default
    const wrapper = mount(Page, { global: { stubs: UIStubs } })
    expect(wrapper.find('.u-skeleton').exists()).toBe(true)
  })

  it('shows error alert with retry button', async () => {
    const { useSettings } = await import('~/app/composables/useSettings')
    vi.mocked(useSettings).mockReturnValue(createMockUseSettings({ error: 'Network error' }) as any)

    const Page = (await import('../settings.vue')).default
    const wrapper = mount(Page, { global: { stubs: UIStubs } })
    expect(wrapper.text()).toContain('Failed to load settings')
    expect(wrapper.text()).toContain('Retry')
  })

  it('shows empty state when no settings', async () => {
    const { useSettings } = await import('~/app/composables/useSettings')
    vi.mocked(useSettings).mockReturnValue(createMockUseSettings() as any)

    const Page = (await import('../settings.vue')).default
    const wrapper = mount(Page, { global: { stubs: UIStubs } })
    expect(wrapper.text()).toContain('No settings available')
  })

  it('renders settings form fields', async () => {
    const { useSettings } = await import('~/app/composables/useSettings')
    vi.mocked(useSettings).mockReturnValue(createMockUseSettings({
      settings: ref(mockSettings),
      dirty: ref(false)
    }) as any)

    const Page = (await import('../settings.vue')).default
    const wrapper = mount(Page, { global: { stubs: UIStubs } })
    expect(wrapper.text()).toContain('polling_interval')
    expect(wrapper.text()).toContain('notification_enabled')
    expect(wrapper.text()).toContain('api_endpoint')
    expect(wrapper.text()).toContain('map_zoom')
  })

  it('calls save when Save button clicked', async () => {
    const mockSave = vi.fn()
    const { useSettings } = await import('~/app/composables/useSettings')
    vi.mocked(useSettings).mockReturnValue(createMockUseSettings({
      settings: ref(mockSettings),
      dirty: ref(true),
      save: mockSave
    }) as any)

    const Page = (await import('../settings.vue')).default
    const wrapper = mount(Page, { global: { stubs: UIStubs } })
    const saveBtn = wrapper.findAll('.u-button').find(b => b.text() === 'Save')
    if (saveBtn) saveBtn.trigger('click')
    expect(mockSave).toHaveBeenCalled()
  })

  it('calls reset when Cancel button clicked', async () => {
    const mockReset = vi.fn()
    const { useSettings } = await import('~/app/composables/useSettings')
    vi.mocked(useSettings).mockReturnValue(createMockUseSettings({
      settings: ref(mockSettings),
      dirty: ref(true),
      reset: mockReset
    }) as any)

    const Page = (await import('../settings.vue')).default
    const wrapper = mount(Page, { global: { stubs: UIStubs } })
    const cancelBtn = wrapper.findAll('.u-button').find(b => b.text() === 'Cancel')
    if (cancelBtn) cancelBtn.trigger('click')
    expect(mockReset).toHaveBeenCalled()
  })
})
