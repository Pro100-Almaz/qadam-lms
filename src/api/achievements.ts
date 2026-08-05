import api from './client'
import { type ListResponse, unwrapList } from './client'
import type {
  Achievement,
  CreateAchievementRequest,
  ReadingEntry,
  CreateReadingEntryRequest,
  Attachment,
} from '@/types/achievement'

// ─── Achievements ──────────────────────────────────────────────────────────────

export async function getAchievementsApi(studentPk: number, params?: { year?: number; category?: string }) {
  const { data } = await api.get<ListResponse<Achievement>>(`/students/${studentPk}/achievements/`, { params })
  return { data: unwrapList(data) }
}

export function createAchievementApi(studentPk: number, data: CreateAchievementRequest | FormData) {
  const isFormData = data instanceof FormData
  return api.post<Achievement>(`/students/${studentPk}/achievements/`, data, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
  })
}

export function updateAchievementApi(id: number, data: Partial<CreateAchievementRequest> | FormData) {
  const isFormData = data instanceof FormData
  return api.patch<Achievement>(`/achievements/${id}/`, data, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
  })
}

export function deleteAchievementApi(id: number) {
  return api.delete(`/achievements/${id}/`)
}

export function downloadAchievementCertificateApi(id: number) {
  return api.get(`/achievements/${id}/download/`, { responseType: 'blob' })
}

// ─── Reading Entries ───────────────────────────────────────────────────────────

export async function getReadingEntriesApi(studentPk: number, params?: { year?: number; month?: number }) {
  const { data } = await api.get<ListResponse<ReadingEntry>>(`/students/${studentPk}/reading-entries/`, { params })
  return { data: unwrapList(data) }
}

export function createReadingEntryApi(studentPk: number, data: CreateReadingEntryRequest | FormData) {
  const isFormData = data instanceof FormData
  return api.post<ReadingEntry>(`/students/${studentPk}/reading-entries/`, data, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
  })
}

export function updateReadingEntryApi(id: number, data: Partial<CreateReadingEntryRequest> | FormData) {
  const isFormData = data instanceof FormData
  return api.patch<ReadingEntry>(`/reading-entries/${id}/`, data, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
  })
}

export function deleteReadingEntryApi(id: number) {
  return api.delete(`/reading-entries/${id}/`)
}

// ─── Attachments ──────────────────────────────────────────────────────────────

export function uploadAttachmentsApi(entryType: string, entryId: number, files: File[]) {
  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))
  return api.post<Attachment[]>(`/attachments/${entryType}/${entryId}/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function deleteAttachmentApi(attachmentId: number) {
  return api.delete(`/attachments/${attachmentId}/`)
}
