import api from './client'
import { type ListResponse, unwrapList } from './client'
import type { TeachingAssignment } from '@/types/teachingAssignment'

export async function getTeachingAssignmentsApi(params?: {
  academic_year?: number
  class_group?: number
  subject?: number
  teacher?: number
}) {
  const { data } = await api.get<ListResponse<TeachingAssignment>>('/teaching-assignments/', {
    params,
  })
  return { data: unwrapList(data) }
}
