// Contract for GET /students/{id}/overview/?quarter=N (backend: qadam-analytics).
// Grade averages are on the 2-5 quarter scale; rates are percentages 0-100.

export type AttentionSeverity = 'warning' | 'critical'

export type AttentionCode =
  | 'low_grade' // a subject at 2 this quarter
  | 'falling_grade' // a subject dropped vs the previous quarter
  | 'absence_streak' // consecutive absences
  | 'low_attendance' // attendance rate below threshold
  | 'overdue_homework' // overdue homework above threshold
  | 'wellbeing_drop' // latest wellbeing score is low or fell

export interface AttentionItem {
  code: AttentionCode
  severity: AttentionSeverity
  subject_id: number | null
  subject_name: string | null
  /** Code-specific numbers for the message, e.g. { from: 4, to: 3 } or { days: 4 }. */
  params: Record<string, number | string>
}

export interface QuarterAverage {
  quarter: number
  average: number | null
  class_average: number | null
}

export interface StudentOverview {
  student_id: number
  quarter: number
  grades: {
    average: number | null
    class_average: number | null
    previous_quarter_average: number | null
    by_quarter: QuarterAverage[]
  }
  attendance: {
    rate: number | null
    class_rate: number | null
    present: number
    late: number
    absent: number
    total: number
  }
  homework: {
    overdue: number
    pending: number
    submitted: number
    total: number
  }
  wellbeing: {
    latest: {
      name: string
      score: number
      time_added: string
    } | null
  }
  attention: AttentionItem[]
}
