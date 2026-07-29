export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@pinia/nuxt'
  ],
  devtools: {
    enabled: true
  },
  app: {
    head: {
      htmlAttrs: {
        class: 'dark'
      }
    }
  },
  css: ['~/assets/css/main.css', 'leaflet/dist/leaflet.css'],
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8000/api/v1',
      appName: process.env.NUXT_PUBLIC_APP_NAME || 'LTE Scanner',
      defaultLat: process.env.NUXT_PUBLIC_DEFAULT_LAT || '-6.150676643667096',
      defaultLon: process.env.NUXT_PUBLIC_DEFAULT_LON || '106.89665223346297'
    }
  },
  compatibilityDate: '2026-06-30',
  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
