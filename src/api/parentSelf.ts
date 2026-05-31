import api from './client'
import { type ListResponse, unwrapList } from './client'
import type {
  ParentChild,
  ParentTeacher,
  ParentChildSubjectDetail,
  LessonStatus,
} from '@/types/parentSelf'
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

// ─── Parent child-subject detail ──────────────────────────────────────────────
// TODO: replace fixture branch with real call once
// GET /parents/me/children/{childPk}/subjects/{subjectPk}/ ships on the backend.

export async function getMyChildSubjectDetailApi(
  childPk: number,
  subjectPk: number,
) {
  const { data } = await api.get<ParentChildSubjectDetail>(
    `/parents/me/children/${childPk}/subjects/${subjectPk}/`,
  )
  return { data }
}
