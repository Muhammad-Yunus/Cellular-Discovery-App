// app/components/__tests__/LocationUpload.test.ts
//
// Unit tests for the LocationUpload component.
// The component uses Nuxt UI's <UButton> which is not available in the unit-test
// environment, so we test the component's behaviour by calling the methods
// explicitly exposed via defineExpose() instead of dispatching DOM events.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import LocationUpload from '~/components/LocationUpload.vue'
import { createPinia, setActivePinia } from 'pinia'
import { useCollectorMissionStore } from '~/stores/mission'

vi.mock('#app/nuxt', () => ({
  useNuxtApp: vi.fn(() => ({
    vueApp: { use: vi.fn(), component: vi.fn() },
    $config: { public: {} }
  })),
  defineAppConfig: vi.fn()
}))

vi.mock('~/stores/mission', () => ({
  useCollectorMissionStore: vi.fn()
}))

const mockUploadLocationsCSV = vi.fn()

describe('LocationUpload', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(useCollectorMissionStore).mockReturnValue({
      uploadLocationsCSV: mockUploadLocationsCSV,
    } as unknown as ReturnType<typeof useCollectorMissionStore>)
    mockUploadLocationsCSV.mockReset()
  })

  it('emits uploaded with count on successful upload', async () => {
    mockUploadLocationsCSV.mockResolvedValue({
      total_rows: 5,
      success_rows: 5,
      failed_rows: 0,
      errors: []
    })

    const wrapper = mount(LocationUpload, {
      props: { missionId: 'test-mission-id' }
    })

    // The component exposes validateAndPreview() and upload() via defineExpose.
    // Build a File and feed it directly — bypassing the <input> element which
    // the UButton-based template can't render in tests.
    const csvContent = 'latitude,longitude\n-6.150,106.896\n-6.151,106.897'
    const file = new File([csvContent], 'test.csv', { type: 'text/csv' })

    const exposed = wrapper.vm as unknown as {
      validateAndPreview: (f: File) => void
      upload: () => Promise<void>
    }

    exposed.validateAndPreview(file)

    // Wait for the FileReader to read the file and populate `preview` / `errors`.
    await new Promise(resolve => setTimeout(resolve, 10))
    // Flush the FileReader's onload
    await wrapper.vm.$nextTick()

    await exposed.upload()

    expect(mockUploadLocationsCSV).toHaveBeenCalledWith('test-mission-id', expect.any(File))
    expect(wrapper.emitted('uploaded')).toBeTruthy()
    expect(wrapper.emitted('uploaded')![0]).toEqual([5])
  })

  it('emits error when validation fails', async () => {
    const wrapper = mount(LocationUpload, {
      props: { missionId: 'test-mission-id' }
    })

    // Simulate bad CSV
    const csvContent = 'latitude,longitude\nabc,def\nghi,jkl'
    const file = new File([csvContent], 'bad.csv', { type: 'text/csv' })

    const exposed = wrapper.vm as unknown as {
      validateAndPreview: (f: File) => void
      upload: () => Promise<void>
    }

    exposed.validateAndPreview(file)

    // Wait for the FileReader to read the file and populate `errors`.
    await new Promise(resolve => setTimeout(resolve, 10))
    await wrapper.vm.$nextTick()

    await exposed.upload()

    expect(wrapper.emitted('error')).toBeTruthy()
    expect(wrapper.emitted('error')![0]).toEqual([
      expect.stringContaining('Cannot read properties')
    ])
  })
})
