import { defineVitestConfig } from '@nuxt/test-utils/config'
import { resolve } from 'path'

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
      '~': resolve(__dirname),
      '@': resolve(__dirname)
    }
  }
})
