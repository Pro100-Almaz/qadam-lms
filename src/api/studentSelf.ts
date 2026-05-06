import api from './client'
import { type ListResponse, unwrapList } from './client'
import type { MySubject, MyTeacher, MyClassmate } from '@/types/studentSelf'

export async function getMySubjectsApi() {
  const { data } = await api.get<ListResponse<MySubject>>('/students/me/subjects/')
  return { data: unwrapList(data) }
}

export async function getMyTeachersApi() {
  const { data } = await api.get<ListResponse<MyTeacher>>('/students/me/teachers/')
  return { data: unwrapList(data) }
}

export async function getMyClassmatesApi(params?: { search?: string }) {
  const { data } = await api.get<ListResponse<MyClassmate>>('/students/me/classmates/', { params })
  return { data: unwrapList(data) }
}
