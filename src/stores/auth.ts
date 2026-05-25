import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loginApi, logoutApi, getMeApi, updateProfileApi, uploadAvatarApi } from '@/api/auth'
import { setAccessToken } from '@/api/client'
import type { User, UserRole } from '@/types/auth'
import axios from 'axios'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isSessionLoading = ref(true)

  const isAuthenticated = computed(() => !!user.value)
  const userRole = computed(() => user.value?.role ?? null)

  const isAdmin = computed(() =>
    (['admin', 'supervisor', 'principal'] as UserRole[]).includes(userRole.value!)
  )
  const isStaff = computed(() =>
    (['admin', 'teacher', 'homeroom_teacher', 'supervisor', 'principal'] as UserRole[]).includes(userRole.value!)
  )
  const isStudent = computed(() => userRole.value === 'student')
  const isParent = computed(() => userRole.value === 'parent')
  const isTeacher = computed(() =>
    (['teacher', 'homeroom_teacher'] as UserRole[]).includes(userRole.value!)
  )

  async function fetchCurrentUser() {
    try {
      const { data } = await getMeApi()
      user.value = data
    } catch {
      user.value = null
      localStorage.removeItem('refresh_token')
      setAccessToken(null)
    }
  }

  async function initSession() {
    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      isSessionLoading.value = false
      return
    }

    isSessionLoading.value = true
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || '/api/v1/'}auth/token/refresh/`,
        { refresh: refreshToken },
      )
      setAccessToken(data.access)
      if (data.refresh) {
        localStorage.setItem('refresh_token', data.refresh)
      }
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
      user.value = data.user
      setAccessToken(data.tokens.access)
      localStorage.setItem('refresh_token', data.tokens.refresh)
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
    user.value = null
    setAccessToken(null)
    localStorage.removeItem('refresh_token')
  }

  async function updateProfile(
    data: Partial<Pick<User, 'email' | 'first_name' | 'last_name' | 'phone_number' | 'date_of_birth' | 'address'>>,
  ): Promise<{ success: boolean; errors?: Record<string, string[]> }> {
    try {
      const { data: updated } = await updateProfileApi(data)
      user.value = updated
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
    user.value = null
    setAccessToken(null)
    localStorage.removeItem('refresh_token')
    window.location.href = '/signin'
  })

  return {
    user, isSessionLoading, isAuthenticated,
    userRole, isAdmin, isStaff, isStudent, isParent, isTeacher,
    login, logout, initSession, fetchCurrentUser,
    updateProfile, uploadAvatar,
  }
})
