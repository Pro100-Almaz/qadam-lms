export interface OfferingSummary {
  offering_id: number
  subject_name: string
  class_group: string
  role: string
  lesson_count: number
  student_count: number
  graded_lessons: number
  grading_percentage: number
}

export interface LessonTeacherDashboard {
  offerings: OfferingSummary[]
  summary: {
    total_offerings: number
    total_lessons: number
    total_graded: number
    total_ungraded: number
    grading_percentage: number
  }
}

export interface HomeroomStudentSubject {
  subject_name: string
  average: number | null
  letter_grade: string | null
}

export interface HomeroomStudentPsychState {
  name: string
  score: number
  date: string
}

export interface HomeroomStudent {
  student_id: number
  user_id: number
  full_name: string
  overall_average: number | null
  overall_letter: string | null
  subjects: HomeroomStudentSubject[]
  psychological_state: HomeroomStudentPsychState | null
}

export interface HomeroomTeacherDashboard {
  class_group: string
  class_group_id: number
  student_count: number
  subject_count: number
  students: HomeroomStudent[]
}

export interface PsychologistStats {
  total_records: number
  average_score: number
  records_last_30_days: number
  score_distribution: Record<string, number>
}

export interface PsychRecentState {
  id: number
  student_id: number
  student_name: string
  name: string
  score: number
  comment: string
  added_by: string
  time_added: string
}

export interface PsychAttentionStudent {
  student_id: number
  full_name: string
  low_score_count: number
  average_score: number
}

export interface PsychologistDashboard {
  stats: PsychologistStats
  recent_states: PsychRecentState[]
  students_needing_attention: PsychAttentionStudent[]
}

export interface TeacherDashboardResponse {
  user_id: number
  full_name: string
  roles: string[]
  dashboards: {
    lesson_teacher?: LessonTeacherDashboard
    homeroom_teacher?: HomeroomTeacherDashboard
    psychologist?: PsychologistDashboard
  }
}

export interface PsychStudentHistoryEntry {
  id: number
  name: string
  score: number
  comment: string
  added_by: string
  time_added: string
}

export interface PsychStudentDetail {
  student_id: number
  full_name: string
  total_records: number
  average_score: number
  history: PsychStudentHistoryEntry[]
}

export interface TeacherClassSubject {
  offering_id: number
  subject_name: string
  role: string
}

export interface TeacherClassGroup {
  class_group_id: number
  display_name: string
  grade_level: number
  letter: string
  student_count: number
  subjects: TeacherClassSubject[]
  is_homeroom: boolean
}

export interface ClassStudentSubject {
  offering_id: number
  subject_name: string
  average: number | null
  letter_grade: string | null
  lesson_count: number
}

export interface ClassStudentPsychState {
  name: string
  score: number
}

export interface ClassStudent {
  student_id: number
  user_id: number
  full_name: string
  avatar: string | null
  overall_average: number | null
  overall_letter: string | null
  subjects: ClassStudentSubject[]
  psychological_state: ClassStudentPsychState | null
}

export interface ClassStudentsResponse {
  class_group_id: number
  class_group: string
  student_count: number
  subject_count: number
  students: ClassStudent[]
}

export interface WorkloadSubject {
  subject_name: string
  class_group: string
  lessons_this_week: number
  grading_complete: boolean
}

export interface TeacherWorkload {
  teacher_id: number
  period: string
  lessons_taught: number
  lessons_upcoming: number
  lessons_without_topics: number
  grading_completion: {
    total_lessons_to_grade: number
    fully_graded: number
    partially_graded: number
    ungraded: number
    completion_percentage: number
  }
  subjects: WorkloadSubject[]
}
