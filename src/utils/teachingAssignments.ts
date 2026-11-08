import type { Quarter } from '@/types/teachingAssignment'

/** Stored-quarter label; `null` assignments are inactive for offering access. */
export function formatTeachingAssignmentQuarter(
  assignment: { quarter: Quarter | null },
  noQuarterLabel = 'No quarter assigned',
): string {
  return assignment.quarter === null ? noQuarterLabel : `Q${assignment.quarter}`
}
