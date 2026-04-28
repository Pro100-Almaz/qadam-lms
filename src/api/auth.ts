import api from './client'
import type { LoginRequest, LoginResponse, User } from '@/types/auth'

export function loginApi(data: LoginRequest) {
  return api.post<LoginResponse>('/auth/login/', data)
}

export function logoutApi(refresh: string) {
  return api.post('/auth/logout/', { refresh })
}

export function getMeApi() {
  return api.get<User>('/auth/me/')
}

export function updateProfileApi(data: Partial<Pick<User, 'email' | 'first_name' | 'last_name' | 'phone_number' | 'date_of_birth' | 'address'>>) {
  return api.patch<User>('/auth/me/', data)
}

export function forgetPasswordApi(username: string) {
  return api.post<{ username: string; signed_code: string }>('/auth/forget-password/', { username })
}

export function verifyCodeApi(username: string, signedCode: string, verificationCode: string) {
  return api.post<{ username: string; signed_code: string; verified: boolean }>(
    `/auth/verify-code/${encodeURIComponent(username)}/${encodeURIComponent(signedCode)}/`,
    { verification_code: verificationCode },
  )
}

export function changePasswordApi(username: string, signedCode: string, password1: string, password2: string) {
  return api.post<{ detail: string }>(
    `/auth/change-password/${encodeURIComponent(username)}/${encodeURIComponent(signedCode)}/`,
    { password1, password2 },
  )
}

export function uploadAvatarApi(file: File) {
  const formData = new FormData()
  formData.append('avatar', file)
  return api.post<{ avatar: string }>('/auth/me/avatar/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
