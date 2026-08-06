<script setup lang="ts">
defineProps<{
  current?: 'new' | 'edit' | 'detail' | 'upload'
  missionId?: string
  missionName?: string
}>()

function truncateName(name: string | undefined | null, maxLen = 7): string {
  if (!name) return ''
  return name.length > maxLen ? `${name.slice(0, maxLen)}...` : name
}
</script>

<template>
  <div class="flex items-center gap-2 text-sm text-muted">
    <!-- Home -->
    <NuxtLink to="/" class="flex items-center gap-1 text-primary hover:text-accented transition-colors">
      <Icon name="lucide:home" class="text-base shrink-0" aria-hidden="true" />
      Home
    </NuxtLink>
    <span class="text-muted">›</span>

    <!-- Missions -->
    <NuxtLink to="/missions" class="flex items-center gap-1 text-primary hover:text-accented transition-colors">
      <Icon name="lucide:rocket" class="text-base shrink-0" aria-hidden="true" />
      Missions
    </NuxtLink>
    <span class="text-muted">›</span>

    <!-- Detail or New or Edit (segment 3) -->
    <template v-if="current !== 'edit' && current !== 'upload'">
      <NuxtLink
        v-if="current === 'detail' && missionId && missionName"
        :to="`/missions/${missionId}`"
        class="flex items-center gap-1 text-primary hover:text-accented transition-colors"
        :title="missionName"
      >
        <Icon name="lucide:rocket" class="text-base shrink-0" aria-hidden="true" />
        {{ missionId }} — {{ truncateName(missionName, 7) }}
      </NuxtLink>
      <span
        v-else
        class="flex items-center gap-1 text-highlighted"
      >
        <Icon
          :name="current === 'new' ? 'lucide:plus-circle' : 'lucide:rocket'"
          class="text-base shrink-0"
          aria-hidden="true"
        />
        {{ current === 'new' ? 'New' : `${missionId} — '${truncateName(missionName, 7)}' mission` }}
      </span>
    </template>

    <!-- Upload (segment 4, when current is 'upload') -->
    <template v-if="current === 'upload'">
      <NuxtLink
        v-if="missionId"
        :to="`/missions/${missionId}`"
        class="flex items-center gap-1 text-primary hover:text-accented transition-colors"
        :title="missionName"
      >
        <Icon name="lucide:rocket" class="text-base shrink-0" aria-hidden="true" />
        {{ missionId }} — {{ truncateName(missionName, 7) }}
      </NuxtLink>
      <span v-else class="flex items-center gap-1 text-highlighted">
        <Icon name="lucide:rocket" class="text-base shrink-0" aria-hidden="true" />
        {{ missionId }} — {{ truncateName(missionName, 7) }}
      </span>
      <span class="text-muted">›</span>
      <span class="flex items-center gap-1 text-highlighted">
        <Icon name="lucide:upload" class="text-base shrink-0" aria-hidden="true" />
        Locations Upload
      </span>
    </template>

    <!-- Edit (segment 4, when current is 'edit') -->
    <template v-if="current === 'edit'">
      <NuxtLink
        v-if="missionId"
        :to="`/missions/${missionId}`"
        class="flex items-center gap-1 text-primary hover:text-accented transition-colors"
        :title="missionName"
      >
        <Icon name="lucide:rocket" class="text-base shrink-0" aria-hidden="true" />
        {{ missionId }} — {{ truncateName(missionName, 7) }}
      </NuxtLink>
      <span v-else class="flex items-center gap-1 text-highlighted">
        <Icon name="lucide:rocket" class="text-base shrink-0" aria-hidden="true" />
        {{ missionId }} — {{ truncateName(missionName, 7) }}
      </span>
      <span class="text-muted">›</span>
      <span class="flex items-center gap-1 text-highlighted">
        <Icon name="lucide:edit" class="text-base shrink-0" aria-hidden="true" />
        Edit
      </span>
    </template>
  </div>
</template>
