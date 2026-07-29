<script setup lang="ts">
const RAT_OPTIONS = ['ALL', 'LTE', 'UMTS', 'GSM'] as const

withDefaults(defineProps<{
  selectedRat?: string
}>(), {
  selectedRat: 'ALL'
})

const emit = defineEmits<{
  'update:selectedRat': [value: string]
  'reset': []
}>()

function selectRat(rat: string) {
  emit('update:selectedRat', rat)
}

function clearFilters() {
  emit('reset')
}
</script>

<template>
  <div class="space-y-2">
    <div class="flex flex-wrap gap-1.5">
      <UButton
        v-for="rat in RAT_OPTIONS"
        :key="rat"
        :label="rat === 'ALL' ? 'All' : rat"
        size="2xs"
        :color="selectedRat === rat ? 'primary' : 'neutral'"
        :variant="selectedRat === rat ? 'solid' : 'ghost'"
        class="px-3"
        @click="selectRat(rat)"
      />
    </div>

    <div class="flex items-center gap-1">
      <UButton
        v-if="selectedRat !== 'ALL'"
        color="neutral"
        variant="ghost"
        size="2xs"
        icon="i-lucide-rotate-ccw"
        title="Reset filters"
        @click="clearFilters"
      />
    </div>
  </div>
</template>
