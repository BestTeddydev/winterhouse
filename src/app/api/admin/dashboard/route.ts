import { apiRoute } from '@/server/http'
import { adminDashboard } from '@/server/services/dashboard'

export const dynamic = 'force-dynamic'

/** Everything the admin home page shows, in one request */
export const GET = apiRoute({ access: ['ADMIN', 'OWNER'], errorMessage: 'ไม่สามารถโหลดข้อมูลแดชบอร์ดได้' }, () => adminDashboard())
