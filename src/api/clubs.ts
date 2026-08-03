import api, { type PaginatedResponse } from './client'

export type ClubWeekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export interface ClubAcademicYear {
  id: number
  year: string
}

export interface ClubScheduleItem {
  id: number
  weekday: ClubWeekday
  start_time: string
  end_time: string
  location: string
}

export interface ClubAttachment {
  id: number
  name: string
  url: string
}

export interface UploadClubAttachmentsResponse {
  attachments: ClubAttachment[]
}

export interface ClubMember {
  id: number
  first_name: string
  last_name: string
  full_name: string
  class_name: string
  avatar: string | null
}

export type ClubStatus = 'pending' | 'active' | 'deleted' | 'finished'

export interface ClubListItem {
  id: number
  club_name: string
  academic_year: ClubAcademicYear
  start_date: string
  end_date: string
  plan: string
  criteria: string
  status: ClubStatus
  member_count: number
  sessions_per_week: number
  attendance_dates_count: number
  schedule: ClubScheduleItem[]
  attachments: ClubAttachment[]
}

export interface ClubDetail extends ClubListItem {
  members: ClubMember[]
}

export interface StudentClub {
  id: number
  student: {
    id: number
    full_name: string
  }
  academic_year: string
  start_date: string
  end_date: string
  club_name: string
  total_session_count: number
  present_count: number
  late_count: number
  absent_count: number
  created_at: string
}

export interface StudentClubDetail extends StudentClub {
  status: ClubStatus
  plan: string
  criteria: string
  schedule: ClubScheduleItem[]
}

export interface StudentClubAttendanceRecord {
  attendance_id: number | null
  session_id: number
  date: string
  weekday: ClubWeekday
  start_time: string
  end_time: string
  location: string
  status: ClubAttendanceStatus | null
}

export interface StudentClubAttendanceParams {
  date_from: string
  date_to: string
  page?: number
  page_size?: number
}

export interface ClubListParams {
  search?: string
  academic_year?: number
  page?: number
  page_size?: number
}

export interface AvailableClubStudentsParams {
  club_id: number
  search?: string
  class_group?: number
  page?: number
  page_size?: number
}

export interface ClubStudentPage {
  count: number
  next?: string | null
  previous?: string | null
  results: ClubMember[]
}

export interface ReplaceClubMembersRequest {
  student_ids: number[]
}

export interface ReplaceClubMembersResponse {
  club_id: number
  member_count: number
  members: ClubMember[]
}

export interface RemoveClubMemberResponse {
  detail: string
  club_id: number
  student_id: number
  member_count: number
}

export type ClubAttendanceStatus = 'present' | 'absent' | 'late'

export interface ClubAttendanceHistoryItem {
  club_id: number
  session_id: number
  date: string
  total_students: number
  present_count: number
  absent_count: number
  late_count: number
  unmarked_count: number
  weekday: ClubWeekday
  start_time: string
  end_time: string
  location: string
}

export interface ClubAttendanceHistoryParams {
  date_from?: string
  date_to?: string
  page?: number
  page_size?: number
}

export interface ClubAttendanceHistoryResponse {
  count: number
  next?: string | null
  previous?: string | null
  results: ClubAttendanceHistoryItem[]
}

export interface ClubAttendanceRecord {
  attendance_id: number | null
  student_id: number
  full_name: string
  class_name: string
  status: ClubAttendanceStatus | null
}

export interface ClubSessionAttendance {
  club_id: number
  session_id: number
  date: string
  total_students: number
  present_count: number
  absent_count: number
  late_count: number
  unmarked_count: number
  records: ClubAttendanceRecord[]
}

export interface ReplaceClubAttendanceRequest {
  records: Array<{
    attendance_id: number | null
    student_id: number
    status: ClubAttendanceStatus
  }>
}

export interface CreateClubScheduleRequest {
  weekday: ClubWeekday
  start_time: string
  end_time: string
  location: string
}

