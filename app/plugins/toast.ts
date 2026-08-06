import { useToast } from '~/composables/useToast'

/**
 * Register the shared toast service as `$toast` so any component (including
 * those rendered server-side via the legacy `useCustomToast` wrapper) can
 * dispatch a toast via `const { $toast } = useNuxtApp()` without manually
 * importing the composable. The state lives at module scope, so each
 * `useToast()` call returns the same singleton.
 */
export default defineNuxtPlugin(() => {
  return {
    provide: {
      toast: useToast()
    }
  }
})