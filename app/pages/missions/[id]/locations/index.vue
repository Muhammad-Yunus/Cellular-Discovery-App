<!-- app/pages/missions/[id]/locations/index.vue -->
<script setup lang="ts">
definePageMeta({
  layout: 'default',
  title: 'Locations'
})

const route = useRoute()
const missionId = route.params.id as string

const missionStore = useCollectorMissionStore()

onMounted(async () => {
  await missionStore.fetchMissions()
  await missionStore.fetchLocations(missionId)
})
</script>

<template>
  <div class="flex h-full flex-col gap-6 p-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <NuxtLink to="/missions" class="mb-2 inline-flex items-center gap-1 text-sm text-muted hover:text-default">
          <span class="i-lucide-arrow-left" /> Back to missions
        </NuxtLink>
        <h1 class="text-2xl font-bold text-default">Locations</h1>
        <p class="text-sm text-muted">Waypoints for this mission.</p>
      </div>
      <div class="flex items-center gap-2">
        <NuxtLink :to="`/missions/${missionId}/locations/upload`">
          <UButton icon="lucide:upload">Upload CSV</UButton>
        </NuxtLink>
        <NuxtLink :to="`/missions/${missionId}`">
          <UButton variant="ghost">Back</UButton>
        </NuxtLink>
      </div>
    </div>

    <LocationList :mission-id="missionId" />
  </div>
</template>