export interface UpdateClubScheduleRequest extends CreateClubScheduleRequest {
  id?: number
}

export interface CreateClubRequest {
  club_name: string
  academic_year_id: number
  start_date: string
  end_date: string
  plan: string
  criteria: string
  schedule: CreateClubScheduleRequest[]
}

export interface ReplaceClubRequest {
  club_name: string
  academic_year_id: number
  start_date: string
  end_date: string
  plan: string
  criteria: string
  status: ClubStatus
  schedule: UpdateClubScheduleRequest[]
}

export type PartialUpdateClubRequest = Partial<ReplaceClubRequest>

export function getClubsApi(params: ClubListParams) {
  return api.get<PaginatedResponse<ClubListItem>>('/clubs/', { params })
}

export function createClubApi(data: CreateClubRequest) {
  return api.post<ClubListItem>('/clubs/', data)
}

export function getClubApi(id: number | string) {
  return api.get<ClubDetail>(`/clubs/${id}/`)
}

export function getStudentClubsApi(studentId: number | string, params?: { page?: number; page_size?: number }) {
  return api.get<PaginatedResponse<StudentClub>>(`/students/${studentId}/clubs/`, { params })
}

export function getStudentClubApi(studentId: number | string, clubId: number | string) {
  return api.get<StudentClubDetail>(`/students/${studentId}/clubs/${clubId}/`)
}

export function getStudentClubAttendanceApi(
  studentId: number | string,
  clubId: number | string,
  params: StudentClubAttendanceParams,
) {
  return api.get<PaginatedResponse<StudentClubAttendanceRecord>>(
    `/students/${studentId}/clubs/${clubId}/attendance/`,
    { params },
  )
}

export function replaceClubApi(id: number | string, data: ReplaceClubRequest) {
  return api.put<ClubDetail>(`/clubs/${id}/`, data)
}

export function updateClubApi(id: number | string, data: PartialUpdateClubRequest) {
  return api.patch<ClubDetail>(`/clubs/${id}/`, data)
}

export function deleteClubApi(id: number | string) {
  return api.delete<void>(`/clubs/${id}/`)
}

export function getAvailableClubStudentsApi(params: AvailableClubStudentsParams) {
  return api.get<ClubStudentPage>('/clubs/available-students/', { params })
}

export function getClubMembersApi(id: number | string) {
  return api.get<ClubStudentPage>(`/clubs/${id}/members/`)
}

export function replaceClubMembersApi(id: number | string, data: ReplaceClubMembersRequest) {
  return api.put<ReplaceClubMembersResponse>(`/clubs/${id}/members/`, data)
}

export function removeClubMemberApi(clubId: number | string, studentId: number) {
  return api.delete<RemoveClubMemberResponse>(`/clubs/${clubId}/members/${studentId}/`)
}

export function getClubAttendanceHistoryApi(id: number | string, params?: ClubAttendanceHistoryParams) {
  return api.get<ClubAttendanceHistoryResponse>(`/clubs/${id}/attendance/`, { params })
}

export function getClubSessionAttendanceApi(clubId: number | string, date: string, sessionId: number) {
  return api.get<ClubSessionAttendance>(`/clubs/${clubId}/attendance/${date}/sessions/${sessionId}/`)
}

export function replaceClubSessionAttendanceApi(clubId: number | string, date: string, sessionId: number, data: ReplaceClubAttendanceRequest) {
  return api.put<ClubSessionAttendance>(`/clubs/${clubId}/attendance/${date}/sessions/${sessionId}/`, data)
}

export function uploadClubAttachmentsApi(clubId: number | string, files: File[]) {
  const formData = new FormData()
  files.forEach(file => formData.append('files', file))
  return api.post<UploadClubAttachmentsResponse>(`/clubs/${clubId}/attachments/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function deleteClubAttachmentApi(clubId: number | string, attachmentId: number) {
  return api.delete<void>(`/clubs/${clubId}/attachments/${attachmentId}/`)
}
