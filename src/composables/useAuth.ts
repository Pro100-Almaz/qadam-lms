import { ref, computed } from 'vue'
import { loginApi, logoutApi, getMeApi, updateProfileApi, uploadAvatarApi } from '@/api/auth'
import { setAccessToken } from '@/api/client'
import type { User } from '@/types/auth'
import axios from 'axios'

const user = ref<User | null>(null)
const isAuthenticated = computed(() => !!user.value)
const isSessionLoading = ref(false)

function loadSession() {
  const stored = localStorage.getItem('auth_user')
  const refresh = localStorage.getItem('refresh_token')
  if (stored && refresh) {
    try {
      user.value = JSON.parse(stored)
    } catch {
      localStorage.removeItem('auth_user')
      localStorage.removeItem('refresh_token')
    }
  } else {
    localStorage.removeItem('auth_user')
    localStorage.removeItem('refresh_token')
    setAccessToken(null)
  }
}

async function fetchCurrentUser() {
  isSessionLoading.value = true
  try {
    const { data } = await getMeApi()
    user.value = data
    localStorage.setItem('auth_user', JSON.stringify(data))
  } catch {
    user.value = null
    localStorage.removeItem('auth_user')
    localStorage.removeItem('refresh_token')
    setAccessToken(null)
  } finally {
    isSessionLoading.value = false
  }
}

async function initSession() {
  loadSession()
  if (user.value) {
    await fetchCurrentUser()
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
    localStorage.setItem('auth_user', JSON.stringify(data.user))
    return { success: true }
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 400) {
      return { success: false, errors: err.response.data as Record<string, string[]> }
    }
    throw err
  }
}

async function updateProfile(
  data: Partial<Pick<User, 'email' | 'first_name' | 'last_name' | 'phone_number' | 'date_of_birth' | 'address'>>,
): Promise<{ success: boolean; errors?: Record<string, string[]> }> {
  try {
    const { data: updated } = await updateProfileApi(data)
    user.value = updated
    localStorage.setItem('auth_user', JSON.stringify(updated))
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
      localStorage.setItem('auth_user', JSON.stringify(user.value))
    }
    return { success: true }
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 400) {
      return { success: false, errors: err.response.data as Record<string, string[]> }
    }
    throw err
  }
}

async function logout() {
  const refresh = localStorage.getItem('refresh_token')
  if (refresh) {
    try {
      await logoutApi(refresh)
    } catch {
      // Blacklist call failed — still clear locally
    }
  }
  user.value = null
  setAccessToken(null)
  localStorage.removeItem('auth_user')
  localStorage.removeItem('refresh_token')
}

loadSession()

export function useAuth() {
  return { user, isAuthenticated, isSessionLoading, login, logout, initSession, fetchCurrentUser, updateProfile, uploadAvatar }
}
