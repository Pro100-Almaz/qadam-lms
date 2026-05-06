export interface MySubject {
  offering_id: number
  subject_id: number
  subject_name: string
  subject_code: string
  language: string
  teacher: {
    id: number
    full_name: string
    avatar: string | null
  } | null
  class_group_name: string
  student_grade: number | null
  quarter_grades: Record<string, number | null>
}

export interface MyTeacher {
  id: number
  full_name: string
  avatar: string | null
  email: string
  subjects: string[]
}

export interface MyClassmate {
  id: number
  full_name: string
  avatar: string | null
  email: string
  student_total_grade: number | null
}
