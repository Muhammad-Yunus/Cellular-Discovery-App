<script setup lang="ts">
import { useUiStore } from '~/stores/uiStore'

defineOptions({ name: 'AppBottomPanel' })

const uiStore = useUiStore()

const isOpen = computed(() => uiStore.bottomPanelOpen)
const activeTab = computed(() => uiStore.activeInfoTab)

const tabItems = [
  { label: 'Signal', icon: 'lucide:radio', value: 'signal', slot: 'signal' as const },
  { label: 'GPS', icon: 'lucide:satellite', value: 'gps', slot: 'gps' as const },
  { label: 'System', icon: 'lucide:monitor', value: 'system', slot: 'system' as const }
]

function onTabChange(tab: string) {
  uiStore.setActiveTab(tab as 'signal' | 'gps' | 'system')
}
</script>

<template>
  <Transition name="panel">
    <div
      v-if="isOpen"
      class="fixed bottom-4 left-1/2 -translate-x-1/2 z-[1100] w-[90%] max-w-[800px] rounded-xl border border-muted bg-black/70 backdrop-blur-md overflow-hidden shadow-lg"
    >
      <div class="flex items-center justify-between border-b border-muted px-3">
        <UTabs
          :items="tabItems"
          :model-value="activeTab"
          :unmount-on-hide="false"
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
