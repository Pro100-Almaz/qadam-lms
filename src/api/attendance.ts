import api from './client'
import { type ListResponse, unwrapList } from './client'

export type AttendanceStatus = 'present' | 'absent'

/** One student's attendance for one scheduled lesson on one date. */
export interface AttendanceRecord {
  id: number
  session: number
  schedule_id: number
  subject_name: string
  /** Student profile PK — not `user.id`. */
  student: number
  student_user_id: number
  student_name: string
  /** `YYYY-MM-DD`. */
  date: string
  status: AttendanceStatus
  created_at: string
}

export interface SessionAttendanceFilters {
  date?: string
  date_from?: string
  date_to?: string
  student?: number
  status?: AttendanceStatus
  page?: number
  page_size?: number
}

export interface StudentAttendanceFilters {
  date_from?: string
  date_to?: string
  offering?: number
  quarter?: number
  status?: AttendanceStatus
  page?: number
  page_size?: number
}

// ─── Session-scoped ───────────────────────────────────────────────────────────

/** Everyone's attendance for one scheduled lesson. Newest date first. */
export async function getSessionAttendanceApi(
  sessionId: number,
  params?: SessionAttendanceFilters,
) {
  const { data } = await api.get<ListResponse<AttendanceRecord>>(
    `/schedule-sessions/${sessionId}/attendance/`,
    { params },
  )
  return { data: unwrapList(data) }
}

export function createSessionAttendanceApi(
  sessionId: number,
  data: { student: number; date: string; status: AttendanceStatus },
) {
  return api.post<AttendanceRecord>(`/schedule-sessions/${sessionId}/attendance/`, data)
}

// ─── Single record ────────────────────────────────────────────────────────────

export function getAttendanceRecordApi(id: number) {
  return api.get<AttendanceRecord>(`/attendance/${id}/`)
}

export function updateAttendanceRecordApi(id: number, data: { status: AttendanceStatus }) {
  return api.patch<AttendanceRecord>(`/attendance/${id}/`, data)
}

export function deleteAttendanceRecordApi(id: number) {
  return api.delete<void>(`/attendance/${id}/`)
}

// ─── Student-scoped ───────────────────────────────────────────────────────────

/** One student's history across every subject — `subject_name` tells the rows apart. */
export async function getStudentAttendanceApi(
  studentId: number,
  params?: StudentAttendanceFilters,
) {
  const { data } = await api.get<ListResponse<AttendanceRecord>>(
    `/students/${studentId}/attendance/`,
    { params },
  )
  return { data: unwrapList(data) }
}
