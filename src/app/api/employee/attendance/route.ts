import { apiRoute } from '@/server/http'
import { attendanceQuery } from '@/server/schemas/attendance'
import { listAttendance } from '@/server/services/attendance'

export const dynamic = 'force-dynamic'

export const GET = apiRoute(
  { access: 'authenticated', query: attendanceQuery, errorMessage: 'ไม่สามารถดึงข้อมูลการเช็คอินได้' },
  ({ query, session }) => listAttendance(query, session)
)
