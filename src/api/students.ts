import api, { unwrapList, type ListResponse } from './client'
import { type PaginatedResponse } from './client'
import type { Student, StudentDetail, UpdateStudentRequest, CreatePsychologicalStateRequest, PsychologicalState, PsychologicalStateTemplate } from '@/types/student'

export interface StudentListFilters {
  year?: number
  class_group?: number
  page?: number
  page_size?: number
}

/**
 * One page. Returns the first unless `page` says otherwise — pass `page_size`
 * when the caller needs a whole class in one shot (a grading sheet that
 * silently drops students is worse than a big request).
 */
export async function getStudentsApi(params?: StudentListFilters) {
  const { data } = await api.get<PaginatedResponse<Student>>('/students/', { params })
  return { data: data.results, total: data.count }
}

/** What one round trip asks for; the server may cap it lower, which is fine. */
const ALL_STUDENTS_PAGE_SIZE = 200

/**
 * Every student matching the filters, not just the first page. The list view
 * searches and paginates in the browser, so a partial answer would hide
 * students behind a search box that can never reach them.
 */
export async function getAllStudentsApi(
  params?: Omit<StudentListFilters, 'page' | 'page_size'>,
) {
  const { data: first } = await api.get<PaginatedResponse<Student>>('/students/', {
    params: { ...params, page: 1, page_size: ALL_STUDENTS_PAGE_SIZE },
  })

  // Measured, not assumed: a server-side `max_page_size` below ours would
  // otherwise make the page count too small and drop the tail again.
  const pageSize = first.results.length || ALL_STUDENTS_PAGE_SIZE
  const pageCount = Math.ceil(first.count / pageSize)
  if (pageCount <= 1) return { data: first.results, total: first.count }

  const rest = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) =>
      api.get<PaginatedResponse<Student>>('/students/', {
        params: { ...params, page: index + 2, page_size: pageSize },
      }),
    ),
  )
  return {
    data: [...first.results, ...rest.flatMap(response => response.data.results)],
    total: first.count,
  }
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
