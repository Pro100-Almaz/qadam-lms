import type { User } from './auth'
import type { Subject } from './subject'
import type { TeachingAssignment } from './teachingAssignment'

export interface Teacher {
  id: number
  user: User
  gender: string
  academic_degree: string
  employment_type: string
  occupation: string
  working_hours: number
}

export type TeacherAssignment = TeachingAssignment

export interface TeacherDetail extends Teacher {
  assignments: TeacherAssignment[]
  subjects: Subject[]
}

export interface UpdateTeacherRequest {
  email?: string
  first_name?: string
  last_name?: string
  phone_number?: string
  date_of_birth?: string
  address?: string
  gender?: string
  academic_degree?: string
  employment_type?: string
  occupation?: string
}
