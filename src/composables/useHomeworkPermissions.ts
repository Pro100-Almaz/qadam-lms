import { computed } from 'vue'
import type { Homework } from '@/api/homeworks'
import { useAuth } from '@/composables/useAuth'
import { useTeacherOfferings } from '@/composables/useTeacherOfferings'
import type { UserRole } from '@/types/auth'

/** School-wide read access, no writes — the API 403s every mutation for them. */
const READ_ONLY_STAFF_ROLES: UserRole[] = ['admin', 'supervisor', 'principal', 'psychologist']
const TEACHER_ROLES: UserRole[] = ['teacher', 'homeroom_teacher']

/**
 * The homework permission matrix in one place, so no screen has to discover it
 * from a 403.
 *
 * The server mirrors the assignment quarter into `can_edit`. Authorship is not
 * the test, and homeroom visibility alone
 * never makes a row writable.
 */
export function useHomeworkPermissions() {
  const { user, activeRoles: roles } = useAuth()
  const offerings = useTeacherOfferings()

  const isTeacher = computed(() => TEACHER_ROLES.some(role => roles.value.includes(role)))
  const isReadOnlyStaff = computed(() => READ_ONLY_STAFF_ROLES.some(role => roles.value.includes(role)))

  /**
   * Teacher *profile* id — the path segment of `/teachers/<id>/homeworks/`.
   * `profile_id` is role-polymorphic, so it only means "teacher" once the role
   * says so; a teacher may never pass anyone else's id.
   */
  const myTeacherId = computed(() => (isTeacher.value ? user.value?.profile_id ?? null : null))

  /** Only teachers create, and only for the offerings the picker offers them. */
  const canCreate = computed(() => isTeacher.value)

  /** Homework and homework-grade writes use the backend-provided flag only. */
  function canManage(homework: Pick<Homework, 'can_edit'> | null | undefined): boolean {
    return Boolean(homework && isTeacher.value && homework.can_edit === true)
  }

  /** Reads are allowed inside the caller's scope; writes are teachers-only. */
  function canGrade(homework: Parameters<typeof canManage>[0]): boolean {
    return canManage(homework)
  }

  /**
   * Non-teachers must not call the teacher dashboard — it 403s for them.
   * Assignments are per quarter, so the quarter is required: without it the
   * classes offered would not match what the API lets the teacher write to.
   */
  async function loadOfferings(quarter: number): Promise<void> {
    if (!isTeacher.value) return
    await offerings.load(quarter)
  }

  return {
    isTeacher,
    isReadOnlyStaff,
    myTeacherId,
    canCreate,
    canManage,
    canGrade,
    loadOfferings,
    // Re-exported so a screen needs only this composable: sharing the instance
    // keeps it to one `/teacher/my-classes/` request.
    offeringsLoading: offerings.loading,
    subjectGroups: offerings.subjectGroups,
    classOptions: offerings.classOptions,
  }
}
