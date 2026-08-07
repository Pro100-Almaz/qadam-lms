import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { UserRole } from '@/types/auth'

export function useRoleAccess() {
  const auth = useAuthStore()

  function hasRole(...roles: UserRole[]) {
    return computed(() => !!auth.userRoles && roles.some((role) => auth.userRoles?.includes(role)))
  }

  function canEdit(resource: string) {
    const editPermissions: Record<string, UserRole[]> = {
      student: ['admin', 'supervisor'],
      teacher: ['admin', 'supervisor'],
      lesson: ['admin', 'teacher', 'homeroom_teacher', 'supervisor'],
      subject: ['admin', 'teacher', 'homeroom_teacher', 'supervisor'],
      grade: ['admin', 'teacher', 'homeroom_teacher', 'supervisor'],
      achievement: ['admin', 'teacher', 'homeroom_teacher', 'supervisor'],
    }
    return computed(() => {
      const allowed = editPermissions[resource] ?? []
      return !!auth.userRoles && allowed.some((role) => auth.userRoles?.includes(role))
    })
  }

  return {
    hasRole,
    canEdit,
    isAdmin: computed(() => auth.isAdmin),
    isStaff: computed(() => auth.isStaff),
    isStudent: computed(() => auth.isStudent),
    isParent: computed(() => auth.isParent),
    isTeacher: computed(() => auth.isTeacher),
  }
}
