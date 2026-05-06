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
