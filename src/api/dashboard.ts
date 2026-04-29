import api from './client'
import type { DashboardStats } from '@/types/dashboard'

export function getDashboardStatsApi() {
  return api.get<DashboardStats>('/dashboard/stats/')
}
