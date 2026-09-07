export interface TeachingAssignment {
  /** Offering id: the subject-class record used by schedules and gradebook analytics. */
  id: number
  subject_name: string
  class_group_name: string
  teacher_name: string
  academic_year: string
  academic_year_id: number
}
