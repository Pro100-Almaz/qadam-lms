import api from './client'

/**
 * Quarter grades — one mark per student, per offering, per quarter.
 *
 * Every write is keyed by the offering and the quarter, with students named by
 * **profile** id (the `student` field, not `student_user_id`). The three writes
 * are deliberately separate: POST only creates and PATCH only changes, and each
 * rejects the whole body if any listed student is on the wrong side of that
 * line, so a caller has to know which students already have a grade.
 *
 * Reading is open to all staff; writing only to a teacher assigned to the
 * offering — a homeroom teacher of the class gets a 403. The permission check
 * runs before validation, so a 403 can hide a body that was also invalid.
 */

export interface QuarterGrade {
  id: number
  quarter: number
  grade: number
  /** Student **profile** id — the key every write uses. */
  student: number
  student_user_id: number
  student_name: string
  offering_id: number
  subject_id: number
  subject_name: string
  class_group_id: number
  class_group_name: string
  academic_year_id: number
  created_at: string
}

/** Student profile id → grade. Keys go over the wire as strings. */
export type QuarterGradeMap = Record<number, number>

/**
 * A 400 from any write. `grades` is keyed by student id; `students` (DELETE)
 * and `quarter` are flat lists.
 */
export interface QuarterGradeErrorBody {
  grades?: Record<string, string[]>
  students?: string[]
  quarter?: string[]
  detail?: string
}

/** Sorted by quarter, then last name, then first name. Not paginated. */
export function getQuarterGradesApi(offeringId: number, quarter?: number) {
  return api.get<QuarterGrade[]>(`/offerings/${offeringId}/quarter-grades/`, {
    params: quarter ? { quarter } : undefined,
  })
}

/** Creates grades. 400s, saving nothing, if any listed student already has one. */
export function createQuarterGradesApi(offeringId: number, quarter: number, grades: QuarterGradeMap) {
  return api.post<QuarterGrade[]>(`/offerings/${offeringId}/quarter-grades/`, { quarter, grades })
}

/** Changes existing grades only. 400s, changing nothing, if any listed student has none. */
export function updateQuarterGradesApi(offeringId: number, quarter: number, grades: QuarterGradeMap) {
  return api.patch<QuarterGrade[]>(`/offerings/${offeringId}/quarter-grades/`, { quarter, grades })
}

/** Removes grades. The ids travel in the DELETE body. */
export function deleteQuarterGradesApi(offeringId: number, quarter: number, students: number[]) {
  return api.delete<void>(`/offerings/${offeringId}/quarter-grades/`, { data: { quarter, students } })
}
