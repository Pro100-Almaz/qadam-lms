import { parseIsoDate } from './attendanceWeeks'

/**
 * Date formatting shared by every grading surface, so an assignment's academic
 * day and a grade's recording timestamp always read the same wherever they are
 * shown side by side.
 */

/** Matches the language the app is rendered in; `ru` is the school's default. */
function localeTag(): string {
  return document.documentElement.lang || 'ru'
}

/**
 * An academic day, `YYYY-MM-DD` — `SubjectAssignment.date`. `parseIsoDate` keeps
 * the day local: `new Date('2026-08-20')` is UTC midnight and can render as the
 * 19th west of Greenwich.
 */
export function formatAcademicDate(value: string): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat(localeTag(), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parseIsoDate(value))
}

/**
 * The same academic day without the year, for places where the date is a label
 * rather than a fact to read — a gradebook column header, where every column
 * sits inside the range the reader already picked.
 */
export function formatAcademicDay(value: string): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat(localeTag(), {
    day: '2-digit',
    month: 'short',
  }).format(parseIsoDate(value))
}

/**
 * A `created_at` timestamp — when the row was actually typed in, which for a
 * grade is a different fact from the day the work was done. Shown to the minute
 * because marks entered on the same day are otherwise indistinguishable.
 */
export function formatRecordedAt(value: string): string {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'
  return new Intl.DateTimeFormat(localeTag(), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed)
}
