import { ref } from 'vue'
import { getMySubjectsApi, getSubjectsApi } from '@/api/subjects'
import type { Subject } from '@/types/subject'

export interface SubjectNameOption {
  id: number
  name: string
}

/**
 * Resolves the named subjects against `subjects`, keeping the order given.
 *
 * The teacher dashboards carry a subject's name and its offering id but never
 * its subject id, while the grade report endpoint filters on the subject id —
 * so the name is the only join between the two. A name with no match is
 * dropped rather than guessed at: a wrong subject id returns a 400, or another
 * class's marks. A name shared by several subjects (the same course in two
 * language groups) resolves to each of them, kept separate so the reader picks.
 */
export function matchSubjectNames(
  subjects: Pick<Subject, 'id' | 'name'>[],
  names: string[],
): SubjectNameOption[] {
  const idsByName = new Map<string, number[]>()
  subjects.forEach(subject => {
    // Names differ only in case or padding between screens; ids never do.
    const key = subject.name.trim().toLowerCase()
    const existing = idsByName.get(key)
    if (existing) existing.push(subject.id)
    else idsByName.set(key, [subject.id])
  })

  const seen = new Set<number>()
  const options: SubjectNameOption[] = []
  names.forEach(name => {
    idsByName.get(name.trim().toLowerCase())?.forEach(id => {
      if (seen.has(id)) return
      seen.add(id)
      options.push({ id, name })
    })
  })
  return options.sort((a, b) => a.name.localeCompare(b.name))
}

// Shared across instances: the teacher dashboard mounts several screens that
// each need the list, and it is the same school-wide answer for all of them.
// Only the subjects' names and ids are held, so nothing here is caller-specific.
const subjects = ref<Subject[]>([])
const loading = ref(false)
let inFlight: Promise<void> | null = null

async function fetchSubjects(): Promise<void> {
  loading.value = true
  try {
    // Well past any real school's subject count — the list is paginated and a
    // missing subject would silently drop it from the picker.
    const { data } = await getSubjectsApi({ status: 'active', page_size: 200 })
    subjects.value = data
  } catch {
    try {
      const { data } = await getMySubjectsApi({ status: 'active' })
      subjects.value = data
    } catch {
      subjects.value = []
    }
  } finally {
    loading.value = false
  }
}

/**
 * The subject list to resolve names against, fetched once per screen.
 *
 * Reading the school-wide list matters for a homeroom teacher, whose class is
 * taught subjects they do not teach themselves and may still report on;
 * `/my-subjects/` is the fallback for a teacher that list is closed to.
 */
export function useSubjectNameLookup() {
  async function load(): Promise<void> {
    if (subjects.value.length) return
    inFlight ??= fetchSubjects().finally(() => {
      inFlight = null
    })
    await inFlight
  }

  /** Reads `subjects` on every call, so a caller's `computed()` tracks the load. */
  function toOptions(names: string[]): SubjectNameOption[] {
    return matchSubjectNames(subjects.value, names)
  }

  return { subjects, loading, load, toOptions }
}
