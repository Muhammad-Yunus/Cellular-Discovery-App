import { describe, it, expect, beforeAll } from 'vitest'
import { mount, type MountedComponent } from '@vue/test-utils'
import type { DefineComponent } from 'vue'

const UBadgeStub = {
  props: ['color', 'variant', 'size'],
  template: '<span class="u-badge" :data-color="color"><slot /></span>'
}

describe('StatusBadge', () => {
  // Hoist the dynamic import out of each it() block so the SFC +
  // @nuxt/ui runtime composables are resolved only once per suite.
  let StatusBadge: DefineComponent<{ status: string, label?: string, pulse?: boolean }, Record<string, never>, unknown>

  beforeAll(async () => {
    StatusBadge = (await import('../StatusBadge.vue')).default
  }, 60000)

  it('renders with ok status', async () => {
    const wrapper = mount(StatusBadge, {
      props: { status: 'ok' },
      global: { stubs: { UBadge: UBadgeStub } }
    })
    expect(wrapper.text()).toContain('OK')
    expect(wrapper.attributes('data-color')).toBe('success')
  })

  it('renders with error status', async () => {
    const wrapper = mount(StatusBadge, {
      props: { status: 'error' },
      global: { stubs: { UBadge: UBadgeStub } }
    })
    expect(wrapper.text()).toContain('Error')
    expect(wrapper.attributes('data-color')).toBe('error')
  })

  it('renders with custom label', async () => {
    const wrapper = mount(StatusBadge, {
      props: { status: 'ok', label: 'Connected' },
      global: { stubs: { UBadge: UBadgeStub } }
    })
    expect(wrapper.text()).toContain('Connected')
  })

  it('renders with warning status', async () => {
    const wrapper = mount(StatusBadge, {
      props: { status: 'warning' },
      global: { stubs: { UBadge: UBadgeStub } }
    })
    expect(wrapper.text()).toContain('Warning')
    expect(wrapper.attributes('data-color')).toBe('warning')
  })
})