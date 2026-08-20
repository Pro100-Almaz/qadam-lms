import type { AxiosRequestConfig } from 'axios'
import api, { unwrapList, type ListResponse, type PaginatedResponse } from './client'

export interface HomeworkOffering {
  id: number
  subject_name: string
  class_group_name: string
  academic_year_label: string
}

export interface HomeworkTeacher {
  /**
   * **User** id of the author, not the Teacher profile id. Compare it against
   * `User.id` to test ownership; never pass it to `getTeacherHomeworksApi`.
   */
  id: number
  full_name: string
}

/**
 * Either the coarse bucket the API derives from the file (`image` / `document` /
 * `other`) or a raw MIME type such as `application/pdf` — both shapes are in the
 * wild, so test it through `isImageAttachment()` rather than comparing by hand.
 */
export type HomeworkAttachmentType = 'image' | 'document' | 'other' | (string & {})

export interface HomeworkAttachment {
  id: number
  /** Original file name, e.g. `worksheet.pdf`. */
  name: string
  /** Absolute media URL — render/download it directly, no API call needed. */
  url: string
  file_type: HomeworkAttachmentType
  created_at: string
}

/** One homework row — always scoped to a single offering (subject × class group). */
export interface Homework {
  id: number
  description: string
  offering: HomeworkOffering
  class_group_id: number
  subject_id: number
  teaching_assignment: number
  teacher: HomeworkTeacher
  max_grade: number
  due_date: string
  is_active: boolean
  /** Absent on older payloads — read it through `attachmentsOf()`, never bare. */
  attachments?: HomeworkAttachment[]
  created_at: string
}

/** `attachments` is optional on the wire; every consumer wants a plain array. */
export function attachmentsOf(homework: Pick<Homework, 'attachments'>): HomeworkAttachment[] {
  return homework.attachments ?? []
}

export interface HomeworkListParams {
  offering?: number
  class_group?: number
  subject?: number
  /** Teacher **profile** id, same id space as `/teachers/<id>/homeworks/`. */
  teacher?: number
  academic_year?: number
  is_active?: boolean
  due_from?: string
  due_to?: string
  page?: number
  page_size?: number
}

/**
 * Bulk create — one row is created per offering, so assigning to three classes
 * returns three homeworks. `teaching_assignment` is resolved server-side.
 */
export interface CreateHomeworksRequest {
  offerings: number[]
  description: string
  max_grade: number
  due_date: string
  is_active: boolean
}

/** `offering` is not writable — moving a task to another class means creating it there. */
export interface UpdateHomeworkRequest {
  description: string
  max_grade: number
  due_date: string
  is_active: boolean
}

/**
 * Incremental file changes for an edit — the API adds and deletes, it never
 * replaces the whole set. Leaving both empty keeps the files untouched.
 */
export interface HomeworkAttachmentEdits {
  /** Files to add. */
  add?: File[]
  /** Ids of already-saved attachments to delete. */
  remove?: number[]
}

export interface UploadOptions {
  /** Called with 0–100 while the body is being sent. */
  onProgress?: (percent: number) => void
}

/**
 * Multipart requests must override the client's `application/json` default:
 * axios serialises FormData to JSON when the content type still says JSON.
 * The browser then replaces this header with one carrying the real boundary,
 * so nothing is hand-rolled here.
 */
function multipartConfig(options?: UploadOptions): AxiosRequestConfig {
  return {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: options?.onProgress
      ? event => {
          const ratio = event.total ? event.loaded / event.total : event.progress ?? 0
          options.onProgress?.(Math.min(100, Math.round(ratio * 100)))
        }
      : undefined,
  }
}

/** Repeated keys, not JSON arrays — `offerings=12&offerings=15`. */
function appendEach(form: FormData, key: string, values: Array<string | number | File>) {
  values.forEach(value => form.append(key, value instanceof File ? value : String(value)))
}

function appendHomeworkFields(form: FormData, fields: Partial<UpdateHomeworkRequest>) {
  if (fields.description !== undefined) form.append('description', fields.description)
  if (fields.max_grade !== undefined) form.append('max_grade', String(fields.max_grade))
  if (fields.due_date !== undefined) form.append('due_date', fields.due_date)
  if (fields.is_active !== undefined) form.append('is_active', String(fields.is_active))
}

function hasAttachmentEdits(edits?: HomeworkAttachmentEdits): boolean {
  return Boolean(edits?.add?.length || edits?.remove?.length)
}

export interface StudentHomeworkGrade {
  id: number
  /** Nullable — the teacher may have left a comment without a mark. */
  grade: number | null
  /** The teacher's note on the mark. `''` when they left it blank. */
  comments: string
  created_at: string
}

/** A homework as seen from one student, with their own grade attached. */
export interface StudentHomework extends Homework {
  /** `null` means ungraded *or* not visible to the caller. */
  student_grade: StudentHomeworkGrade | null
}

export interface StudentHomeworkListParams {
  subject?: number
  offering?: number
  academic_year?: number
  is_active?: boolean
  due_from?: string
  due_to?: string
  page?: number
  page_size?: number
}

