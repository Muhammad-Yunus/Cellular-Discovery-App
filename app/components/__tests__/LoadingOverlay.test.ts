import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

const TeleportStub = {
  props: ['to'],
  template: '<div class="teleport-stub"><slot /></div>'
}

const TransitionStub = {
  template: '<div class="transition-stub"><slot /></div>'
}

const globalStubs = {
  Teleport: TeleportStub,
  Transition: TransitionStub
}

describe('LoadingOverlay', () => {
  it('renders nothing when loading is false', async () => {
    const LoadingOverlay = (await import('../LoadingOverlay.vue')).default
    const wrapper = mount(LoadingOverlay, {
      props: { loading: false },
      global: { stubs: globalStubs }
    })
    const stub = wrapper.find('.teleport-stub')
    expect(stub.exists()).toBe(true)
    expect(stub.text()).toBe('')
  })

  it('renders overlay when loading is true', async () => {
    const LoadingOverlay = (await import('../LoadingOverlay.vue')).default
    const wrapper = mount(LoadingOverlay, {
      props: { loading: true },
      global: { stubs: globalStubs }
    })
    expect(wrapper.find('.teleport-stub').text()).toContain('Loading...')
  })

  it('displays custom message', async () => {
    const LoadingOverlay = (await import('../LoadingOverlay.vue')).default
    const wrapper = mount(LoadingOverlay, {
      props: { loading: true, message: 'Scanning...' },
      global: { stubs: globalStubs }
    })
    expect(wrapper.find('.teleport-stub').text()).toContain('Scanning...')
  })
})
