import type { SelectableUserRole, UserRole } from '@/types/auth'

const ROLE_ALIASES: Record<string, SelectableUserRole> = {
  admin: 'admin',
  teacher: 'teacher',
  homeroomteacher: 'teacher',
  student: 'student',
  supervisor: 'supervisor',
  principal: 'principal',
  parent: 'parent',
  clubmanager: 'clubmanager',
  psychologist: 'psychologist',
}

export const roleLabelKeys: Record<SelectableUserRole, string> = {
  admin: 'auth.roles.admin',
  teacher: 'auth.roles.teacher',
  student: 'auth.roles.student',
  supervisor: 'auth.roles.supervisor',
  principal: 'auth.roles.principal',
  parent: 'auth.roles.parent',
  clubmanager: 'auth.roles.clubManager',
  psychologist: 'auth.roles.psychologist',
}

export function normalizeSelectableRole(value?: string | null): SelectableUserRole | null {
  if (!value) return null
  return ROLE_ALIASES[value.toLowerCase().replace(/[^a-z]/g, '')] ?? null
}

export function getAvailableRoles(roles: UserRole[]): SelectableUserRole[] {
  const result: SelectableUserRole[] = []
  for (const role of roles) {
    const normalized = normalizeSelectableRole(role)
    if (normalized && !result.includes(normalized)) result.push(normalized)
  }
  return result
}

export function getActiveRoles(
  activeRole: SelectableUserRole | null,
  assignedRoles: UserRole[],
): UserRole[] {
  if (!activeRole) return []
  if (activeRole !== 'teacher') return [activeRole]

  const roles: UserRole[] = ['teacher']
  if (assignedRoles.includes('homeroom_teacher')) roles.push('homeroom_teacher')
  return roles
}

export function getRoleHome(role: SelectableUserRole | null): string {
  switch (role) {
    case 'student':
      return '/my-subjects'
    case 'parent':
      return '/my-children'
    case 'clubmanager':
      return '/clubs'
    case 'psychologist':
      return '/students'
    case 'admin':
    case 'teacher':
    case 'supervisor':
    case 'principal':
      return '/subjects/active'
    default:
      return '/profile'
  }
}
