<!-- app/pages/missions/[id]/locations/upload.vue -->
<script setup lang="ts">
definePageMeta({
  layout: 'default',
  title: 'Upload locations'
})

const route = useRoute()
const router = useRouter()
const missionId = route.params.id as string

const uploadRef = ref<InstanceType<typeof LocationUpload> | null>(null)

function onUploaded(count: number) {
  useCustomToast().add({
    title: `Uploaded ${count} location(s).`,
    color: 'success'
  })
  setTimeout(() => router.push(`/missions/${missionId}/locations`), 1000)
}

function onError(msg: string) {
  useCustomToast().add({
    title: 'Upload failed',
    description: msg,
    color: 'error'
  })
}
</script>

<template>
  <div class="mx-auto max-w-3xl p-6">
    <NuxtLink to="/missions" class="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-default">
      <span class="i-lucide-arrow-left" /> Back to missions
    </NuxtLink>

    <h1 class="mb-2 text-2xl font-bold text-default">Upload locations</h1>
    <p class="mb-6 text-sm text-muted">Add GPS waypoints to this mission via CSV.</p>

    <LocationUpload :mission-id="missionId" @uploaded="onUploaded" @error="onError" ref="uploadRef" />
  </div>
</template>
