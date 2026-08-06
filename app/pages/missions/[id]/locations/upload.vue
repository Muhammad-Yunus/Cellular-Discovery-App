<!-- app/pages/missions/[id]/locations/upload.vue -->
<script setup lang="ts">
import { useCollectorMissionStore } from '~/stores/mission'
import { useCustomToast } from '~/composables/useCustomToast'

definePageMeta({
  layout: 'default',
  title: 'Upload locations'
})

const route = useRoute()
const router = useRouter()
const missionId = route.params.id as string

const missionStore = useCollectorMissionStore()
const toast = useCustomToast()

const uploadRef = ref<InstanceType<typeof LocationUpload> | null>(null)

onMounted(async () => {
  try {
    await missionStore.fetchMissionById(missionId)
  } catch (e) {
    toast.add({
      title: 'Failed to load mission',
      description: (e as Error).message,
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
    router.push('/missions')
  }
})

function onUploaded(count: number) {
  toast.add({
    title: `Uploaded ${count} location(s).`,
    color: 'success',
    icon: 'i-lucide-check-circle'
  })
  setTimeout(() => router.push(`/missions/${missionId}/locations`), 1000)
}

function onError(msg: string) {
  toast.add({
    title: 'Upload failed',
    description: msg,
    color: 'error',
    icon: 'i-lucide-alert-circle'
  })
}
</script>

<template>
  <div class="p-4 md:p-6 max-w-xl mx-auto min-h-screen flex flex-col gap-6">
    <!-- Top row: Back link (left) + Breadcrumb (right) -->
    <div class="flex items-center justify-between">
      <NuxtLink :to="`/missions/${missionId}`" class="text-sm text-muted hover:text-primary">
        ← Back
      </NuxtLink>
      <MissionBreadcrumb
        current="upload"
        :mission-id="missionId"
        :mission-name="missionStore.selectedMission?.name"
      />
    </div>

    <!-- Header -->
    <h1 class="text-xl font-semibold text-highlighted">Upload locations</h1>
    <p class="text-sm text-muted">Add GPS waypoints to this mission via CSV.</p>

    <!-- Form area with bordered container -->
    <div class="border border-default/10 bg-elevated rounded-lg p-4">
      <LocationUpload
        :mission-id="missionId"
        @uploaded="onUploaded"
        @error="onError"
        ref="uploadRef"
      />
    </div>
  </div>
</template>
