import { ref, computed, onUnmounted } from 'vue'

export function useRateLimitedAction() {
  const retryAfter = ref(0)
  const isRateLimited = computed(() => retryAfter.value > 0)
  let interval: ReturnType<typeof setInterval> | null = null

  function handleRateLimitError(error: unknown): boolean {
    if (
      error &&
      typeof error === 'object' &&
      'response' in error &&
      (error as { response: { status: number } }).response?.status === 429
    ) {
      const headers = (error as { response: { headers?: Record<string, string> } }).response.headers
      const header = headers?.['retry-after']
      retryAfter.value = header ? parseInt(header, 10) : 60

      if (interval) clearInterval(interval)
      interval = setInterval(() => {
        retryAfter.value--
        if (retryAfter.value <= 0 && interval) {
          clearInterval(interval)
          interval = null
        }
      }, 1000)

      return true
    }
    return false
  }

  onUnmounted(() => {
    if (interval) clearInterval(interval)
  })

  return { retryAfter, isRateLimited, handleRateLimitError }
}
