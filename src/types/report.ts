export type ReportLanguage = 'ru' | 'kk' | 'en'
export type ReportStatus = 'pending' | 'generating' | 'completed' | 'failed'

export interface GenerateReportRequest {
  language: ReportLanguage
  quarter: number
}

export interface SubjectAnalysis {
  subject: string
  grade_percentage: number
  class_average: number
  trend: 'improving' | 'declining' | 'stable'
  analysis: string
  recommendation: string
}

export interface ReportData {
  summary: string
  overall_assessment: {
    score_label: string
    description: string
  }
  academic_performance: {
    overview: string
    subject_analyses: SubjectAnalysis[]
  }
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
