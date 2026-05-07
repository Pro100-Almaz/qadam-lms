import api from './client'
import type {
  GenerateReportRequest,
  StudentReport,
  StudentReportListItem,
} from '@/types/report'

export async function generateReportApi(
  studentId: number,
  params: GenerateReportRequest,
): Promise<StudentReport> {
  const { data } = await api.post<StudentReport>(
    `/students/${studentId}/reports/generate/`,
    params,
  )
  return data
}

export async function getReportApi(reportId: number): Promise<StudentReport> {
  const { data } = await api.get<StudentReport>(`/reports/${reportId}/`)
  return data
}

export async function getStudentReportsApi(
  studentId: number,
): Promise<StudentReportListItem[]> {
  const { data } = await api.get(
    `/students/${studentId}/reports/`,
  )
  if (Array.isArray(data)) return data
  if (data && Array.isArray(data.results)) return data.results
  return []
}

export async function downloadReportPdfApi(reportId: number): Promise<Blob> {
  const { data } = await api.get(`/reports/${reportId}/pdf/`, {
    responseType: 'blob',
  })
  return data
}
