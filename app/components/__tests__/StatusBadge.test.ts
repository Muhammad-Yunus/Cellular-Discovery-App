import { describe, it, expect, beforeAll } from 'vitest'
import { mount } from '@vue/test-utils'
import StatusBadge from '../StatusBadge.vue'

const UBadgeStub = {
  props: ['color', 'variant', 'size'],
  template: '<span class="u-badge" :data-color="color"><slot /></span>'
}

describe('StatusBadge', () => {
  it('renders with ok status', () => {
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