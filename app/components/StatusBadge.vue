<script setup lang="ts">
const props = withDefaults(defineProps<{
  status: 'ok' | 'warning' | 'error' | 'info' | 'loading'
  label?: string
  pulse?: boolean
}>(), {
  label: '',
  pulse: false
})

const colorMap: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  ok: 'success',
  warning: 'warning',
  error: 'error',
  info: 'info',
  loading: 'neutral'
}

const defaultLabels: Record<string, string> = {
  ok: 'OK',
  warning: 'Warning',
  error: 'Error',
  info: 'Info',
  loading: 'Loading...'
}

const badgeColor = computed(() => colorMap[props.status] ?? 'neutral')
const badgeLabel = computed(() => props.label || defaultLabels[props.status] || props.status)
</script>

<template>
  <UBadge
    :color="badgeColor"
    :class="[pulse && 'animate-pulse']"
    variant="subtle"
    size="sm"
  >
    <span
      v-if="status === 'loading'"
      class="i-lucide-loader-circle mr-1 size-3 animate-spin"
    />
    {{ badgeLabel }}
  </UBadge>
</template>
