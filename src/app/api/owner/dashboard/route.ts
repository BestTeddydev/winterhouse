import { apiRoute } from '@/server/http'
import { ownerDashboardQuery } from '@/server/schemas/dashboard'
import { ownerDashboard } from '@/server/services/dashboard'

export const dynamic = 'force-dynamic'

/** Stats and the bookings of one day for the owner dashboard */
export const GET = apiRoute(
  { access: ['OWNER', 'ADMIN'], query: ownerDashboardQuery, errorMessage: 'ไม่สามารถโหลดข้อมูลแดชบอร์ดได้' },
  ({ query }) => ownerDashboard(query)
)
