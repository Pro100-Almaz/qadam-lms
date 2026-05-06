import api from './client'
import { type PaginatedResponse } from './client'
import type { Lesson, LessonDetail, CreateLessonRequest, Topic, Subtopic, CreateTopicRequest, CreateSubtopicRequest, UpdateTopicRequest, CalendarLesson } from '@/types/lesson'

export async function getLessonsApi(params?: { class_group?: number | string; subject?: string; quarter?: number | string }) {
  const { data } = await api.get<PaginatedResponse<Lesson>>('/lessons/', { params })
  return { data: data.results }
}

export async function getCalendarLessonsApi(params: {
  start_date: string
  end_date: string
  class_group?: number
  subject?: number
  quarter?: number
  student?: number
}) {
  const { data } = await api.get<CalendarLesson[]>('/calendar/lessons/', { params })
  return { data: Array.isArray(data) ? data : [] }
}

export function getLessonDetailApi(id: number) {
  return api.get<LessonDetail>(`/lessons/${id}/`)
}

export function createLessonApi(data: CreateLessonRequest) {
  return api.post<LessonDetail>('/lessons/', data)
}

export function deleteLessonApi(id: number) {
  return api.delete(`/lessons/${id}/`)
}

// Topics
export function createTopicApi(lessonId: number, data: CreateTopicRequest) {
  return api.post<Topic>(`/lessons/${lessonId}/topics/`, data)
}

export function updateTopicApi(topicId: number, data: UpdateTopicRequest) {
  return api.patch<Topic>(`/topics/${topicId}/`, data)
}

export function deleteTopicApi(topicId: number) {
  return api.delete(`/topics/${topicId}/`)
}

export function distributeTopicWeightsApi(lessonId: number) {
  return api.post<Topic[]>(`/lessons/${lessonId}/topics/distribute-weights/`)
}

// Subtopics
export function createSubtopicApi(lessonId: number, data: CreateSubtopicRequest) {
  return api.post<Subtopic>(`/lessons/${lessonId}/subtopics/`, data)
}

export function updateSubtopicApi(subtopicId: number, data: UpdateTopicRequest) {
  return api.patch<Subtopic>(`/subtopics/${subtopicId}/`, data)
}

export function deleteSubtopicApi(subtopicId: number) {
  return api.delete(`/subtopics/${subtopicId}/`)
}

export function distributeSubtopicWeightsApi(lessonId: number) {
  return api.post<Topic[]>(`/lessons/${lessonId}/subtopics/distribute-weights/`)
}
