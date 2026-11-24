import { computed, type ComputedRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'

/**
 * The active tab lives in `?tab=`, so a reload or a shared link lands on the
 * same tab. A missing, unknown or not-permitted value falls back to `fallback`.
 */
export function useQueryTab<T extends string>(allowed: ComputedRef<readonly T[]>, fallback: ComputedRef<T>) {
  const route = useRoute()
  const router = useRouter()

  const activeTab = computed<T>(() => {
    const value = route.query.tab
    return typeof value === 'string' && (allowed.value as readonly string[]).includes(value)
      ? (value as T)
      : fallback.value
  })

  function setTab(tab: string) {
    if (tab === activeTab.value || !(allowed.value as readonly string[]).includes(tab)) return
    void router.replace({ query: { ...route.query, tab } })
  }

  return { activeTab, setTab }
}
