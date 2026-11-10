import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { quarterFromDate, useCurrentQuarter } from '@/composables/useCurrentQuarter'
import { useAuthStore } from '@/stores/auth'

const QUARTER_STORAGE_KEY = 'qadam-lms.quarter'

interface StoredQuarter {
  quarter: number
  picked: boolean
}

function isQuarter(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 4
}

/**
 * The quarter every quarter picker shows, so a pick on one page is still there
 * on the next.
 *
 * It lives in sessionStorage: it survives reloads within the tab, but a new tab
 * or a new sign-in starts again from the year's own current quarter rather than
 * whatever was last looked at.
 */
export const useQuarterStore = defineStore('quarter', () => {
  const auth = useAuthStore()
  const current = useCurrentQuarter()

  const stored = readStoredQuarter()
  const quarter = ref(stored?.quarter ?? quarterFromDate())
  /** Whether the reader chose `quarter`, rather than it being the default. */
  const picked = ref(stored?.picked ?? false)

  function readStoredQuarter(): StoredQuarter | null {
    try {
      const value = sessionStorage.getItem(QUARTER_STORAGE_KEY)
      if (!value) return null
      const parsed = JSON.parse(value) as Partial<StoredQuarter>
      return isQuarter(parsed.quarter) ? { quarter: parsed.quarter, picked: parsed.picked === true } : null
    } catch {
      return null
    }
  }

  function persist() {
    try {
      sessionStorage.setItem(QUARTER_STORAGE_KEY, JSON.stringify({ quarter: quarter.value, picked: picked.value }))
    } catch {
      // Storage unavailable — the pick still holds until the page reloads.
    }
  }

  /** Replaces the calendar's guess with the year's own answer, unless the reader has picked. */
  async function load(): Promise<void> {
    if (picked.value) return
    await current.load()
    if (!picked.value) quarter.value = current.quarter.value
  }

  function setQuarter(value: number | string | null | undefined) {
    const next = Number(value)
    if (!isQuarter(next)) return
    quarter.value = next
    picked.value = true
    persist()
  }

  /** For pages that read the active year themselves: a default, never a pick. */
  function adoptCurrent(value: number | null | undefined) {
    if (picked.value || !isQuarter(value)) return
    quarter.value = value
  }

  function reset() {
    quarter.value = quarterFromDate()
    picked.value = false
    try {
      sessionStorage.removeItem(QUARTER_STORAGE_KEY)
    } catch {
      // Storage unavailable — nothing to clear.
    }
  }

  // Signing out hands the tab to the next user; they start from the default.
  // Synchronous, because a forced logout navigates away straight after.
  watch(
    () => auth.user?.id,
    (next, previous) => {
      if (previous !== undefined && next !== previous) reset()
    },
    { flush: 'sync' },
  )

  return { quarter, picked, load, setQuarter, adoptCurrent, reset }
})
