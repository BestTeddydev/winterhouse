import type { DashboardStats } from '@/server/services/dashboard'

/** Response of GET /api/admin/dashboard */
export interface AdminDashboardData {
  stats: DashboardStats
  today: { created: any[]; checkIns: any[]; checkOuts: any[]; staying: number }
  rooms: { total: number; active: number }
  addOns: { total: number; active: number }
  attendance: { pending: number; today: number; approvedToday: number }
}
