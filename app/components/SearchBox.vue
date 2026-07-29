<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue?: string
  placeholder?: string
}>(), {
  modelValue: '',
  placeholder: 'Search scans...'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const localValue = ref(props.modelValue)
let debounceTimer: ReturnType<typeof setTimeout> | null = null

function onInput(value: string) {
  localValue.value = value
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    emit('update:modelValue', value)
  }, 300)
}

function clearSearch() {
  localValue.value = ''
  if (debounceTimer) clearTimeout(debounceTimer)
  emit('update:modelValue', '')
}

watch(() => props.modelValue, (val) => {
  localValue.value = val
})
</script>

<template>
  <div class="relative">
    <UInput
      :model-value="localValue"
      :placeholder="placeholder"
      leading-icon="i-lucide-search"
      class="w-full"
      @update:model-value="onInput"
    />
    <UButton
      v-if="localValue"
      color="neutral"
      variant="ghost"
      size="2xs"
      icon="i-lucide-x"
      class="absolute right-1 top-1/2 -translate-y-1/2"
      @click="clearSearch"
    />
  </div>
</template>
