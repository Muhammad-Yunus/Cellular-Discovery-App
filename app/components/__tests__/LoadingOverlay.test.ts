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

  it('renders overlay card with title and subtitle when loading is true', async () => {
    const LoadingOverlay = (await import('../LoadingOverlay.vue')).default
    const wrapper = mount(LoadingOverlay, {
      props: { loading: true },
      global: { stubs: globalStubs }
    })
    const text = wrapper.find('.teleport-stub').text()
    // Title contains "Scanning Signal"
    expect(text).toContain('Scanning Signal')
    // Subtitle contains wait message in English
    expect(text.toLowerCase()).toContain('please wait')
    expect(text.toLowerCase()).toContain('scanning process')
  })

  it('renders animated radar icon with 4 expanding rings and core', async () => {
    const LoadingOverlay = (await import('../LoadingOverlay.vue')).default
    const wrapper = mount(LoadingOverlay, {
      props: { loading: true },
      global: { stubs: globalStubs }
    })

    const rings = wrapper.findAll('.loading-overlay__ring')
    const core = wrapper.find('.loading-overlay__core')
    const svg = core.find('svg')

    expect(rings.length).toBe(4)
    expect(core.exists()).toBe(true)
    expect(svg.exists()).toBe(true)
    // SVG viewBox attribute (case-insensitive in HTML)
    const attrs = svg.attributes() as Record<string, string | undefined>
    expect(attrs.viewBox || attrs.viewbox).toBe('0 0 24 24')
  })

  it('renders 3 animated progress dots', async () => {
    const LoadingOverlay = (await import('../LoadingOverlay.vue')).default
    const wrapper = mount(LoadingOverlay, {
      props: { loading: true },
      global: { stubs: globalStubs }
    })

    const dots = wrapper.findAll('.loading-overlay__dot')
    expect(dots.length).toBe(3)
  })

  it('has accessibility attributes (role=status, aria-live=polite)', async () => {
    const LoadingOverlay = (await import('../LoadingOverlay.vue')).default
    const wrapper = mount(LoadingOverlay, {
      props: { loading: true },
      global: { stubs: globalStubs }
    })

    const overlay = wrapper.find('.loading-overlay')
    expect(overlay.exists()).toBe(true)
    expect(overlay.attributes('role')).toBe('status')
    expect(overlay.attributes('aria-live')).toBe('polite')
    expect(overlay.attributes('aria-label')?.toLowerCase()).toContain('scanning')
    expect(overlay.attributes('aria-label')?.toLowerCase()).toContain('please wait')
  })

  it('still accepts custom message prop for backwards compatibility', async () => {
    const LoadingOverlay = (await import('../LoadingOverlay.vue')).default
    const wrapper = mount(LoadingOverlay, {
      props: { loading: true, message: 'Any custom message' },
      global: { stubs: globalStubs }
    })
    // Should not throw; overlay still renders
    expect(wrapper.find('.teleport-stub').exists()).toBe(true)
  })
})
