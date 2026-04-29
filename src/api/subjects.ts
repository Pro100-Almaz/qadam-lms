import api from './client'
import type { Subject, SubjectDetail, SubjectGrades, CreateSubjectRequest, StatusAction } from '@/types/subject'

interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export async function getSubjectsApi(params?: { status?: string; year?: number; lang?: string }) {
  const { data } = await api.get<PaginatedResponse<Subject>>('/subjects/', { params })
  return { data: data.results }
}

export function getSubjectDetailApi(id: number) {
  return api.get<SubjectDetail>(`/subjects/${id}/`)
}

export function getSubjectGradesApi(id: number, params?: { quarter?: number }) {
  return api.get<SubjectGrades>(`/subjects/${id}/grades/`, { params })
}

export function createSubjectApi(data: CreateSubjectRequest) {
  return api.post<Subject>('/subjects/new/', data)
}

export function changeSubjectStatusApi(id: number, action: StatusAction) {
  return api.post<Subject>(`/subjects/${id}/status/`, { action })
}

export function deleteSubjectApi(id: number) {
  return api.delete(`/subjects/${id}/delete/`)
}

export async function getMySubjectsApi(params?: { status?: string }) {
  const { data } = await api.get<PaginatedResponse<Subject>>('/my-subjects/', { params })
  return { data: data.results }
}
