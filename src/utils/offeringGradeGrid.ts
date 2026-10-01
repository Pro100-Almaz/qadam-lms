import type { AnalyticsStudent, AssignmentCoverage, HeatmapAssignment, MissingMode } from '@/api/analytics'
import type { OfferingGradesAssignment } from '@/api/subjectAssignments'

/**
 * One class against one offering's assignments, built in the browser from
 * `/offerings/{id}/subject-grades/` and the class roster. Both the gradebook
 * table and the Statistics heatmap draw from it, so the two can never disagree
 * about the same class.
 *
 * Matrices are indexed `[row][column]`: rows follow `students`, columns follow
 * `assignments`.
 */
export interface GradeGrid {
  students: AnalyticsStudent[]
  assignments: HeatmapAssignment[]
  /** Percent of the assignment's maximum; `0` where ungraded — check `graded`. */
  matrix: number[][]
  /** `false` means no mark: a missing row, or a comment-only one. */
  graded: boolean[][]
  /** In the assignment's own points; `null` where ungraded. */
  raw_grades: (number | null)[][]
  /** Over every column of the grid, under the `missing` rule it was built with. */
  row_means: number[]
  column_means: number[]
  coverage: AssignmentCoverage
  class_size: number
  assignment_count: number
}

/** What a cell needs to be saved: the row behind it, and what it holds. */
export interface GradeCellRecord {
  gradeId: number | null
  value: string
  comments: string
}

export function gradeCellKey(assignmentId: number, studentId: number): string {
  return `${assignmentId}:${studentId}`
}

function meanOf(values: (number | null)[]): number {
  const counted = values.filter((value): value is number => value !== null)
  return counted.length ? counted.reduce((total, value) => total + value, 0) / counted.length : 0
}

/**
 * Row and column means over the given columns only, so a caller that hides
 * some columns — the gradebook's inactive ones — averages exactly what it
 * shows. Under `exclude` an unmarked cell is left out (one mark of 60% means
 * 60); under `zero` it counts as 0 (what was earned of what was set).
 *
 * `columnMeans` is indexed by the grid's column index, like the matrices.
 */
export function gridMeans(
  grid: Pick<GradeGrid, 'students' | 'assignments' | 'matrix' | 'graded'>,
  columns: number[],
  missing: MissingMode = 'exclude',
): { rowMeans: number[]; columnMeans: number[] } {
  const cell = (row: number, column: number): number | null =>
    grid.graded[row]?.[column] ? (grid.matrix[row]?.[column] ?? 0) : missing === 'zero' ? 0 : null

  const columnMeans: number[] = grid.assignments.map(() => 0)
  for (const column of columns) {
    columnMeans[column] = meanOf(grid.students.map((_, row) => cell(row, column)))
  }
  return {
    rowMeans: grid.students.map((_, row) => meanOf(columns.map(column => cell(row, column)))),
    columnMeans,
  }
}

/**
 * Rows are the roster, so a student with no mark still gets a row. A grade row
 * for someone not on it — a student who has since left the class — is dropped.
 * A comment-only row (`grade: null`) is an ungraded cell that still keeps its id
 * and comment, so saving into it patches rather than posts.
 */
export function buildGradeGrid(
  assignments: OfferingGradesAssignment[],
  roster: AnalyticsStudent[],
  missing: MissingMode = 'exclude',
): { grid: GradeGrid; records: Record<string, GradeCellRecord> } {
  const rowOf = new Map(roster.map((student, row) => [student.id, row]))
  const raw: (number | null)[][] = roster.map(() => assignments.map(() => null))
  const records: Record<string, GradeCellRecord> = {}

  assignments.forEach((assignment, column) => {
    for (const student of roster) {
      records[gradeCellKey(assignment.id, student.id)] = { gradeId: null, value: '', comments: '' }
    }
    for (const row of assignment.grades) {
      const index = rowOf.get(row.student)
      if (index === undefined) continue
      raw[index][column] = row.grade
      records[gradeCellKey(assignment.id, row.student)] = {
        gradeId: row.id,
        value: row.grade === null ? '' : String(row.grade),
        comments: row.comments ?? '',
      }
    }
  })

  const graded = raw.map(cells => cells.map(cell => cell !== null))
  const matrix = raw.map(cells =>
    cells.map((cell, column) => {
      const max = assignments[column].max_grade
      return cell !== null && max ? (cell / max) * 100 : 0
    }),
  )
  const gradedCount = graded.reduce((total, cells) => total + cells.filter(Boolean).length, 0)
  const possibleCount = roster.length * assignments.length

  const shape = {
    students: roster,
    assignments: assignments.map((assignment, column) => ({
      id: assignment.id,
      title: assignment.title,
      category: assignment.category,
      is_active: assignment.is_active,
      date: assignment.date,
      max_grade: assignment.max_grade,
      graded_count: graded.filter(cells => cells[column]).length,
    })),
    matrix,
    graded,
  }
  const { rowMeans, columnMeans } = gridMeans(shape, assignments.map((_, column) => column), missing)

  return {
    records,
    grid: {
      ...shape,
      raw_grades: raw,
      row_means: rowMeans,
      column_means: columnMeans,
      coverage: {
        possible_count: possibleCount,
        graded_count: gradedCount,
        graded_share: possibleCount ? (gradedCount / possibleCount) * 100 : 0,
      },
      class_size: roster.length,
      assignment_count: assignments.length,
    },
  }
}
