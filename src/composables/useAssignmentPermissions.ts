import { computed } from 'vue'
import type { SubjectAssignment } from '@/api/subjectAssignments'
import { useAuth } from '@/composables/useAuth'
import { useTeacherOfferings } from '@/composables/useTeacherOfferings'
import type { UserRole } from '@/types/auth'

const TEACHER_ROLES: UserRole[] = ['teacher', 'homeroom_teacher']

/**
 * The assignment/grade permission matrix in one place.
 *
 * The server calculates `can_edit` from the work's stored quarter and the
 * caller's TeachingAssignment quarter. Admin roles read the whole school but
 * are blocked from every write, so they must not be offered the buttons.
 *
 * The list endpoint widens a homeroom teacher's reads to their whole class, so
 * a row being visible is *not* proof it is writable — always ask `canManage()`.
 */
export function useAssignmentPermissions() {
  const { activeRoles: roles } = useAuth()
  const offerings = useTeacherOfferings()

  const isTeacher = computed(() => TEACHER_ROLES.some(role => roles.value.includes(role)))

  /** Only teachers create, and only into the offerings the picker offers them. */
  const canCreate = computed(() => isTeacher.value)

  /** The server evaluates the assignment's stored quarter. */
  function canManage(assignment: Pick<SubjectAssignment, 'can_edit'> | null | undefined): boolean {
    return Boolean(assignment && isTeacher.value && assignment.can_edit === true)
  }

  /** Non-teachers must not call the teacher dashboard — it 403s for them. */
  async function loadOfferings(quarter?: number): Promise<void> {
    if (!isTeacher.value) return
    await offerings.load(quarter)
  }

  return {
    isTeacher,
    canCreate,
    canManage,
    loadOfferings,
    // Re-exported so a screen needs only this composable: sharing the instance
    // keeps it to one `/teacher/my-classes/` request.
    offeringsLoading: offerings.loading,
    subjectGroups: offerings.subjectGroups,
    classOptions: offerings.classOptions,
    /** The raw class groups, for callers that need each one's subject names. */
    teacherClasses: offerings.classes,
  }
}
