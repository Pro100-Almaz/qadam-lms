import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loginApi, logoutApi, getMeApi, updateProfileApi, uploadAvatarApi } from '@/api/auth'
import { setAccessToken, setActiveRoleHeader, refreshAccessToken } from '@/api/client'
import type { User, UserRole } from '@/types/auth'
import type { SelectableUserRole } from '@/types/auth'
import { getActiveRoles, getAvailableRoles, normalizeSelectableRole } from '@/utils/roles'
import axios from 'axios'

const ACTIVE_ROLE_STORAGE_KEY = 'qadam-lms.active-role'

interface StoredActiveRole {
  userId: number
  role: SelectableUserRole
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isSessionLoading = ref(true)
  const activeRole = ref<SelectableUserRole | null>(null)

  const isAuthenticated = computed(() => !!user.value)
  const assignedRoles = computed<UserRole[]>(() => user.value?.roles ?? [])
  const availableRoles = computed(() => getAvailableRoles(assignedRoles.value))
  const activeRoles = computed(() => getActiveRoles(activeRole.value, assignedRoles.value))
  // Keep the established store property as the permission-oriented role list.
  const userRoles = computed(() => activeRoles.value)

  const isAdmin = computed(() =>
    userRoles.value.some(role => (['admin', 'supervisor', 'principal'] as UserRole[]).includes(role))
  )
  const isStaff = computed(() =>
    userRoles.value.some(role => (['admin', 'teacher', 'homeroom_teacher', 'supervisor', 'principal'] as UserRole[]).includes(role))
  )
  const isStudent = computed(() => userRoles.value.includes('student'))
  const isParent = computed(() => userRoles.value.includes('parent'))
  const isTeacher = computed(() =>
    userRoles.value.some(role => (['teacher', 'homeroom_teacher'] as UserRole[]).includes(role))
  )

  // The picked role lives in localStorage next to the refresh token, so it
  // survives reloads, new tabs and browser restarts for as long as the session.
  function readStoredActiveRole(): StoredActiveRole | null {
    try {
      const value = localStorage.getItem(ACTIVE_ROLE_STORAGE_KEY)
      return value ? JSON.parse(value) as StoredActiveRole : null
    } catch {
      return null
    }
  }

  function removeStoredActiveRole() {
    try {
      localStorage.removeItem(ACTIVE_ROLE_STORAGE_KEY)
    } catch {
      // Storage unavailable — nothing to clear.
    }
  }

  function persistActiveRole() {
    if (!user.value || !activeRole.value) {
      removeStoredActiveRole()
      return
    }
    try {
      localStorage.setItem(ACTIVE_ROLE_STORAGE_KEY, JSON.stringify({
        userId: user.value.id,
        role: activeRole.value,
      } satisfies StoredActiveRole))
    } catch {
      // Storage unavailable — the role still applies for this page load.
    }
  }

  function reconcileActiveRole() {
    if (!user.value) {
      activeRole.value = null
      setActiveRoleHeader(null)
      removeStoredActiveRole()
      return
    }

    const roles = availableRoles.value
    const stored = readStoredActiveRole()
    const primaryRole = normalizeSelectableRole(user.value.primary_group)
    activeRole.value =
      (stored?.userId === user.value.id && roles.includes(stored.role) ? stored.role : null)
      ?? (primaryRole && roles.includes(primaryRole) ? primaryRole : null)
      ?? roles[0]
      ?? null
    setActiveRoleHeader(activeRole.value)
    persistActiveRole()
  }

  function setActiveRole(role: SelectableUserRole): boolean {
    if (!availableRoles.value.includes(role)) return false
    activeRole.value = role
    setActiveRoleHeader(role)
    persistActiveRole()
    return true
  }

  function clearAuthState() {
    user.value = null
    activeRole.value = null
    setActiveRoleHeader(null)
    removeStoredActiveRole()
    setAccessToken(null)
    localStorage.removeItem('refresh_token')
  }

  async function fetchCurrentUser() {
    try {
      const { data } = await getMeApi()
      user.value = data
      reconcileActiveRole()
    } catch {
      clearAuthState()
    }
  }

  async function initSession() {
    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      clearAuthState()
      isSessionLoading.value = false
      return
    }

    isSessionLoading.value = true
    // Send the stored role with /auth/me/ too, so the first authenticated
    // request already carries X-Active-Role; reconcileActiveRole() re-checks
    // it against the user once they are known.
    setActiveRoleHeader(readStoredActiveRole()?.role ?? null)
    try {
      await refreshAccessToken()
      await fetchCurrentUser()
    } catch {
      logout()
    } finally {
      isSessionLoading.value = false
    }
  }

  async function login(
    username: string,
    password: string,
  ): Promise<{ success: boolean; errors?: Record<string, string[]> }> {
    try {
      const { data } = await loginApi({ username, password })
      setAccessToken(data.tokens.access)
      localStorage.setItem('refresh_token', data.tokens.refresh)
      // Pick the active role from the same /auth/me/ a reload reads: without
      // its roles no role is chosen, and every role-scoped endpoint answers 403
      // until the page is reloaded.
      try {
        const { data: me } = await getMeApi()
        user.value = me
      } catch {
        user.value = data.user
      }
      reconcileActiveRole()
      return { success: true }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 400) {
        return { success: false, errors: err.response.data as Record<string, string[]> }
      }
      throw err
    }
  }

  function logout() {
    const refresh = localStorage.getItem('refresh_token')
    if (refresh) {
      logoutApi(refresh).catch(() => {})
    }
    clearAuthState()
  }

  async function updateProfile(
    data: Partial<Pick<User, 'email' | 'first_name' | 'last_name' | 'phone_number' | 'date_of_birth' | 'address'>>,
  ): Promise<{ success: boolean; errors?: Record<string, string[]> }> {
    try {
      const { data: updated } = await updateProfileApi(data)
      user.value = updated
      reconcileActiveRole()
      return { success: true }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 400) {
        return { success: false, errors: err.response.data as Record<string, string[]> }
      }
      throw err
    }
  }

  async function uploadAvatar(
    file: File,
  ): Promise<{ success: boolean; errors?: Record<string, string[]> }> {
    try {
      const { data } = await uploadAvatarApi(file)
      if (user.value) {
        user.value = { ...user.value, avatar: data.avatar }
      }
      return { success: true }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 400) {
        return { success: false, errors: err.response.data as Record<string, string[]> }
      }
      throw err
    }
  }

  // Listen for forced logout from 401 interceptor
  window.addEventListener('auth:logout', () => {
    clearAuthState()
    window.location.href = '/signin'
  })

  return {
    user, isSessionLoading, isAuthenticated,
    assignedRoles, availableRoles, activeRole, activeRoles, userRoles,
    isAdmin, isStaff, isStudent, isParent, isTeacher,
    setActiveRole,
    login, logout, initSession, fetchCurrentUser,
    updateProfile, uploadAvatar,
  }
})
