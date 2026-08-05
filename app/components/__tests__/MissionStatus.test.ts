import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MissionStatus from '~/components/MissionStatus.vue'

describe('MissionStatus', () => {
  it('renders pending status by default', () => {
    const wrapper = mount(MissionStatus)
    expect(wrapper.text()).toContain('PENDING')
  })

  it('renders ACTIVE status with green color', () => {
    const wrapper = mount(MissionStatus, {
      props: { status: 'ACTIVE' }
    })
    expect(wrapper.text()).toContain('ACTIVE')
    expect(wrapper.find('span').classes().join(' ')).toContain('text-green-600')
  })

  it('renders COMPLETED status with blue color', () => {
    const wrapper = mount(MissionStatus, {
      props: { status: 'COMPLETED' }
    })
    expect(wrapper.text()).toContain('COMPLETED')
    expect(wrapper.find('span').classes().join(' ')).toContain('text-blue-600')
  })

  it('renders FAILED status with red color', () => {
    const wrapper = mount(MissionStatus, {
      props: { status: 'FAILED' }
    })
    expect(wrapper.text()).toContain('FAILED')
    expect(wrapper.find('span').classes().join(' ')).toContain('text-red-600')
  })

  it('renders elapsed time when active and startTime provided', () => {
    const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 300
    const wrapper = mount(MissionStatus, {
      props: { status: 'ACTIVE', startTime: fiveMinutesAgo }
    })
    expect(wrapper.text()).toContain('5m elapsed')
  })

  it('renders elapsed time in hours for long durations', () => {
    const twoHoursAgo = Math.floor(Date.now() / 1000) - 7200
    const wrapper = mount(MissionStatus, {
      props: { status: 'ACTIVE', startTime: twoHoursAgo }
    })
    expect(wrapper.text()).toContain('elapsed')
    expect(wrapper.text()).toContain('2h')
  })

  it('does not render elapsed time for non-active', () => {
    const wrapper = mount(MissionStatus, {
      props: { status: 'PENDING', startTime: Math.floor(Date.now() / 1000) }
    })
    expect(wrapper.text()).not.toContain('elapsed')
  })

  it('renders completion time when endTime provided', () => {
    const endTime = Math.floor(Date.now() / 1000)
    const wrapper = mount(MissionStatus, {
      props: { status: 'COMPLETED', endTime }
    })
    expect(wrapper.text()).toContain('Completed:')
  })

  it('does not render completion time when endTime is null', () => {
    const wrapper = mount(MissionStatus, {
      props: { status: 'COMPLETED', endTime: null }
    })
    expect(wrapper.text()).not.toContain('Completed:')
  })
})
