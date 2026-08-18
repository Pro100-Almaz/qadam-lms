import api, { unwrapList, type ListResponse } from './client'
import { type PaginatedResponse } from './client'
import type { Student, StudentDetail, UpdateStudentRequest, CreatePsychologicalStateRequest, PsychologicalState, PsychologicalStateTemplate } from '@/types/student'

/**
 * Returns the first page only — pass `page_size` when the caller needs a whole
 * class in one shot (a grading sheet that silently drops students is worse than
 * a big request).
 */
export async function getStudentsApi(params?: {
  year?: number
  class_group?: number
  page_size?: number
}) {
  const { data } = await api.get<PaginatedResponse<Student>>('/students/', { params })
  return { data: data.results, total: data.count }
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
  const { data } = await api.get<ListResponse<PsychologicalStateTemplate>>('/psychological-state-templates/')
  return { data: unwrapList(data) }
}
