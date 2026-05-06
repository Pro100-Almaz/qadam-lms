import api from './client'
import { type ListResponse, unwrapList } from './client'
import type { AcademicYear, ClassGroup } from '@/types/academic'

export async function getAcademicYearsApi() {
  const { data } = await api.get<ListResponse<AcademicYear>>('/academic-years/')
  return { data: unwrapList(data) }
}

export async function getClassGroupsApi(params?: { year?: number }) {
  const { data } = await api.get<ListResponse<ClassGroup>>('/class-groups/', { params })
  return { data: unwrapList(data) }
}
