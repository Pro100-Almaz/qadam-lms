import { getAllStudentsApi } from '@/api/students'
import type { AnalyticsStudent } from '@/api/analytics'
import type { Student } from '@/types/student'

/**
 * A class's students, for grids that must name everyone — including the ones
 * with no mark yet, whom a grade list never mentions.
 *
 * Cached per class group for a few minutes: the grading page stacks one table
 * per subject, and Math 7A and Physics 7A share one roster. Short-lived, so a
 * student who joins a class shows up without a full reload. A failed request
 * is dropped from the cache so the next table retries it.
 */
const TTL_MS = 5 * 60 * 1000
const cache = new Map<number, { at: number; roster: Promise<AnalyticsStudent[]> }>()

function toRosterStudent(student: Student): AnalyticsStudent {
  const { first_name: first, last_name: last, username } = student.user
  return {
    // Profile id — the id grades, quarter grades and the roster share.
    id: student.id,
    full_name: `${last} ${first}`.trim() || username,
    short_name: first && last ? `${first[0]}. ${last}` : `${last}${first}` || username,
  }
}

/** Last name, then first: the order the grade endpoints list students in. */
function compareStudents(a: Student, b: Student): number {
  return (
    a.user.last_name.localeCompare(b.user.last_name) ||
    a.user.first_name.localeCompare(b.user.first_name) ||
    a.id - b.id
  )
}

async function fetchRoster(classGroupId: number): Promise<AnalyticsStudent[]> {
  const { data } = await getAllStudentsApi({ class_group: classGroupId })
  return [...data].sort(compareStudents).map(toRosterStudent)
}

export function useClassRoster() {
  function get(classGroupId: number): Promise<AnalyticsStudent[]> {
    const cached = cache.get(classGroupId)
    if (cached && Date.now() - cached.at < TTL_MS) return cached.roster

    const entry = { at: Date.now(), roster: fetchRoster(classGroupId) }
    entry.roster.catch(() => {
      if (cache.get(classGroupId) === entry) cache.delete(classGroupId)
    })
    cache.set(classGroupId, entry)
    return entry.roster
  }

  return { get }
}
