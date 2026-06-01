export type ReportLanguage = 'ru' | 'kz' | 'en'
export type ReportStatus = 'pending' | 'generating' | 'completed' | 'failed'
export type TrendDirection = 'improving' | 'declining' | 'stable' | 'insufficient_data'

export interface GenerateReportRequest {
  language: ReportLanguage
  quarter: number
}

// ─── report_data (AI text only, no numbers) ─────────────────────────────────

export interface ReportData {
  summary: string
  overall_assessment: {
    score_label: string
    description: string
  }
  subject_analyses: Record<string, {
    analysis: string
    recommendation: string
  }>
  strengths: Array<{ area: string; description: string }>
  areas_for_improvement: Array<{
    area: string
    description: string
    suggested_action: string
  }>
  psychological_profile: {
    summary: string
    observations: string[]
    recommendations: string[]
  }
  extracurricular: {
    summary: string
    highlights: string[]
  }
  recommendations: {
    for_teachers: string[]
    for_parents: string[]
    for_student: string[]
  }
  conclusion: string
}

// ─── input_snapshot (database numbers) ───────────────────────────────────────

export interface SubjectGrades {
  q1: number | null
  q2: number | null
  q3: number | null
  q4: number | null
  cumulative: number | null
}

export interface InputSnapshot {
  personal: {
    full_name: string
    class_group: string
    academic_year: string
  }
  grades: {
    subjects: Record<string, SubjectGrades>
    total_quarter_grades: Record<string, string | null>
    student_total_grade: number | null
  }
  trends: Record<string, { direction: TrendDirection; change: number }>
  class_context: Record<string, number>
  psychological_states: { current: unknown[]; recent_changes: unknown[] }
  achievements: unknown[]
  reading: unknown[]
  clubs: unknown[]
}

// ─── Merged subject row for rendering ────────────────────────────────────────

export interface SubjectRow {
  name: string
  q1: number | null
  q2: number | null
  q3: number | null
  q4: number | null
  cumulative: number | null
  classAvg: number | null
  trend: TrendDirection
  trendChange: number
  analysis: string
  recommendation: string
}

// ─── API response types ──────────────────────────────────────────────────────

export interface StudentReport {
  id: number
  student: number
  student_name: string
  class_group: string
  academic_year: number
  academic_year_label: string
  quarter: number
  language: ReportLanguage
  status: ReportStatus
  report_data: ReportData | null
  input_snapshot: InputSnapshot | null
  tokens_used: number | null
  generation_time_ms: number | null
  generated_by: number | null
  generated_by_name: string | null
  created_at: string
  error_message: string
}

export interface StudentReportListItem {
  id: number
  student_name: string
  quarter: number
  language: ReportLanguage
  status: ReportStatus
  generated_by_name: string | null
  created_at: string
}
