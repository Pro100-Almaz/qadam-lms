import api from './client'
import { type ListResponse, unwrapList } from './client'
import type {
  Quarter,
  TeachingAssignment,
  TeachingAssignmentListItem,
  TeachingAssignmentRole,
} from '@/types/teachingAssignment'

export async function getTeachingAssignmentsApi(params?: {
  academic_year?: number
  class_group?: number
  subject?: number
  teacher?: number
  quarter?: Quarter
}) {
  const { data } = await api.get<ListResponse<TeachingAssignmentListItem>>('/teaching-assignments/', {
    params,
  })
  return { data: unwrapList(data) }
}

export interface TeachingAssignmentWriteRequest {
  offering?: number
  teacher?: number
  role?: TeachingAssignmentRole
  quarter?: Quarter | null
}

export function createTeachingAssignmentApi(
  data: Required<TeachingAssignmentWriteRequest>,
) {
  return api.post<TeachingAssignment>('/teaching-assignments/', data)
}

export function updateTeachingAssignmentApi(id: number, data: TeachingAssignmentWriteRequest) {
  return api.patch<TeachingAssignment>(`/teaching-assignments/${id}/`, data)
}
