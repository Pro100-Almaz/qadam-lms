import api from './client'
import type { Notification } from '@/types/notification'

interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export async function getNotificationsApi(page?: number) {
  const params = page ? { page } : undefined
  const { data } = await api.get<PaginatedResponse<Notification>>('/notifications/', { params })
  return { data: data.results, count: data.count, next: data.next }
}

export function getNotificationApi(id: number) {
  return api.get<Notification>(`/notifications/${id}/`)
}

export function getNotificationCountApi() {
  return api.get<{ count: number }>('/notifications/count/')
}

export function deleteNotificationApi(id: number) {
  return api.delete(`/notifications/${id}/delete/`)
}
