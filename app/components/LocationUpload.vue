<!-- app/components/LocationUpload.vue -->
<script setup lang="ts">
import { useCollectorMissionStore } from '~/stores/mission'
import type { CSVUploadResult } from '~/types/mission'

const props = defineProps<{
  missionId: string
}>()

const emit = defineEmits<{
  uploaded: [count: number]
  error: [msg: string]
}>()

const missionStore = useCollectorMissionStore()
const file = ref<File | null>(null)
const uploading = ref(false)
const preview = ref<Record<string, string>[]>([])
const errors = ref<{ row: number; message: string }[]>([])

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const headers = lines[0]!.split(',').map(h => h.trim().toLowerCase())
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim())
    return headers.reduce<Record<string, string>>((acc, h, i) => {
      acc[h] = values[i] ?? ''
      return acc
    }, {})
  })
}

function validateAndPreview(fileInput: File) {
  file.value = fileInput
  const reader = new FileReader()
  reader.onload = (e: ProgressEvent<FileReader>) => {
    const text = (e.target?.result as string) ?? ''
    preview.value = parseCSV(text)
    errors.value = preview.value.map((row, idx) => {
      const lat = parseFloat(row['latitude'] ?? '')
      const lon = parseFloat(row['longitude'] ?? '')
      if (Number.isNaN(lat) || Number.isNaN(lon)) {
        return { row: idx + 2, message: 'latitude/longitude must be numeric' }
      }
      return { row: idx + 2, message: '' }
    }).filter(r => r.message)
  }
  reader.readAsText(fileInput)
}

async function upload() {
  if (!file.value) return
  if (errors.value.length) {
    emit('error', `Found ${errors.value.length} validation error(s) — fix before uploading.`)
    return
  }
  uploading.value = true
  try {
    const result: CSVUploadResult = await missionStore.uploadLocationsCSV(
      props.missionId,
      file.value
    )
    emit('uploaded', result.success_rows)
    preview.value = []
    errors.value = []
    file.value = null
  } catch (e) {
    emit('error', (e as Error).message)
  } finally {
    uploading.value = false
  }
}

defineExpose({ validateAndPreview, upload })
</script>

<template>
  <div class="flex flex-col gap-4">
    <div>
      <label class="mb-1 block text-sm font-medium text-default">
        Upload CSV
      </label>
      <input
        type="file"
        accept=".csv"
        class="block w-full text-sm text-muted file:mr-4 file:rounded file:border file:border-default/20 file:bg-accented file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-accented/50"
        @change="(e: Event) => validateAndPreview((e.target as HTMLInputElement).files?.[0] as File)"
      />
      <p class="mt-1 text-xs text-muted">
        Columns: <code>latitude</code>, <code>longitude</code> (optional:
        <code>altitude</code>, <code>order</code>)
      </p>
    </div>

    <div v-if="preview.length" class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-default/10 text-left text-muted">
            <th class="pb-2 pr-4">#</th>
            <th class="pb-2 pr-4">Latitude</th>
            <th class="pb-2 pr-4">Longitude</th>
            <th class="pb-2 pr-4">Altitude</th>
            <th class="pb-2">Order</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, idx) in preview"
            :key="idx"
            :class="errors.find(e => e.row === idx + 2) ? 'bg-error/10' : ''"
          >
            <td class="py-1 pr-4 text-muted">{{ idx + 2 }}</td>
            <td class="py-1 pr-4 font-mono">{{ row.latitude }}</td>
            <td class="py-1 pr-4 font-mono">{{ row.longitude }}</td>
            <td class="py-1 pr-4 font-mono">{{ row.altitude ?? '—' }}</td>
            <td class="py-1 font-mono">{{ row.order ?? '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="errors.length" class="rounded border border-error/30 bg-error/10 p-3 text-xs text-error">
      <p>{{ errors.length }} row(s) invalid — fix before uploading.</p>
    </div>

    <div class="flex items-center gap-3">
      <UButton
        :loading="uploading"
        icon="lucide:upload"
        :disabled="!file || errors.length > 0"
        @click="upload"
      >
        Upload {{ preview.length }} location(s)
      </UButton>
    </div>
  </div>
</template>
