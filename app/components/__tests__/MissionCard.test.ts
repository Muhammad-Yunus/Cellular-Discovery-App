/**
 * app/components/__tests__/MissionCard.test.ts
 *
 * Basic unit tests for MissionCard. Each test mounts the component in
 * isolation and asserts that the DOM reflects the expected mission
 * data / status / disabled states.
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
    status: 'draft',
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

function wrap(mission: MissionRecord) {
  return mount(MissionCard, {
    props: { mission }
  })
}

describe('MissionCard', () => {
  test('renders mission name', () => {
    const mission = makeMission()
    const wrapper = wrap(mission)
    expect(wrapper.text()).toContain(mission.name)
  })

  test('renders the status badge with the correct label', () => {
    const mission = makeMission({ status: 'active' })
    const wrapper = wrap(mission)
    expect(wrapper.find('[data-testid="mission-card-status"]').text()).toBe(
      'Active'
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
    await wrapper.find('[data-testid="mission-card"]').find('button').first()!.trigger('click')
    expect(wrapper.emitted('view')).toBeTruthy()
  })

  test('Start button is disabled when status is not draft/paused', () => {
    const mission = makeMission({ status: 'active' })
    const wrapper = wrap(mission)
    const startBtn = wrapper.findComponent({ name: 'UButton' }).findAll((v: any) => v.text().includes('Start')).at(-1)
    expect(startBtn.attributes('disabled')).toBeDefined()
  })

  test('Pause button is disabled when status is not active', () => {
    const mission = makeMission({ status: 'draft' })
    const wrapper = wrap(mission)
    const pauseBtn = wrapper.findAllComponents({ name: 'UButton' }).find((v: any) => v.text().includes('Pause'))
    expect(pauseBtn.attributes('disabled')).toBeDefined()
  })
})
