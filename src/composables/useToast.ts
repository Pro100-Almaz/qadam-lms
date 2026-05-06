import { ref } from 'vue'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

const toasts = ref<Toast[]>([])

export function useToast() {
  function show(toast: Omit<Toast, 'id'>) {
    const id = crypto.randomUUID()
    toasts.value.push({ ...toast, id })
    const duration = toast.duration ?? 5000
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration)
    }
  }

  function dismiss(id: string) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  function success(title: string, message?: string) {
    show({ type: 'success', title, message })
  }

  function error(title: string, message?: string) {
    show({ type: 'error', title, message, duration: 8000 })
  }

  function warning(title: string, message?: string) {
    show({ type: 'warning', title, message })
  }

  function info(title: string, message?: string) {
    show({ type: 'info', title, message })
  }

  return { toasts, show, dismiss, success, error, warning, info }
}
