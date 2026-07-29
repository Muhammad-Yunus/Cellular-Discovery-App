<script setup lang="ts">
import { useCustomToast } from '@/composables/useCustomToast'

const { toasts, remove, colorClass } = useCustomToast()
</script>

<template>
  <ClientOnly>
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm">
      <TransitionGroup name="toast" tag="div">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="pointer-events-auto rounded-lg shadow-lg p-3 transition-all duration-300 ease-in-out transform translate-x-0"
          :class="colorClass(t.color)"
        >
          <div class="flex items-start gap-2">
            <!-- Icon -->
            <UIcon
              v-if="t.icon"
              :name="t.icon"
              class="size-5 mt-1 flex-shrink-0"
            />
            <UIcon
              v-else
              :name="{
                success: 'i-lucide-check-circle',
                error: 'i-lucide-x-circle',
                info: 'i-lucide-info',
                warning: 'i-lucide-alert-triangle'
              }[t.color]"
              class="size-5 mt-1 flex-shrink-0"
            />
            
            <!-- Content -->
            <div class="flex-1 min-w-0">
              <p class="font-medium text-sm truncate">{{ t.title }}</p>
              <p
                v-if="t.description"
                class="text-xs opacity-90 truncate mt-0.5"
              >{{ t.description }}</p>
            </div>

            <!-- Close button -->
            <button
              @click="remove(t.id)"
              class="opacity-75 hover:opacity-100 focus:outline-none"
              aria-label="Close toast"
            >
              <UIcon name="i-lucide-x" class="size-4" />
            </button>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </ClientOnly>
</template>

<style scoped>
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.toast-enter-active,
.toast-leave-active {
  opacity: 1;
  transform: translateX(0);
  transition: all 0.3s ease;
}
</style>