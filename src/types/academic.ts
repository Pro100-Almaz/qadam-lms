export interface QuarterDates {
  quarter: number
  start: string | null
  end: string | null
}

export interface AcademicYear {
  id: number
  year: string
  is_active: boolean
  archived: boolean
  current_quarter?: number
  quarters?: QuarterDates[]
}

export interface GradeLevel {
  id: number
  number: number
}

/**
 * `major` is the class a student belongs to — 7A. `minor` is a subgroup taught
 * apart from it: two classes pooled and split by level for a language, say. A
 * student has exactly one major group and any number of minor ones, each alive
 * only for the subject it was made for.
 */
export type ClassGroupCategory = 'major' | 'minor'

export interface ClassGroup {
  id: number
  letter: string
  category: ClassGroupCategory
  /** `null` on a minor group — a subgroup spans whatever grades fed into it. */
  grade_level: GradeLevel | null
  academic_year: AcademicYear
  display_name: string
}
