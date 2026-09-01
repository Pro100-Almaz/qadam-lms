import api from './client'
import { type ListResponse, unwrapList } from './client'

export type ApiWeekday = 0 | 1 | 2 | 3 | 4

/**
 * A schedule either belongs to a subject offering (`subject`) or stands on its
 * own (`other`) — a club, a lunch break, an assembly. Free entries carry a
 * `description` instead of an offering, and only admins may create them.
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

/** A session of one of the class group's *other* schedules. */
export interface ForeignScheduleSession extends ScheduleSession {
  /** `null` for a free entry — a break or a club has no offering. */
  offering_id: number | null
  /** The subject, or the free entry's description. */
  subject_name: string
}

export interface ScheduleOffering {
  id: number
  subject: string
  class_group: string
  academic_year: string
}

export interface SubjectSchedule {
  id: number
  type: ScheduleType
  /** The subject name, or the description when there is no offering. */
  title: string
  /** `null` on a free entry. */
  offering: ScheduleOffering | null
  offering_id: number | null
  /** Required when the schedule has no offering. */
  description: string | null
  quarter: number
  sessions: ScheduleSession[]
  other_sessions?: ForeignScheduleSession[]
}

export interface SubjectScheduleFilters {
  offering?: number
  quarter?: number
  class_group?: number
  subject?: number
  academic_year?: number
  type?: ScheduleType
  page?: number
  page_size?: number
}

/** `offering` and `description` are alternatives — one of the two is required. */
export interface SubjectSchedulePayload {
  offering?: number
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
 * quarter, or with `description` if an offering-less schedule was sent without
 * one. Free entries (no `offering`) are admin-only — otherwise 403.
 */
export function createSubjectScheduleApi(data: SubjectSchedulePayload) {
  return api.post<SubjectSchedule>('/subject-schedules/', data)
}

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
