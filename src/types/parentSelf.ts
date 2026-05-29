import type { LanguageGroup, SubjectStatus } from './subject'

export interface ParentChild {
  id: number
  user_id: number
  full_name: string
  avatar: string | null
  class_group_name: string | null
  school_group: string | null
  student_total_grade: number
  quarter_grades: Record<string, number | null>
}


export interface ParentTeacher {
  id: number
  full_name: string
  avatar: string | null
  email: string
  subjects: string[]
  children: string[]
}

// ─── Parent → Child → Subject drill-down ──────────────────────────────────────

export interface ParentChildSubjectTeacher {
  id: number
  full_name: string
  avatar: string | null
  email: string | null
  occupation: string | null
}

export type LessonStatus = 'completed' | 'pending' | 'delayed' | 'on_schedule'

export interface ParentChildLessonGrade {
  lesson_id: number
  lesson_title: string
  lesson_date: string
  order: number
  quarter: 1 | 2 | 3 | 4
  status: LessonStatus
  earned_points: number | null
  max_points: number
  comment: string | null
}

export interface ParentChildSubjectDetail {
  subject_id: number
  subject_name: string
  language_group: LanguageGroup
  status: SubjectStatus
  class_group_name: string | null
  academic_year: string | null
  child: {
    id: number
    full_name: string
    avatar: string | null
  }
  teacher: ParentChildSubjectTeacher | null
  cumulative_grade: number | null
  quarter_grades: Record<'1' | '2' | '3' | '4', number | null>
  lessons: ParentChildLessonGrade[]
}
