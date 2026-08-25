import api from './client'

/**
 * Grade reports — the school's marks rendered as an `.xlsx` workbook.
 *
 * Both endpoints answer with a spreadsheet, never JSON, so every call here asks
 * axios for a `Blob`. The trade-off is that an *error* body arrives as a Blob
 * too: read it back with `readBlobErrorData()` before trying to show it.
 */

/**
 * Which axis becomes a sheet.
 *
 * Omitted — the default — gives one sheet per subject with the students as
 * rows. `student` flips it: one sheet per student, one small table per subject
 * inside it, since subjects do not share assignments.
 *
 * The API rejects it alongside `subject`: a single subject collapses to one
 * sheet either way, so the parameter would say nothing.
 */
export type GradeReportOrdering = 'student'

export interface GradeReportParams {
  /** 1–4, and required: omitting it is a 400, not "the current quarter". */
  quarter: number
  /** Subject **id**. Omitted means every subject taught to the class group. */
  subject?: number
  ordering?: GradeReportOrdering
}

/**
 * Every mark of one class group in one quarter. Assignments outside the
 * quarter's date range are left out, so a winter exam never lands in Q1.
 *
 * Homeroom teachers and staff may ask for the whole class; a subject teacher
 * gets a 403 unless they pass `subject` — narrowing to what they teach is what
 * opens the endpoint to them.
 */
export function downloadClassGroupGradeReportApi(
  classGroupId: number,
  params: GradeReportParams,
) {
  return api.get<Blob>(`/grade/classgroup/${classGroupId}/`, {
    params,
    responseType: 'blob',
  })
}

/**
 * One student's marks. `studentId` is the Student **profile** id — the same id
 * space `/subject-grades/?student=` uses, and what `profile_id` on `/auth/me/`
 * holds for a student reading their own.
 *
 * Scoped to the caller: a teacher may pull a student they teach, a parent their
 * own child, a student themselves. A classmate gets a 403.
 */
export function downloadStudentGradeReportApi(studentId: number, params: GradeReportParams) {
  return api.get<Blob>(`/grade/student/${studentId}/`, {
    params,
    responseType: 'blob',
  })
}
