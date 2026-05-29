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

const USE_CHILD_SUBJECT_FIXTURE = true

export async function getMyChildSubjectDetailApi(
  childPk: number,
  subjectPk: number,
) {
  if (USE_CHILD_SUBJECT_FIXTURE) {
    await new Promise((r) => setTimeout(r, 220))
    return { data: buildChildSubjectFixture(childPk, subjectPk) }
  }
  const { data } = await api.get<ParentChildSubjectDetail>(
    `/parents/me/children/${childPk}/subjects/${subjectPk}/`,
  )
  return { data }
}

function buildChildSubjectFixture(
  childPk: number,
  subjectPk: number,
): ParentChildSubjectDetail {
  const subjectsByPk: Record<number, { name: string; lang: 'kaz' | 'rus' | 'eng' }> = {
    1: { name: 'Mathematics', lang: 'eng' },
    2: { name: 'Physics', lang: 'eng' },
    3: { name: 'Chemistry', lang: 'rus' },
    4: { name: 'Biology', lang: 'eng' },
    5: { name: 'Қазақ тілі', lang: 'kaz' },
    6: { name: 'History', lang: 'rus' },
  }
  const meta = subjectsByPk[subjectPk] ?? { name: 'Mathematics', lang: 'eng' as const }

  const seed: Array<{
    title: string
    date: string
    earned: number | null
    max: number
    status: LessonStatus
    comment: string | null
  }> = [
    {
      title: 'Fractions — introduction',
      date: '2025-09-02',
      earned: 8,
      max: 10,
      status: 'completed',
      comment: 'Strong start. Aisha grasped reducing fractions quickly. Encourage her to attempt the bonus problem at the end of the worksheet.',
    },
    {
      title: 'Operations with decimals',
      date: '2025-09-05',
      earned: null,
      max: 10,
      status: 'completed',
      comment: 'Will need to make up this lesson — please review the recorded material together at home.',
    },
    {
      title: 'Word problems with fractions',
      date: '2025-09-09',
      earned: 5,
      max: 10,
      status: 'completed',
      comment: 'Struggled with multi-step problems. We will revisit during next week’s extra practice session.',
    },
    {
      title: 'Mixed numbers practice',
      date: '2025-09-12',
      earned: 9,
      max: 10,
      status: 'completed',
      comment: 'Excellent work — one small calculation slip on problem 7.',
    },
    {
      title: 'Percent introduction',
      date: '2025-09-16',
      earned: 7,
      max: 10,
      status: 'completed',
      comment: null,
    },
    {
      title: 'Percent applications',
      date: '2025-09-19',
      earned: 6,
      max: 10,
      status: 'completed',
      comment: 'Solid effort. Recommend more practice converting between fractions, decimals, and percents.',
    },
    {
      title: 'Ratio and proportion',
      date: '2025-09-23',
      earned: null,
      max: 10,
      status: 'pending',
      comment: null,
    },
    {
      title: 'Quarter assessment',
      date: '2025-09-26',
      earned: null,
      max: 20,
      status: 'on_schedule',
      comment: null,
    },
  ]
  const lessons = seed.map((l, idx) => ({
    lesson_id: 1000 + idx,
    lesson_title: l.title,
    lesson_date: l.date,
    order: idx + 1,
    quarter: 1 as const,
    status: l.status,
    earned_points: l.earned,
    max_points: l.max,
    comment: l.comment,
  }))

  const graded = lessons.filter((l) => l.earned_points !== null)
  const totalEarned = graded.reduce((s, l) => s + (l.earned_points ?? 0), 0)
  const totalMax = graded.reduce((s, l) => s + l.max_points, 0)
  const cumulative = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : null

  return {
    subject_id: subjectPk,
    subject_name: meta.name,
    language_group: meta.lang,
    status: 'active',
    class_group_name: '8A',
    academic_year: '2025/2026',
    child: {
      id: childPk,
      full_name: 'Aisha Bekova',
      avatar: null,
    },
    teacher: {
      id: 42,
      full_name: 'Dinara Seitkali',
      avatar: null,
      email: 'dinara.seitkali@qadam.kz',
      occupation: 'Math Teacher',
    },
    cumulative_grade: cumulative,
    quarter_grades: { '1': 4, '2': null, '3': null, '4': null },
    lessons,
  }
}
