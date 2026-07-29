<template>
  <div style="display:none">
    <slot />
  </div>
</template>

<script setup lang="ts">
import type { ScanSummary } from '~/types'

const props = defineProps<{
  scan: ScanSummary
}>()

const emit = defineEmits<{
  selected: [scan: ScanSummary]
}>()

const mapActions = inject(MapKey)

if (mapActions) {
  onMounted(() => {
    const marker = mapActions.addMarker(props.scan)
    if (marker) {
      marker.on('click', () => emit('selected', props.scan))
    }
  })

  onUnmounted(() => {
    mapActions.removeMarker(props.scan.id)
  })
}
</script>
