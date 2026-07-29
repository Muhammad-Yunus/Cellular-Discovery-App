import { ref, computed } from 'vue'

type ToastColor = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: number
  title: string
  description?: string
  color: ToastColor
  icon?: string
  timeout?: number
}

const toasts = ref<Toast[]>([])
let nextId = 1

export function useCustomToast() {
  const add = (props: Omit<Toast, 'id'>): void => {
    if (import.meta.server) return
    const id = nextId++
    const timeout = props.timeout || 5000
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
    const map: Record<string, string> = {
      success: 'bg-green-600 text-white',
      error: 'bg-red-600 text-white',
      info: 'blue-600 text-white',
      warning: 'amber-600 text-white'
    }
    return map[color] || 'bg-gray-600 text-white'
  }

  return {
    toasts,
    add,
    remove,
    colorClass
  }
}

// Export for global use
declare module '#imports' {
  interface NuxtInjection {
    useCustomToast: () => ReturnType<typeof useCustomToast>
  }
}

export default useCustomToast()