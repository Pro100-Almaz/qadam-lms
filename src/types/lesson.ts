export interface LessonOffering {
  id: number
  subject_name: string
  class_group_name: string
  academic_year_label: string
}

export interface Subtopic {
  id: number
  title: string
  order: number
  weight: string
  comment_template: string
}

export interface Topic {
  id: number
  title: string
  order: number
  weight: string
  comment_template: string
  subtopics: Subtopic[]
}

export interface Lesson {
  id: number
  title: string
  description: string
  date: string
  order: number
  status: string
  quarter: number
  unit: number
  offering: LessonOffering
  graded_percent: number
  created_at: string
  updated_at: string
}

export interface LessonStudent {
  id: number
  user_id: number
  full_name: string
  username: string
}

export interface TopicGrade {
  grade: number
  comment: string
  comment_selected: boolean
}

export interface StudentGrades {
  grade_total: number
  [topicId: string]: number | TopicGrade
}

export interface LessonDetail {
  id: number
  title: string
  description: string
  date: string
  order: number
  status: string
  quarter: number
  unit: number
  offering: LessonOffering
  topics: Topic[]
  students: LessonStudent[]
  student_grades: Record<string, StudentGrades>
  created_at: string
  updated_at: string
}

export interface CreateLessonRequest {
  offering: number
  title: string
  description?: string
  date: string
  order?: number
  status?: string
  quarter: number
  unit?: number
}

export interface CreateTopicRequest {
  title: string
  comment_template?: string
}

export interface CreateSubtopicRequest {
  parent: number
  title: string
}

export interface UpdateTopicRequest {
  title?: string
  weight?: string
  comment_template?: string
}
