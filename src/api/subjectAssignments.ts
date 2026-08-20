import api, { type PaginatedResponse } from './client'

/**
 * A graded piece of work — a lesson mark, an exam or a final. Distinct from
 * `Homework`: an assignment carries no description, files or due date, only a
 * title and the scale its grades are measured on.
 */
export type SubjectAssignmentCategory = 'lesson' | 'exam' | 'final'

export const SUBJECT_ASSIGNMENT_CATEGORIES: SubjectAssignmentCategory[] = ['lesson', 'exam', 'final']

/**
 * One assignment. Note the shape difference from `Homework`: the offering is
 * flattened into `offering_id` plus denormalised names, so there is no nested
 * `offering` object to read through.
 */
export interface SubjectAssignment {
  id: number
  title: string
  category: SubjectAssignmentCategory
  /** Upper bound of every grade on this assignment. Always ≥ 1. */
  max_grade: number
  offering_id: number
  subject_id: number
  subject_name: string
  class_group_id: number
  class_group_name: string
  academic_year_id: number
  /**
   * The academic day the work actually took place, `YYYY-MM-DD`. Distinct from
   * `created_at`, which only records when the row was typed in — this is the
   * date to show the reader, and the one lists are ordered by.
   */
  date: string
  created_at: string
}

export interface SubjectAssignmentListParams {
  offering?: number
  subject?: number
  class_group?: number
  academic_year?: number
  category?: SubjectAssignmentCategory
  /** Exact academic day, `YYYY-MM-DD`. */
  date?: string
  /** On or after this academic day, `YYYY-MM-DD`. */
  date_from?: string
  /** On or before this academic day, `YYYY-MM-DD`. */
  date_to?: string
  page?: number
  page_size?: number
}

/** `offering` is write-once — retargeting an assignment means creating a new one. */
export interface CreateSubjectAssignmentRequest {
  offering: number
  title: string
  /** Defaults to `lesson` server-side when omitted. */
  category?: SubjectAssignmentCategory
  max_grade: number
  /** Required, `YYYY-MM-DD`: omitting it is a 400, not a default of today. */
  date: string
}

/** Everything but `offering`, which the API rejects as immutable. */
export type UpdateSubjectAssignmentRequest = Partial<Omit<CreateSubjectAssignmentRequest, 'offering'>>

/**
 * Role-scoped: staff see the whole school, a teacher sees the offerings they
 * teach **plus their homeroom class**, students and parents see their own
 * classes. Anyone else gets an empty page rather than a 403.
 *
 * Ordered by academic `date` descending — newest lesson first, not newest row.
 */
export function getSubjectAssignmentsApi(params?: SubjectAssignmentListParams) {
  return api.get<PaginatedResponse<SubjectAssignment>>('/subject-assignments/', { params })
}

export function getSubjectAssignmentApi(id: number | string) {
  return api.get<SubjectAssignment>(`/subject-assignments/${id}/`)
}

/**
 * Teachers only, and only for an offering they hold a teaching assignment on —
 * everyone else, admins included, gets a 403.
 */
export function createSubjectAssignmentApi(data: CreateSubjectAssignmentRequest) {
  return api.post<SubjectAssignment>('/subject-assignments/', data)
}

/**
 * Lowering `max_grade` below a grade already recorded is a 400, so the API — not
 * the form — is the authority on how far it may drop.
 */
export function updateSubjectAssignmentApi(id: number | string, data: UpdateSubjectAssignmentRequest) {
  return api.patch<SubjectAssignment>(`/subject-assignments/${id}/`, data)
}

/** Cascades to every grade recorded against the assignment. */
export function deleteSubjectAssignmentApi(id: number | string) {
  return api.delete<void>(`/subject-assignments/${id}/`)
}

/**
 * One student's mark on one assignment. `student` is the Student **profile** id
 * — the same id space the roster's top-level `id` uses, not `student_user_id`.
 * The assignment is inlined on every row, so a grade renders without a lookup.
 */
export interface SubjectGrade {
  id: number
  assignment: SubjectAssignment
  student: number
  student_user_id: number
  student_name: string
  /**
   * Nullable: a row may carry only a comment. `null` is "no mark recorded",
   * which is distinct from a row that does not exist at all.
   */
  grade: number | null
  comments: string
  created_at: string
}

export interface SubjectGradeListParams {
  student?: number
  assignment?: number
  offering?: number
  subject?: number
  class_group?: number
  academic_year?: number
  category?: SubjectAssignmentCategory
  /** Filters on the **assignment's** academic day, not the grade's `created_at`. */
  date?: string
  date_from?: string
  date_to?: string
  page?: number
  page_size?: number
}

/** The per-assignment grade sheet, ordered by student name. */
export function getAssignmentGradesApi(
  assignmentId: number | string,
  params?: { student?: number; page?: number; page_size?: number },
) {
  return api.get<PaginatedResponse<SubjectGrade>>(
    `/subject-assignments/${assignmentId}/grades/`,
    { params },
  )
}

/**
 * The assignment comes from the URL and is ignored in the body. One grade per
 * student per assignment: a second POST for the same student is a 400, so patch
 * the existing row instead.
 */
export function createAssignmentGradeApi(
  assignmentId: number | string,
  data: { student: number; grade: number | null; comments?: string },
) {
  return api.post<SubjectGrade>(`/subject-assignments/${assignmentId}/grades/`, data)
}

/**
 * The main "what are this student's marks" list, across every assignment.
 * A teacher sees their own offerings **plus** all of their homeroom students.
 *
 * Ordered by the assignment's academic `date` descending.
 */
export function getSubjectGradesApi(params?: SubjectGradeListParams) {
  return api.get<PaginatedResponse<SubjectGrade>>('/subject-grades/', { params })
}

export function getSubjectGradeApi(id: number | string) {
  return api.get<SubjectGrade>(`/subject-grades/${id}/`)
}

/** Teacher of the assignment's offering only. `student` cannot be moved. */
export function updateSubjectGradeApi(
  id: number,
  data: { grade?: number | null; comments?: string },
) {
  return api.patch<SubjectGrade>(`/subject-grades/${id}/`, data)
}

export function deleteSubjectGradeApi(id: number) {
  return api.delete<void>(`/subject-grades/${id}/`)
}

/** Everything but `assignment`, which the homeroom endpoint does not accept. */
export type MyClassSubjectGradeParams = Omit<SubjectGradeListParams, 'assignment'>

/**
 * Homeroom view — every subject grade of the caller's homeroom students, across
 * all subjects taught to the class and not just the caller's own. Teacher role
 * only; a teacher with no homeroom assignment gets `200` with `count: 0`, so an
 * empty list is not an error.
 *
 * Read-only by design: writing still needs a teaching assignment on the row's
 * offering, which is what the Grading page covers.
 */
export function getMyClassSubjectGradesApi(params?: MyClassSubjectGradeParams) {
  return api.get<PaginatedResponse<SubjectGrade>>('/teachers/my-class/subject-grades/', { params })
}
