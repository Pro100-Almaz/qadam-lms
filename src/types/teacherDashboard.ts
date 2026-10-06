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
  academic_year: string
  student_count: number
  subject_count: number
  students: HomeroomStudent[]
}

export interface HomeroomClassOfferingTeacher {
  /** Teacher profile id. */
  id: number
  user_id: number
  full_name: string
  role: string
}

/** One subject taught to the homeroom class, whoever teaches it. */
export interface HomeroomClassOffering {
  id: number
  subject_id: number
  subject_name: string
  subject_language_group: string
  subject_status: string
  max_points: number
  grading_strategy: string
  teachers: HomeroomClassOfferingTeacher[]
}

export interface HomeroomClassStudentSubject extends HomeroomStudentSubject {
  offering_id: number
}

export interface HomeroomClassStudent extends Omit<HomeroomStudent, 'subjects'> {
  subjects: HomeroomClassStudentSubject[]
}

/**
 * `/homeroom/my-class/`: the dashboard's homeroom section plus every offering
 * of the class, sorted by subject name, and an `offering_id` on each grade.
 */
export interface HomeroomClass extends Omit<HomeroomTeacherDashboard, 'students'> {
  offerings: HomeroomClassOffering[]
  students: HomeroomClassStudent[]
}

// ─── /teacher/offerings/ ─────────────────────────────────────────────────────

export interface TeacherOfferingsTeacher {
  id: number
  user_id: number
  full_name: string
  username: string
}

export interface TeacherOfferingsYear {
  id: number
  year: string
}

export interface TeacherOfferingClassGroupDetail {
  id: number
  name: string
  grade_level: number
  letter: string
  academic_year: string
}

/** An offering the caller teaches. Homeroom-only offerings are never listed. */
export interface TeacherOffering {
  id: number
  subject: string
  subject_id: number
  subject_language_group: string
  class_group: string
  class_group_id: number
  class_group_detail: TeacherOfferingClassGroupDetail
  academic_year: string
  academic_year_id: number
  max_points: number
  grading_strategy: string
  teaching_role: string | null
}

export interface TeacherOfferingsResponse {
  teacher: TeacherOfferingsTeacher
  /** `null` when there is no active year; `offerings` is then empty. */
  academic_year: TeacherOfferingsYear | null
  offerings: TeacherOffering[]
  count: number
}

export interface TeacherOfferingsParams {
  /** Academic year id. Defaults to the active year. */
  academic_year?: number
  /**
   * `false` leaves out offerings with no assignments at all. Defaults to
   * `true`. It takes no quarter, category or date filters.
   */
  include_empty?: boolean
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
