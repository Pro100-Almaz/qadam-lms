import api from './client'
import type { AcademicYear, ClassGroup } from '@/types/academic'

interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export async function getAcademicYearsApi() {
  const { data } = await api.get<PaginatedResponse<AcademicYear>>('/academic-years/')
  return { data: data.results }
}

export async function getClassGroupsApi(params?: { year?: number }) {
  const { data } = await api.get<PaginatedResponse<ClassGroup>>('/class-groups/', { params })
  return { data: data.results }
}
