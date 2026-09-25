import { apiRoute } from '@/server/http'
import { upcomingQuery } from '@/server/schemas/dashboard'
import { upcomingBookings } from '@/server/services/dashboard'

export const dynamic = 'force-dynamic'

/** Staff: bookings staying between today and the next `days` days */
export const GET = apiRoute(
  { access: ['ADMIN', 'OWNER'], query: upcomingQuery, errorMessage: 'ไม่สามารถโหลดข้อมูลการจองได้' },
  ({ query }) => upcomingBookings(query.days)
)
