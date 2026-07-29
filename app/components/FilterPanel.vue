<script setup lang="ts">
const RAT_OPTIONS = ['ALL', 'LTE', 'NR', 'GSM', 'UMTS', 'CDMA'] as const

withDefaults(defineProps<{
  selectedRat?: string
  operatorFilter?: string
}>(), {
  selectedRat: 'ALL',
  operatorFilter: ''
})

const emit = defineEmits<{
  'update:selectedRat': [value: string]
  'update:operatorFilter': [value: string]
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
    <div class="flex flex-wrap gap-1">
      <UButton
        v-for="rat in RAT_OPTIONS"
        :key="rat"
        :label="rat === 'ALL' ? 'All' : rat"
        size="2xs"
        :color="selectedRat === rat ? 'primary' : 'neutral'"
        :variant="selectedRat === rat ? 'solid' : 'ghost'"
        @click="selectRat(rat)"
      />
    </div>

    <div class="flex items-center gap-1">
      <UInput
        :model-value="operatorFilter"
        placeholder="Filter operator..."
        leading-icon="i-lucide-filter"
        size="xs"
        class="flex-1"
        @update:model-value="$emit('update:operatorFilter', $event)"
      />
      <UButton
        v-if="selectedRat !== 'ALL' || operatorFilter"
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
