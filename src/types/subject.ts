import type { User } from './auth'
import type { AcademicYear, ClassGroup } from './academic'

export type SubjectStatus = 'active' | 'archived' | 'disabled' | 'planned'
export type LanguageGroup = 'kaz' | 'rus' | 'eng'
export type StatusAction = 'archive' | 'activate' | 'plan'

export interface Subject {
  id: number
  name: string
  language_group: LanguageGroup
  status: SubjectStatus
  added_by: User
}

export interface SubjectOffering {
  id: number
  subject: Subject
  class_group: ClassGroup
  academic_year: AcademicYear
  grading_strategy: string
  max_points: number
}

export interface SubjectDetail extends Subject {
  offerings: SubjectOffering[]
  students_count: number
  lessons_count: number
  primary_teacher: TeacherListItem | null
}

export interface TeacherListItem {
  id: number
  user: User
  gender: string
  academic_degree: string
  employment_type: string
  occupation: string
  working_hours: number
}

export interface SubjectGrades {
  quarter: number
  students_count: number
  lessons_count: number
  average_subject_points: number
  completion_percent: number
  top_grades: {
    grade: number
    student_name: string
    student_id: number
    user_id: number
  }[]
  lessons: {
    id: number
    title: string
    date: string
    order: number
  }[]
  lesson_avgs: Record<string, Record<string, number>>
}

export interface CreateSubjectRequest {
  name: string
  language_group: LanguageGroup
  status: SubjectStatus
  academic_year: number
  class_groups: number[]
}
