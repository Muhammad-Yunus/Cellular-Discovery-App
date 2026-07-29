<script setup lang="ts">
import { useScanStore } from '~/stores/scanStore'

defineOptions({ name: 'FloatingScanButton' })

const scanStore = useScanStore()
const isCreating = computed(() => scanStore.creating)

async function handleScan() {
  if (isCreating.value) return
  await scanStore.createScan()
}
</script>

<template>
  <ClientOnly>
    <button
      type="button"
      :class="[
        'floating-scan-btn',
        isCreating && 'floating-scan-btn--loading'
      ]"
      :disabled="isCreating"
      :title="isCreating ? 'Scanning…' : 'Scan Signal'"
      :aria-label="isCreating ? 'Scanning in progress' : 'Start signal scan'"
      @click="handleScan"
    >
      <span class="floating-scan-btn__pulse" aria-hidden="true" />
      <span class="floating-scan-btn__pulse floating-scan-btn__pulse--delay" aria-hidden="true" />
      <span class="floating-scan-btn__icon" aria-hidden="true">
        <svg
          v-if="!isCreating"
          xmlns="http://www.w3.org/2000/svg"
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M4.9 16.1C1 12.2 1 5.8 4.9 1.9m2.9 2.8a6.14 6.14 0 0 0-.8 7.5" />
          <circle cx="12" cy="9" r="2" />
          <path d="M16.2 4.8c2 2 2.26 5.11.8 7.47M19.1 1.9a9.96 9.96 0 0 1 0 14.1m-9.6 2h5M8 22l4-11 4 11" />
        </svg>
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          class="floating-scan-btn__spinner"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      </span>
      <span v-if="!isCreating" class="floating-scan-btn__label">Scan Signal</span>
      <span v-else class="floating-scan-btn__label">Scanning…</span>
    </button>
  </ClientOnly>
</template>