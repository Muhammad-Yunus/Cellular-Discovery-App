<script setup lang="ts">
import { useUiStore } from '~/stores/uiStore'

defineOptions({ name: 'AppBottomPanel' })

type InfoTab = 'signal' | 'gps' | 'system'

const uiStore = useUiStore()

const isOpen = computed(() => uiStore.bottomPanelOpen)
const activeTab = computed(() => uiStore.activeInfoTab)

interface TabDef {
  label: string
  icon: string
  value: InfoTab
}

const tabItems: TabDef[] = [
  { label: 'Signal', icon: 'lucide:radio', value: 'signal' },
  { label: 'GPS', icon: 'lucide:satellite', value: 'gps' },
  { label: 'System', icon: 'lucide:monitor', value: 'system' }
]

function onTabChange(tab: InfoTab) {
  uiStore.setActiveTab(tab)
}
</script>

<template>
  <Transition name="panel">
    <div
      v-if="isOpen"
      class="fixed bottom-4 left-1/2 -translate-x-1/2 z-[1100] w-[90%] max-w-[800px] rounded-xl border border-muted bg-black/70 backdrop-blur-md overflow-hidden shadow-lg flex flex-col"
      style="height: 220px;"
    >
      <!-- Tab header: wider buttons, horizontal divider below -->
      <div
        role="tablist"
        class="flex items-stretch border-b border-muted bg-black/40 shrink-0"
      >
        <button
          v-for="tab in tabItems"
          :key="tab.value"
          type="button"
          role="tab"
          :aria-selected="activeTab === tab.value"
          :class="[
            'flex-1 flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium transition-colors',
            'border-b-2 -mb-px',
            activeTab === tab.value
              ? 'text-default border-primary'
              : 'text-muted border-transparent hover:text-default hover:bg-white/5'
          ]"
          @click="onTabChange(tab.value)"
        >
          <UIcon
            :name="tab.icon"
            class="size-4"
          />
          <span>{{ tab.label }}</span>
        </button>
      </div>

      <!-- Tab content: same fixed height for all tabs -->
      <div class="flex-1 overflow-y-auto">
        <SignalPanel v-if="activeTab === 'signal'" />
        <GPSPanel v-else-if="activeTab === 'gps'" />
        <SystemPanel v-else-if="activeTab === 'system'" />
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
