import { computed } from 'vue'
import type { SubjectAssignment } from '@/api/subjectAssignments'
import { useAuth } from '@/composables/useAuth'
import { useTeacherOfferings } from '@/composables/useTeacherOfferings'
import type { UserRole } from '@/types/auth'

const TEACHER_ROLES: UserRole[] = ['teacher', 'homeroom_teacher']

/**
 * The assignment/grade permission matrix in one place.
 *
 * The write boundary is the **offering**, never authorship — the API does not
 * even record who created an assignment, so any teacher of the offering may
 * edit, delete and grade it, co-teachers included. Admin roles read the whole
 * school but are blocked from every write, so they must not be offered the
 * buttons.
 *
 * The list endpoint widens a homeroom teacher's reads to their whole class, so
 * a row being visible is *not* proof it is writable — always ask `canManage()`.
 */
export function useAssignmentPermissions() {
  const { user } = useAuth()
  const offerings = useTeacherOfferings()

  const roles = computed(() => user.value?.roles ?? [])
  const isTeacher = computed(() => TEACHER_ROLES.some(role => roles.value.includes(role)))

  const taughtOfferingIds = computed(
    () => new Set(offerings.classes.value.flatMap(group => group.subjects.map(subject => subject.offering_id))),
  )

  /** Only teachers create, and only into the offerings the picker offers them. */
  const canCreate = computed(() => isTeacher.value)

  /** Edit, delete and grade all reduce to one question: do I teach this offering? */
  function canManage(assignment: Pick<SubjectAssignment, 'offering_id'> | null | undefined): boolean {
    if (!assignment || !isTeacher.value) return false
    // With no offering list there is nothing to test against. Denying would lock
    // a teacher out of their own work over a failed side request, so let the
    // attempt through and leave the API as the authority.
    if (offerings.loadError.value) return true
    return taughtOfferingIds.value.has(assignment.offering_id)
  }

  /** Non-teachers must not call the teacher dashboard — it 403s for them. */
  async function loadOfferings(): Promise<void> {
    if (!isTeacher.value) return
    await offerings.load()
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
  }
}
