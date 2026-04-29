import type { User } from './auth'
import type { ClassGroup } from './academic'
import type { SubjectOffering } from './subject'

export interface Student {
  id: number
  user: User
  school_group: number
  academic_year: number
  current_class_group: ClassGroup | null
}

export interface PsychologicalState {
  id: number
  name: string
  score: number
  comment: string
  added_by: string
  time_added: string
}

export interface PsychologicalStateTemplate {
  id: number
  name: string
  comment: string
}

export interface StudentDetail extends Student {
  offerings: SubjectOffering[]
  subject_quarter_grades: Record<string, Record<string, number>>
  total_quarter_grades: Record<string, number>
  cumulative_subject_grades: Record<string, number>
  student_total_grade: number
  psychological_states: {
    current: PsychologicalState[]
    history: Record<string, PsychologicalState[]>
  }
}

export interface UpdateStudentRequest {
  email?: string
  first_name?: string
  last_name?: string
  phone_number?: string
  date_of_birth?: string
  address?: string
  school_group?: number
  academic_year?: number
  class_group?: number
}

export interface CreatePsychologicalStateRequest {
  state_name: string
  score: number
  comment: string
}
