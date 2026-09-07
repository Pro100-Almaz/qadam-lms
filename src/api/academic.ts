import api from './client'
import { type ListResponse, unwrapList } from './client'
import type { AcademicYear, ClassGroup, ClassGroupCategory } from '@/types/academic'

export async function getAcademicYearsApi() {
  const { data } = await api.get<ListResponse<AcademicYear>>('/academic-years/')
  return { data: unwrapList(data) }
}

/**
 * The real classes — `category=major` by default, so the subgroups a class is
 * split into for a subject stay out of every class picker. Pass `category`
 * explicitly to widen it.
 */
export async function getClassGroupsApi(params?: { year?: number; category?: ClassGroupCategory }) {
  const { data } = await api.get<ListResponse<ClassGroup>>('/class-groups/', {
    params: { category: 'major', ...params },
  })
  return { data: unwrapList(data) }
}

/**
 * The subgroups a class group's students are split into. Plain array, not
 * paginated, ordered by grade level then name. `[]` when the class has no split
 * — including when the id passed is itself a minor group; 404 if it does not
 * exist.
 */
export async function getClassGroupMinorGroupsApi(classGroupId: number) {
  const { data } = await api.get<ClassGroup[]>(`/class-groups/${classGroupId}/minor-groups/`)
  return { data }
}
