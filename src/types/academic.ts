export interface AcademicYear {
  id: number
  year: string
  is_active: boolean
  archived: boolean
}

export interface GradeLevel {
  id: number
  number: number
}

export interface ClassGroup {
  id: number
  letter: string
  grade_level: GradeLevel
  academic_year: AcademicYear
  display_name: string
}
