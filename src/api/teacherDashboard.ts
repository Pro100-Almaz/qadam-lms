import api from './client'
import type {
  TeacherDashboardResponse,
  HomeroomTeacherDashboard,
  PsychologistDashboard,
  PsychStudentDetail,
  TeacherWorkload,
  TeacherClassGroup,
  ClassStudentsResponse,
} from '@/types/teacherDashboard'

export function getTeacherDashboardApi() {
  return api.get<TeacherDashboardResponse>('/teacher/dashboard/')
}

export function getHomeroomClassApi() {
  return api.get<HomeroomTeacherDashboard>('/teacher/my-class/')
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
