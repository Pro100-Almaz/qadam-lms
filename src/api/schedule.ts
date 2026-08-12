import api from './client'
import { type ListResponse, unwrapList } from './client'

export type ApiWeekday = 0 | 1 | 2 | 3 | 4

/** One lesson slot of a subject's weekly schedule. */
export interface ScheduleSession {
  id: number
  schedule: number
  order: number
  weekday: ApiWeekday
}

export interface ForeignScheduleSession extends ScheduleSession {
  offering_id: number
  subject_name: string
}

export interface ScheduleOffering {
  id: number
  subject_name: string
  class_group_name: string
  academic_year_label: string
}

export interface SubjectSchedule {
  id: number
  offering: ScheduleOffering
  offering_id: number
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
  page?: number
  page_size?: number
}

// ─── Subject schedules ────────────────────────────────────────────────────────

export async function getSubjectSchedulesApi(params?: SubjectScheduleFilters) {
  const { data } = await api.get<ListResponse<SubjectSchedule>>('/subject-schedules/', { params })
  return { data: unwrapList(data) }
}

export function getSubjectScheduleApi(id: number) {
  return api.get<SubjectSchedule>(`/subject-schedules/${id}/`)
}

/** 400 with `non_field_errors` if the offering already has a schedule that quarter. */
export function createSubjectScheduleApi(data: { offering: number; quarter: number }) {
  return api.post<SubjectSchedule>('/subject-schedules/', data)
}

export function updateSubjectScheduleApi(
  id: number,
  data: Partial<{ offering: number; quarter: number }>,
) {
  return api.patch<SubjectSchedule>(`/subject-schedules/${id}/`, data)
}

/** Cascades to the schedule's sessions and their attendance. */
export function deleteSubjectScheduleApi(id: number) {
  return api.delete<void>(`/subject-schedules/${id}/`)
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

/** Plain list, not paginated — ordered by weekday then order. */
export function getScheduleSessionsApi(scheduleId: number) {
  return api.get<ScheduleSession[]>(`/subject-schedules/${scheduleId}/sessions/`)
}

/** 400 with `non_field_errors` if that weekday/order slot is already taken. */
export function createScheduleSessionApi(
  scheduleId: number,
  data: { order: number; weekday: ApiWeekday },
) {
  return api.post<ScheduleSession>(`/subject-schedules/${scheduleId}/sessions/`, data)
}

export function updateScheduleSessionApi(
  sessionId: number,
  data: Partial<{ order: number; weekday: ApiWeekday }>,
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
