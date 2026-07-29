import { defineVitestConfig } from '@nuxt/test-utils/config'
import { resolve } from 'path'

const APP_DIR = resolve(__dirname, 'app')

export default defineVitestConfig({
  test: {
    environment: 'jsdom',
    testTimeout: 15000,
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['node_modules', '.nuxt', 'dist'],
    server: {
      deps: {
        inline: ['@nuxt/ui']
      }
    }
  },
  resolve: {
    alias: {
      '~': APP_DIR,
      '@': APP_DIR,
      '~/stores': resolve(APP_DIR, 'stores'),
      '~/utils': resolve(APP_DIR, 'utils'),
      '~/composables': resolve(APP_DIR, 'composables'),
      '~/components': resolve(APP_DIR, 'components'),
      '~/pages': resolve(APP_DIR, 'pages'),
      '~/layouts': resolve(APP_DIR, 'layouts'),
      '~/types': resolve(APP_DIR, 'types'),
      '~/services': resolve(APP_DIR, 'services')
    }
  }
})
