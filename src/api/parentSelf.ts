import api from './client'
import { type ListResponse, unwrapList } from './client'
import type { ParentChild, ParentTeacher } from '@/types/parentSelf'
import type { StudentDetail } from '@/types/student'

export async function getMyChildrenApi() {
  const { data } = await api.get<ListResponse<ParentChild>>('/parents/me/children/')
  return { data: unwrapList(data) }
}

export async function getMyChildDetailApi(studentPk: number) {
  const { data } = await api.get<StudentDetail>(`/parents/me/children/${studentPk}/`)
  return { data }
}

export async function getParentTeachersApi() {
  const { data } = await api.get<ListResponse<ParentTeacher>>('/parents/me/teachers/')
  return { data: unwrapList(data) }
}
