import type { SubjectOffering } from './subject'

export type Quarter = 1 | 2 | 3 | 4
export type TeachingAssignmentRole = 'primary' | 'assistant' | 'substitute'

/** The canonical teaching-assignment shape returned on teacher detail endpoints. */
export interface TeachingAssignment {
  id: number
  offering: SubjectOffering
  teacher: number
  role: TeachingAssignmentRole
  /** `null` is intentionally inactive and grants no offering or grade access. */
  quarter: Quarter | null
}

/**
 * `/teaching-assignments/` is an endpoint-specific projection. Its `id` is the
 * offering id (not the TeachingAssignment row id), which existing schedule and
 * gradebook consumers rely on.
 */
export interface TeachingAssignmentListItem {
  id: number
  subject_name: string
  class_group_name: string
  teacher_name: string
  academic_year: string
  academic_year_id: number
  role: TeachingAssignmentRole
  quarter: Quarter | null
}

export interface EditableResource {
  /** Server-computed permission hint. A missing/false flag must be read-only. */
  can_edit: boolean
}
