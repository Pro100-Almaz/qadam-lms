import api from './client'
import type {
  TeacherDashboardResponse,
  HomeroomClass,
  PsychologistDashboard,
  PsychStudentDetail,
  TeacherWorkload,
  TeacherClassGroup,
  ClassStudentsResponse,
  TeacherOfferingsParams,
  TeacherOfferingsResponse,
} from '@/types/teacherDashboard'

export function getTeacherDashboardApi() {
  return api.get<TeacherDashboardResponse>('/teacher/dashboard/')
}

/**
 * The caller's homeroom class. Homeroom teachers only: anyone else gets a 403,
 * admins included, and a 404 means no homeroom class this year.
 */
export function getHomeroomClassApi() {
  return api.get<HomeroomClass>('/homeroom/my-class/')
}

export function getPsychologistDashboardApi() {
  return api.get<PsychologistDashboard>('/teacher/psychologist/')
}

export function getPsychStudentDetailApi(studentId: number) {
  return api.get<PsychStudentDetail>(`/teacher/psychologist/students/${studentId}/`)
}

export function getTeacherWorkloadApi(params?: { teacher_id?: number; week_start?: string; week_end?: string }) {
  return api.get<TeacherWorkload>('/dashboard/teacher-workload/', { params })
}

export function getTeacherMyClassesApi() {
  return api.get<TeacherClassGroup[]>('/teacher/my-classes/')
}

export function getClassStudentsApi(classGroupId: number, allSubjects = false) {
  return api.get<ClassStudentsResponse>(`/teacher/my-classes/${classGroupId}/students/`, {
    params: allSubjects ? { all_subjects: true } : undefined,
  })
}

/**
 * The offerings the caller teaches — never their homeroom class's others. 403
 * for anyone without a teacher role, admins included.
 */
export function getTeacherOfferingsApi(params?: TeacherOfferingsParams) {
  return api.get<TeacherOfferingsResponse>('/teacher/offerings/', { params })
}
