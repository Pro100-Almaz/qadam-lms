import type { Topic, LessonStudent } from './lesson'

export interface GradingData {
  id: number
  title: string
  quarter: number
  unit: number
  status: string
  topics: Topic[]
  students: LessonStudent[]
  topic_grade_map: Record<string, { grade: number; comment: string; comment_selected: boolean }>
  student_grades: Record<string, number>
  merged_comment_map: Record<string, string>
  selected_comments_map: Record<string, string>
  comment_templates: Record<string, string>
  comment_modes: Record<string, string | null>
}

export interface TopicGradeInput {
  covered: boolean
  comment: string
  comment_selected: boolean
}

export interface SubmitGradingRequest {
  student_id: number
  comment_mode: 'merged' | 'selected' | 'none'
  topics: Record<string, TopicGradeInput>
  subtopics: Record<string, TopicGradeInput>
}
