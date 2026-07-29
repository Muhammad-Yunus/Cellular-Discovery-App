import { defineStore } from 'pinia'

type InfoTab = 'signal' | 'gps' | 'system'

interface UIState {
  sidebarOpen: boolean
  bottomPanelOpen: boolean
  activeInfoTab: InfoTab
}

export const useUiStore = defineStore('ui', {
  state: (): UIState => ({
    sidebarOpen: true,
    bottomPanelOpen: true,
    activeInfoTab: 'signal'
  }),

  actions: {
    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen
    },

    toggleBottomPanel() {
      this.bottomPanelOpen = !this.bottomPanelOpen
    },

    setActiveTab(tab: InfoTab) {
      this.activeInfoTab = tab
    }
  }
})
