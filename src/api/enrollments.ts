import api from './client'
import { type PaginatedResponse } from './client'

export interface Enrollment {
  id: number
  student: number
  class_group: {
    id: number
    letter: string
    grade_level: { id: number; number: number }
    academic_year: { id: number; year: string; is_active: boolean; archived: boolean }
    display_name: string
  }
  academic_year: { id: number; year: string; is_active: boolean; archived: boolean }
  status: string
  start_date: string
  end_date: string | null
}

export async function getEnrollmentsApi(params?: { year?: number; class_group?: number; student?: number }) {
  const { data } = await api.get<PaginatedResponse<Enrollment>>('/enrollments/', { params })
  return { data: data.results }
}
