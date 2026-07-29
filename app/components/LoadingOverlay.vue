<script setup lang="ts">
withDefaults(defineProps<{
  loading?: boolean
  message?: string
}>(), {
  loading: false,
  message: 'Loading...'
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="loading"
        class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50"
      >
        <div class="flex flex-col items-center gap-3 rounded-xl bg-elevated px-8 py-6 shadow-lg">
          <span class="i-lucide-loader-circle size-8 animate-spin text-primary" />
          <p class="text-sm text-default">
            {{ message }}
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
