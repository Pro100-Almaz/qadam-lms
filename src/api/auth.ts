import api from './client'
import type { LoginRequest, LoginResponse, User } from '@/types/auth'

export type RegisterRole =
  | 'Admin'
  | 'Teacher'
  | 'HomeroomTeacher'
  | 'Student'
  | 'Supervisor'
  | 'Principal'
  | 'Parent'

export interface RegisterUserRequest {
  first_name: string
  last_name: string
  email: string
  password1: string
  password2: string
  role: RegisterRole
  school?: string
  phone_number?: string
  date_of_birth?: string
  address?: string
  avatar?: File
  gender?: 'M' | 'F'
  academic_degree?: string
  employment_type?: string
  occupation?: string
  school_group?: number
  student_id?: number
}

export interface RegisterUserResponse {
  user: User
}

export interface SchoolGroup {
  id: number
  name: string
  avatar: string
}

export function registerUserApi(data: RegisterUserRequest) {
  const formData = new FormData()
  formData.append('first_name', data.first_name)
  formData.append('last_name', data.last_name)
  formData.append('email', data.email)
  formData.append('password1', data.password1)
  formData.append('password2', data.password2)
  formData.append('role', data.role)
  if (data.school) formData.append('school', data.school)
  if (data.phone_number) formData.append('phone_number', data.phone_number)
  if (data.date_of_birth) formData.append('date_of_birth', data.date_of_birth)
  if (data.address) formData.append('address', data.address)
  if (data.avatar) formData.append('avatar', data.avatar)
  if (data.gender) formData.append('gender', data.gender)
  if (data.academic_degree) formData.append('academic_degree', data.academic_degree)
  if (data.employment_type) formData.append('employment_type', data.employment_type)
  if (data.occupation) formData.append('occupation', data.occupation)
  if (data.school_group != null) formData.append('school_group', String(data.school_group))
  if (data.student_id != null) formData.append('student_id', String(data.student_id))
  return api.post<RegisterUserResponse>('/auth/register/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export async function getSchoolGroupsApi() {
  const { data } = await api.get<{ count: number; results: SchoolGroup[] }>('/auth/school-groups/')
  return { data: data.results }
}

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
