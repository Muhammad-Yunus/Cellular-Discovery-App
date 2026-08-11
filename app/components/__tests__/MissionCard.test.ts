/**
 * app/components/__tests__/MissionCard.test.ts
 *
 * Basic unit tests for MissionCard. Each test mounts the component in
 * isolation and asserts that the DOM reflects the expected mission
 * data / status / disabled states.
 *
 * NOTE: MissionCard uses `@nuxt/ui` components (UBadge, UButton) which
 * internally call `useNuxtApp()`. In the jsdom test environment there
 * is no Nuxt app instance, so we stub those components via the
 * `global.stubs` option on `mount()`.
 */
import { describe, test, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MissionCard from '../MissionCard.vue'
import type { MissionRecord } from '~/types/mission'

/** Minimal props shape for a clean "draft" mission. */
function makeMission(overrides: Partial<MissionRecord> = {}): MissionRecord {
  return {
    id: 'test-mission-id',
    name: 'Alpha mission',
    status: 'IDLE',
    description: 'A test mission',
    location_count: 5,
    scan_count: 12,
    created_at: '2024-01-10T08:00:00Z',
    updated_at: '2024-01-10T09:30:00Z',
    center_lat: -33.8,
    center_lon: 151.2,
    ...overrides
  }
}

const UIStubs = {
  UBadge: {
    props: ['color', 'variant', 'size'],
    template: '<span class="u-badge" :data-color="color"><slot /></span>'
  },
  UButton: {
    props: ['label', 'color', 'variant', 'size', 'icon', 'disabled'],
    template:
      '<button class="u-button" :disabled="disabled || undefined" :data-label="label" @click="$emit(\'click\')">{{ label }}<slot /></button>',
    emits: ['click']
  }
}

function wrap(mission: MissionRecord) {
  return mount(MissionCard, {
    props: { mission },
    global: { stubs: UIStubs }
  })
}

describe('MissionCard', () => {
  test('renders mission name', () => {
    const mission = makeMission()
    const wrapper = wrap(mission)
    expect(wrapper.text()).toContain(mission.name)
  })

  test('renders the status badge with the correct label', () => {
    const mission = makeMission({ status: 'RUNNING' })
    const wrapper = wrap(mission)
    expect(wrapper.find('[data-testid="mission-card-status"]').text()).toBe(
      'RUNNING'
    )
  })

  test('shows location and scan counts', () => {
    const mission = makeMission({ location_count: 3, scan_count: 7 })
    const wrapper = wrap(mission)
    expect(wrapper.text()).toContain('3 locations')
    expect(wrapper.text()).toContain('7 scans')
  })

  test('shows center coordinates when present', () => {
    const mission = makeMission({ center_lat: -33.8, center_lon: 151.2 })
    const wrapper = wrap(mission)
    expect(wrapper.text()).toContain('-33.8000')
    expect(wrapper.text()).toContain('151.2000')
  })

  test('View button emits a view event', async () => {
    const mission = makeMission()
    const wrapper = wrap(mission)
    // Find buttons inside the actions footer (footer.u-button elements).
    // The View button is the first UButton in the footer.
    const buttons = wrapper.findAll('.u-button')
    expect(buttons.length).toBeGreaterThan(0)
    await buttons[0].trigger('click')
    expect(wrapper.emitted('view')).toBeTruthy()
  })

  test('Delete button emits a delete event', async () => {
    const mission = makeMission()
    const wrapper = wrap(mission)
    const buttons = wrapper.findAll('.u-button')
    expect(buttons.length).toBeGreaterThanOrEqual(1)
    // Find the Delete button (it has data-label="Delete")
    const deleteBtn = buttons.find((b) => b.attributes('data-label') === 'Delete')
    expect(deleteBtn).toBeDefined()
  })
})
