import { ref } from 'vue'
import { getAcademicYearsApi } from '@/api/academic'
import { useAuthStore } from '@/stores/auth'

/**
 * Which quarter a screen should offer first.
 *
 * The authority is the active academic year's `current_quarter`, but
 * `/academic-years/` is staff-scoped — asking for it as a student or parent
 * earns a 403 and, through the client's interceptor, a spurious "Access denied"
 * toast. So only staff fetch it; everyone else starts from the calendar, which
 * is right except in the few days around a quarter boundary and is only ever a
 * default the reader can change.
 */

/** Answered once per page load — the current quarter does not move mid-session. */
let cachedQuarter: number | null = null
let inFlight: Promise<number | null> | null = null

/**
 * The quarter the calendar suggests, on the standard 4-quarter school year:
 * Q1 September–October, Q2 November–December, Q3 January–March, Q4 April–May.
 * Over the summer the year that just ended is the one with marks in it, so the
 * guess stays on Q4.
 */
export function quarterFromDate(date: Date = new Date()): number {
  const month = date.getMonth() + 1
  if (month >= 9 && month <= 10) return 1
  if (month >= 11) return 2
  if (month <= 3) return 3
  return 4
}

export function useCurrentQuarter() {
  const auth = useAuthStore()
  const quarter = ref(cachedQuarter ?? quarterFromDate())

  async function load(): Promise<void> {
    if (cachedQuarter) {
      quarter.value = cachedQuarter
      return
    }
    if (!auth.isStaff) return

    inFlight ??= getAcademicYearsApi()
      .then(({ data }) => data.find(year => year.is_active)?.current_quarter ?? null)
      .catch(() => null)
      .finally(() => {
        inFlight = null
      })

    const resolved = await inFlight
    if (resolved && resolved >= 1 && resolved <= 4) {
      cachedQuarter = resolved
      quarter.value = resolved
    }
  }

  return { quarter, load }
}
