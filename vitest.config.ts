import { defineVitestConfig } from '@nuxt/test-utils/config'
import { resolve } from 'path'

const APP_DIR = resolve(__dirname, 'app')

export default defineVitestConfig({
  test: {
    environment: 'jsdom',
    // Nuxt UI + transitive deps cause 30+ s cold-cache SFC transform;
    // 60 s is a realistic ceiling for that first run. After warm-cache
    // it drops to <100 ms (verified via [debug] SFC import took).
    testTimeout: 60000,
    hookTimeout: 60000,
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['node_modules', '.nuxt', 'dist'],
    server: {
      deps: {
        // Inline the heavy Nuxt UI tree so Vite esbuild-prebundle
        // resolves them once instead of re-transforming on every import.
        inline: [
          '@nuxt/ui',
          '@nuxt/ui/runtime',
          '@iconify/vue',
          '@internationalized/date',
          'fuse.js',
          'ohash',
          'defu',
          'unhead',
          'colortranslator',
          'mlly',
          'ufo',
          'uncrypto'
        ]
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
