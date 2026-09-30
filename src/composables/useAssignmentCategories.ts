import { ref } from 'vue'
import { currentIntlLocale } from '@/i18n'
import { getAssignmentCategoriesApi, type AssignmentCategoryOption } from '@/api/subjectAssignments'

// Shared across instances: the list is the same for every school and caller,
// so one fetch per language serves every form that needs it.
const categories = ref<AssignmentCategoryOption[]>([])
const loading = ref(false)
const error = ref(false)
let inFlight: Promise<void> | null = null
/**
 * The language the cached names are in. Names are localized server-side, so a
 * language switch makes the cache stale; `null` after a failure, so the next
 * open retries.
 */
let fetchedLocale: string | null = null

async function fetchCategories(locale: string): Promise<void> {
  loading.value = true
  error.value = false
  try {
    const { data } = await getAssignmentCategoriesApi()
    categories.value = data
    fetchedLocale = locale
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

/** The admin-managed assignment categories, named in the app's language. */
export function useAssignmentCategories() {
  async function load(): Promise<void> {
    const locale = currentIntlLocale()
    if (fetchedLocale === locale) return
    inFlight ??= fetchCategories(locale).finally(() => {
      inFlight = null
    })
    await inFlight
  }

  return { categories, loading, error, load }
}
