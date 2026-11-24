import api, { unwrapPaginated, type ListResponse } from './client'
import type { PageParams } from './students'
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

export async function downloadReportPdfApi(reportId: number): Promise<Blob> {
  const { data } = await api.get(`/reports/${reportId}/pdf/`, {
    responseType: 'blob',
  })
  return data
}

export async function getStudentReportsPageApi(studentId: number, params?: PageParams) {
  const { data } = await api.get<ListResponse<StudentReportListItem>>(`/students/${studentId}/reports/`, { params })
  return unwrapPaginated(data)
}
