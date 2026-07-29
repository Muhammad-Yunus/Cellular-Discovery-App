<script setup lang="ts">
import { useUiStore } from '~/stores/uiStore'

defineOptions({ name: 'AppBottomPanel' })

const uiStore = useUiStore()

const isOpen = computed(() => uiStore.bottomPanelOpen)
const activeTab = computed(() => uiStore.activeInfoTab)

const tabItems = [
  { label: 'Signal', icon: 'i-lucide-radio', slot: 'signal' as const },
  { label: 'GPS', icon: 'i-lucide-satellite', slot: 'gps' as const },
  { label: 'System', icon: 'i-lucide-monitor', slot: 'system' as const }
]

function onTabChange(tab: string) {
  uiStore.setActiveTab(tab as 'signal' | 'gps' | 'system')
}
</script>

<template>
  <Transition name="panel">
    <div
      v-if="isOpen"
      class="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-[800px] rounded-xl border border-muted bg-black/70 backdrop-blur-md overflow-hidden"
    >
      <div class="flex items-center justify-between border-b border-muted px-3">
        <UTabs
          :items="tabItems"
          :model-value="activeTab"
          size="sm"
          class="-mb-px"
          @update:model-value="onTabChange"
        >
          <template #signal>
            <SignalPanel />
          </template>
          <template #gps>
            <GPSPanel />
          </template>
          <template #system>
            <SystemPanel />
          </template>
        </UTabs>

        <UButton
          color="neutral"
          variant="ghost"
          size="2xs"
          icon="i-lucide-chevron-down"
          title="Close panel"
          @click="uiStore.toggleBottomPanel()"
        />
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.panel-enter-active,
.panel-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.panel-enter-from,
.panel-leave-to {
  transform: translateY(1rem);
  opacity: 0;
}
</style>