/**
 * Homework across every offering taught to the student's active enrollments.
 * Gated by `can_access_student()`; no active enrollment returns an empty page.
 */
export function getStudentHomeworksApi(
  studentId: number | string,
  params?: StudentHomeworkListParams,
) {
  return api.get<PaginatedResponse<StudentHomework>>(`/students/${studentId}/homeworks/`, { params })
}

/**
 * One student's grade on one homework, as the teacher-facing endpoints return it.
 * `student` is the Student *profile* id — the same id space the roster's top-level
 * `id` and the attendance API use, **not** the user id (that is `student_user_id`).
 */
export interface HomeworkGrade {
  id: number
  student: number
  student_user_id: number
  student_name: string
  /**
   * Nullable: a row may carry only a comment. `null` is "no mark recorded",
   * which is distinct from a row that does not exist at all.
   */
  grade: number | null
  /** The teacher's note on the mark. `''` when they left it blank. */
  comments: string
}

/** Every grade recorded against a homework. `student` filters by profile id. */
export async function getHomeworkGradesApi(
  homeworkId: number | string,
  params?: { student?: number },
) {
  const { data } = await api.get<ListResponse<HomeworkGrade>>(
    `/homeworks/${homeworkId}/grades/`,
    { params },
  )
  return { data: unwrapList(data) }
}

/**
 * Writes are limited to the teachers of the homework's offering — everyone else
 * 403s, so gate the UI with `useHomeworkPermissions().canGrade()`. One grade per
 * student per homework: a second POST for the same student is a 400, patch the
 * existing row instead.
 */
export function createHomeworkGradeApi(
  homeworkId: number | string,
  data: { student: number; grade: number | null; comments?: string },
) {
  return api.post<HomeworkGrade>(`/homeworks/${homeworkId}/grades/`, data)
}

/**
 * Only the grade and its comment are patched — `student` is sent only when
 * reassigning a row. Passing `comments: ''` clears an existing note.
 */
export function updateHomeworkGradeApi(
  gradeId: number,
  data: { grade?: number | null; comments?: string },
) {
  return api.patch<HomeworkGrade>(`/homework-grades/${gradeId}/`, data)
}

export function deleteHomeworkGradeApi(gradeId: number) {
  return api.delete<void>(`/homework-grades/${gradeId}/`)
}

/** Everything but `is_active` — the my-class list never returns drafts. */
export type MyClassHomeworkListParams = Omit<HomeworkListParams, 'is_active'>

/**
 * Published homework of the class(es) the **caller** is homeroom teacher of,
 * across every subject taught to them — rows they teach themselves included.
 * There is no id in the path; it is always the signed-in teacher.
 *
 * Teacher role only: everyone else 403s, admins included. A teacher without a
 * homeroom assignment gets `200` with `count: 0`, so an empty list is not an
 * error.
 *
 * Editing still needs a teaching assignment on the row's offering, so this
 * screen stays read-only.
 */
export function getMyClassHomeworksApi(params?: MyClassHomeworkListParams) {
  return api.get<PaginatedResponse<Homework>>('/teachers/my-class/homeworks/', { params })
}

/**
 * Homework authored by one teacher. `teacherId` is the Teacher **profile** id —
 * for the signed-in teacher that is `User.profile_id`, never `Homework.teacher.id`
 * (a user id) and never `User.id`.
 *
 * A teacher may only pass their own id; anyone else's returns 403. Staff,
 * students and parents may pass any teacher's id.
 */
export function getTeacherHomeworksApi(teacherId: number, params?: HomeworkListParams) {
  return api.get<PaginatedResponse<Homework>>(`/teachers/${teacherId}/homeworks/`, { params })
}

export function getHomeworkApi(id: number | string) {
  return api.get<Homework>(`/homeworks/${id}/`)
}

/**
 * 201 with one homework per offering. All-or-nothing: a 403 creates nothing.
 * Every row gets its **own copy** of `files`, so deleting one class's worksheet
 * later leaves the other classes' copies alone.
 */
export function createHomeworksApi(
  data: CreateHomeworksRequest,
  files: File[] = [],
  options?: UploadOptions,
) {
  if (!files.length) return api.post<Homework[]>('/homeworks/', data)

  const form = new FormData()
  appendEach(form, 'offerings', data.offerings)
  appendHomeworkFields(form, data)
  appendEach(form, 'attachments', files)
  return api.post<Homework[]>('/homeworks/', form, multipartConfig(options))
}

export function replaceHomeworkApi(
  id: number | string,
  data: UpdateHomeworkRequest,
  edits?: HomeworkAttachmentEdits,
  options?: UploadOptions,
) {
  if (!hasAttachmentEdits(edits)) return api.put<Homework>(`/homeworks/${id}/`, data)

  const form = new FormData()
  appendHomeworkFields(form, data)
  appendEach(form, 'attachments', edits?.add ?? [])
  appendEach(form, 'remove_attachments', edits?.remove ?? [])
  return api.put<Homework>(`/homeworks/${id}/`, form, multipartConfig(options))
}

export function deleteHomeworkApi(id: number | string) {
  return api.delete<void>(`/homeworks/${id}/`)
}
