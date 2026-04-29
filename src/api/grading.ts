import api from './client'
import type { GradingData, SubmitGradingRequest } from '@/types/grading'

export function getGradingApi(lessonId: number) {
  return api.get<GradingData>(`/lessons/${lessonId}/grading/`)
}

export function submitGradingApi(lessonId: number, data: SubmitGradingRequest) {
  return api.post<{ detail: string }>(`/lessons/${lessonId}/grading/`, data)
}

export function updateGradingApi(lessonId: number, data: SubmitGradingRequest) {
  return api.patch<{ detail: string }>(`/lessons/${lessonId}/grading/`, data)
}

export function deleteStudentGradingApi(lessonId: number, studentUserId: number) {
  return api.delete(`/lessons/${lessonId}/grading/${studentUserId}/`)
}
