<script setup lang="ts">
const RAT_OPTIONS = ['ALL', 'LTE', 'UMTS', 'GSM'] as const

withDefaults(defineProps<{
  selectedRat?: string
}>(), {
  selectedRat: 'ALL'
})

const emit = defineEmits<{
  'update:selectedRat': [value: string]
}>()

function selectRat(rat: string) {
  emit('update:selectedRat', rat)
}
</script>

<template>
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
</template>
