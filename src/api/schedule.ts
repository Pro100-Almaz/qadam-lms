import api from './client'
import { type ListResponse, unwrapList } from './client'

export type ApiWeekday = 0 | 1 | 2 | 3 | 4

/**
 * A schedule either belongs to a subject offering (`subject`) or stands on its
 * own (`other`) — a club, a lunch break, an assembly. Free entries carry a
 * `description` instead of an offering, but they belong to one class group all
 * the same: a break is drawn on that class's week only, and is placed by an
 * admin or by the class group's homeroom teacher.
 */
export type ScheduleType = 'subject' | 'other'

/** `"09:00:00"` — the backend always answers seconds, but accepts `"09:00"`. */
export type ApiTime = string

/** One lesson of a weekly schedule, placed by weekday and time range. */
export interface ScheduleSession {
  id: number
  schedule: number
  weekday: ApiWeekday
  time_start: ApiTime
  time_end: ApiTime
}

/**
 * A session of one of the *same class group's* other schedules. The list is
 * symmetric and scoped to the class group: a subject sees the breaks around it
 * and a break sees the subjects, all on the one timetable.
 */
export interface ForeignScheduleSession extends ScheduleSession {
  /** `null` for a free entry — a break or a club has no offering. */
  offering_id: number | null
  /** The subject, or the free entry's description. */
  subject_name: string
}

export interface ScheduleOffering {
  id: number
  subject_name: string
  class_group_name: string
  academic_year_label: string
}

/** The class group a schedule is drawn on — free entries carry one too. */
export interface ScheduleClassGroup {
  id: number
  name: string
  grade_level: number
  letter: string
  academic_year_label: string
}

export interface SubjectSchedule {
  id: number
  type: ScheduleType
  /** The subject name, or the description when there is no offering. */
  title: string
  /** `null` on a free entry. */
  offering: ScheduleOffering | null
  offering_id: number | null
  /** Always set — on a subject schedule it is the offering's class group. */
  class_group: ScheduleClassGroup
  class_group_id: number
  /** Required when the schedule has no offering. */
  description: string | null
  quarter: number
  sessions: ScheduleSession[]
  other_sessions?: ForeignScheduleSession[]
}

export interface SubjectScheduleFilters {
  offering?: number
  quarter?: number
  /**
   * Filters the schedule's own class group, so it answers with that class
   * group's whole timetable — taught subjects and free entries alike.
   */
  class_group?: number
  subject?: number
  /** Routes through the class group's academic year, free entries included. */
  academic_year?: number
  type?: ScheduleType
  page?: number
  page_size?: number
}

/**
 * `offering` and `description` are alternatives — one of the two is required.
 *
 * `class_group` is required on every create, not only on free entries: the API
 * is documented as deriving it from `offering.class_group`, but a POST without
 * it answers 400 `{"class_group": ["Обязательное поле."]}` either way. Sent
 * alongside an offering it has to be that offering's class group.
 */
export interface SubjectSchedulePayload {
  offering?: number
  class_group: number
  description?: string
  quarter: number
}

export interface ScheduleSessionPayload {
  weekday: ApiWeekday
  time_start: ApiTime
  time_end: ApiTime
}

// ─── Subject schedules ────────────────────────────────────────────────────────

export async function getSubjectSchedulesApi(params?: SubjectScheduleFilters) {
  const { data } = await api.get<ListResponse<SubjectSchedule>>('/subject-schedules/', { params })
  return { data: unwrapList(data) }
}

export function getSubjectScheduleApi(id: number) {
  return api.get<SubjectSchedule>(`/subject-schedules/${id}/`)
}

/**
 * 400 with `non_field_errors` if the offering already has a schedule that
 * quarter, with `description` if an offering-less schedule was sent without
 * one, with `class_group` if it is missing or is not the offering's. Free
 * entries (no `offering`) may only be placed by an admin or the class group's
 * homeroom teacher — otherwise 403.
 */
export function createSubjectScheduleApi(data: SubjectSchedulePayload) {
  return api.post<SubjectSchedule>('/subject-schedules/', data)
}

/** Moving a free entry with `class_group` needs rights on the *target* class. */
export function updateSubjectScheduleApi(id: number, data: Partial<SubjectSchedulePayload>) {
  return api.patch<SubjectSchedule>(`/subject-schedules/${id}/`, data)
}

/** Cascades to the schedule's sessions and their attendance. */
export function deleteSubjectScheduleApi(id: number) {
  return api.delete<void>(`/subject-schedules/${id}/`)
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

/** Plain list, not paginated — ordered by weekday, then time_start, time_end. */
export function getScheduleSessionsApi(scheduleId: number) {
  return api.get<ScheduleSession[]>(`/subject-schedules/${scheduleId}/sessions/`)
}

/**
 * 400 with `time_end` if the range is inverted, or with `non_field_errors` if
 * it overlaps another session of the same schedule on that weekday.
 */
export function createScheduleSessionApi(scheduleId: number, data: ScheduleSessionPayload) {
  return api.post<ScheduleSession>(`/subject-schedules/${scheduleId}/sessions/`, data)
}

/** Partial — a lone `time_end` is re-validated against the stored start/weekday. */
export function updateScheduleSessionApi(
  sessionId: number,
  data: Partial<ScheduleSessionPayload>,
) {
  return api.patch<ScheduleSession>(`/schedule-sessions/${sessionId}/`, data)
}

/** Cascades to that session's attendance. */
export function deleteScheduleSessionApi(sessionId: number) {
  return api.delete<void>(`/schedule-sessions/${sessionId}/`)
}

// ─── Weekday conversion ───────────────────────────────────────────────────────

/** UI weekday (1 = Monday) → API weekday (0 = Monday). */
export function toApiWeekday(weekday: number): ApiWeekday {
  return (weekday - 1) as ApiWeekday
}

/** API weekday (0 = Monday) → UI weekday (1 = Monday). */
export function fromApiWeekday(weekday: ApiWeekday): number {
  return weekday + 1
}

// ─── Time conversion ──────────────────────────────────────────────────────────
//
// The grid positions lessons by pixel offset, so times travel through the UI as
// minutes past midnight and only become `"HH:MM"` again on the way to the API.

/** `"09:45:00"` / `"09:45"` → `585`. `NaN`-free: an unparseable time reads 0. */
export function timeToMinutes(time: ApiTime): number {
  const [hours, minutes] = time.split(':')
  return (Number(hours) || 0) * 60 + (Number(minutes) || 0)
}

/** `585` → `"09:45"`, which is what the API accepts on write. */
export function minutesToTime(minutes: number): ApiTime {
  const clamped = Math.max(0, Math.min(24 * 60 - 1, Math.round(minutes)))
  const hours = Math.floor(clamped / 60)
  return `${String(hours).padStart(2, '0')}:${String(clamped % 60).padStart(2, '0')}`
}

/** `"09:45:00"` → `"09:45"` — seconds are noise on a timetable. */
export function formatTimeLabel(time: ApiTime): string {
  return time.slice(0, 5)
}

/** `"09:00:00"–"09:45:00"` → `"09:00 – 09:45"`. */
export function formatTimeRange(start: ApiTime, end: ApiTime): string {
  return `${formatTimeLabel(start)} – ${formatTimeLabel(end)}`
}
