export type UserRole =
  | 'admin'
  | 'teacher'
  | 'homeroom_teacher'
  | 'student'
  | 'supervisor'
  | 'principal'
  | 'parent'

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
  role: UserRole
  role_display: string
  primary_group: string
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
