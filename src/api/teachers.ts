import api from './client'
import type { Teacher, TeacherDetail, UpdateTeacherRequest } from '@/types/teacher'

interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export async function getTeachersApi() {
  const { data } = await api.get<PaginatedResponse<Teacher>>('/teachers/')
  return { data: data.results }
}

export function getTeacherDetailApi(userId: number) {
  return api.get<TeacherDetail>(`/teachers/${userId}/`)
}

export function updateTeacherApi(teacherPk: number, data: UpdateTeacherRequest) {
  return api.patch<Teacher>(`/teachers/${teacherPk}/update/`, data)
}

export async function getParentTeachersApi() {
  const { data } = await api.get<PaginatedResponse<Teacher>>('/parent/teachers/')
  return { data: data.results }
}
