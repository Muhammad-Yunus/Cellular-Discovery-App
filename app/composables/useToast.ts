// app/composables/useToast.ts
//
// Global toast helper exposing the same `add/remove/colorClass` API that the
// existing custom-toaster service uses, so any composable (or component) can
// fire a toast by calling `const toast = useToast()` and `toast.add({...})`.
//
// This intentionally shadows (and extends) the legacy `useCustomToast` from
// the original app so mission-planner screens can use the same UX pattern
// without duplicating toasts or importing the older helper.

import { type Ref, ref } from 'vue'

type ToastColor = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: number
  title: string
  description?: string
  color: ToastColor
  icon?: string
  timeout?: number
}

const toasts: Ref<Toast[]> = ref([])
let nextId = 1

export function useToast() {
  const add = (props: Omit<Toast, 'id'>): void => {
    if (import.meta.server) return
    const id = nextId++
    const timeout = props.timeout ?? 5000
    toasts.value.push({ ...props, id })
    setTimeout(() => {
      const idx = toasts.value.findIndex(t => t.id === id)
      if (idx >= 0) toasts.value.splice(idx, 1)
    }, timeout)
  }

  const remove = (id: number): void => {
    const idx = toasts.value.findIndex(t => t.id === id)
    if (idx >= 0) toasts.value.splice(idx, 1)
  }

  const colorClass = (color: ToastColor): string => {
    const map: Record<ToastColor, string> = {
      success: 'bg-green-600 text-white',
      error: 'bg-red-600 text-white',
      info: 'bg-blue-600 text-white',
      warning: 'bg-amber-600 text-white'
    }
    return map[color]
  }

  return { toasts, add, remove, colorClass }
}

// Expose globally so any composable can call useToast() without imports.
declare module '#imports' {
  interface NuxtApp {
    $toast: ReturnType<typeof useToast>
  }
  interface NuxtInjection {
    useToast: typeof useToast
  }
}

export default useToast