import { defineStore } from 'pinia'

interface GPSState {
  latitude: number
  longitude: number
  provider: 'mock' | 'serial' | 'gps' | null
  connected: boolean
}

export const useGpsStore = defineStore('gps', {
  state: (): GPSState => ({
    latitude: -6.150676643667096,
    longitude: 106.89665223346297,
    provider: null,
    connected: false
  }),

  actions: {
    updatePosition(lat: number, lon: number) {
      this.latitude = lat
      this.longitude = lon
    },

    setProvider(provider: GPSState['provider']) {
      this.provider = provider
    },

    setConnected(connected: boolean) {
      this.connected = connected
    }
  }
})
