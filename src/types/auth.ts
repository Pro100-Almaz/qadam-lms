export type UserRole =
  | 'admin'
  | 'teacher'
  | 'homeroom_teacher'
  | 'student'
  | 'supervisor'
  | 'principal'
  | 'parent'
  | 'clubmanager'
  | 'psychologist'

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  phone_number: string
  date_of_birth: string
  address: string
  avatar: string | null
  school: string
  roles: UserRole[]
  role_display: string
  primary_group: string
  /**
   * The caller's *profile* pk, distinct from `id` (the user id). It is
   * role-polymorphic — Student pk for students, Teacher pk for teachers,
   * Parent pk for parents — so only read it once `roles` says which one it is.
   * Student-scoped routes (`/students/<student_id>/…`) expect this, not `id`.
   */
  profile_id?: number | null
}

export interface AuthTokens {
  access: string
  refresh: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  tokens: AuthTokens
  user: User
}

export interface ForgotPasswordResponse {
  message: string
  username: string
}

export interface VerifyCodeResponse {
  token: string
}

export interface ChangePasswordRequest {
  token: string
  new_password: string
}
