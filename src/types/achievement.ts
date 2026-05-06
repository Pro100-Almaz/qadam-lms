export interface Attachment {
  id: number
  file: string
  file_type: string
  original_name: string
  created_at: string
}

export type AchievementCategory = 'olympiad' | 'additional_education' | 'extracurricular' | 'project'

export interface Achievement {
  id: number
  student: { id: number; full_name: string }
  academic_year: string
  category: AchievementCategory
  subject_name: string | null
  award_type: string
  place: string
  role: string
  duration: string
  description: string
  certificate: string | null
  attachments: Attachment[]
  created_at: string
  updated_at: string
}

export interface CreateAchievementRequest {
  academic_year: number
  category: AchievementCategory
  subject?: number
  award_type?: string
  place?: string
  role?: string
  duration?: string
  description?: string
}

export interface ReadingEntry {
  id: number
  student: { id: number; full_name: string }
  academic_year: string
  title: string
  cover: string | null
  month: number
  pages_read: number
  test_score: number | null
  created_at: string
}

export interface CreateReadingEntryRequest {
  academic_year: number
  title: string
  month: number
  pages_read?: number
  test_score?: number | null
}

export interface ClubEntry {
  id: number
  student: { id: number; full_name: string }
  academic_year: string
  month: number
  club_name: string
  plan: string
  criteria: string
  total_sessions: number
  attended_sessions: number
  comments: string
  attachments: Attachment[]
  created_at: string
}

export interface CreateClubEntryRequest {
  academic_year: number
  month: number
  club_name: string
  plan?: string
  criteria?: string
  total_sessions?: number
  attended_sessions?: number
  comments?: string
}
