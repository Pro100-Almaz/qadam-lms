import api from './client'
import type { Student, StudentDetail, UpdateStudentRequest, CreatePsychologicalStateRequest, PsychologicalState, PsychologicalStateTemplate } from '@/types/student'

interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export async function getStudentsApi(params?: { year?: number; class_group?: number }) {
  const { data } = await api.get<PaginatedResponse<Student>>('/students/', { params })
  return { data: data.results }
}

export function getStudentDetailApi(userId: number) {
  return api.get<StudentDetail>(`/students/${userId}/`)
}

export function updateStudentApi(studentPk: number, data: UpdateStudentRequest) {
  return api.patch<Student>(`/students/${studentPk}/update/`, data)
}

export function createPsychologicalStateApi(studentPk: number, data: CreatePsychologicalStateRequest) {
  return api.post<PsychologicalState>(`/students/${studentPk}/psychological-state/`, data)
}

export function deletePsychologicalStateApi(stateId: number) {
  return api.delete(`/psychological-states/${stateId}/`)
}

export async function getPsychologicalStateTemplatesApi() {
  const { data } = await api.get<PaginatedResponse<PsychologicalStateTemplate>>('/psychological-state-templates/')
  return { data: data.results }
}
