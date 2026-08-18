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
 * The rule that trips people up: an offering can have several teachers, and
 * **any** of them may edit, delete and grade its homework — including tasks a
 * colleague created. So authorship (`homework.teacher.id`) is not the test;
 * "do I teach this offering" is. A homeroom teacher sees their whole class's
 * homework but may only touch the offerings they personally teach.
 */
export function useHomeworkPermissions() {
  const { user } = useAuth()
  const offerings = useTeacherOfferings()

  const roles = computed(() => user.value?.roles ?? [])
  const isTeacher = computed(() => TEACHER_ROLES.some(role => roles.value.includes(role)))
  const isReadOnlyStaff = computed(() => READ_ONLY_STAFF_ROLES.some(role => roles.value.includes(role)))

  /**
   * Teacher *profile* id — the path segment of `/teachers/<id>/homeworks/`.
   * `profile_id` is role-polymorphic, so it only means "teacher" once the role
   * says so; a teacher may never pass anyone else's id.
   */
  const myTeacherId = computed(() => (isTeacher.value ? user.value?.profile_id ?? null : null))

  const taughtOfferingIds = computed(
    () => new Set(offerings.classes.value.flatMap(group => group.subjects.map(subject => subject.offering_id))),
  )

  /** Only teachers create, and only for the offerings the picker offers them. */
  const canCreate = computed(() => isTeacher.value)

  /** Edit, delete and grade all share one rule: do I teach this offering? */
  function canManage(homework: Pick<Homework, 'offering' | 'teacher'> | null | undefined): boolean {
    if (!homework || !isTeacher.value) return false
    // The offering list is the source of truth, but if it failed to load, fall
    // back to authorship rather than locking the author out of their own task.
    if (offerings.loadError.value) return Boolean(user.value && homework.teacher?.id === user.value.id)
    return taughtOfferingIds.value.has(homework.offering.id)
  }

  /** Reads are allowed inside the caller's scope; writes are teachers-only. */
  function canGrade(homework: Parameters<typeof canManage>[0]): boolean {
    return canManage(homework)
  }

  /** Non-teachers must not call the teacher dashboard — it 403s for them. */
  async function loadOfferings(): Promise<void> {
    if (!isTeacher.value) return
    await offerings.load()
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
