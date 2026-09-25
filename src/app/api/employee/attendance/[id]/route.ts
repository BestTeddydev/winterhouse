import { STAFF_ROLES } from '@/server/auth'
import { apiRoute } from '@/server/http'
import { reviewAttendanceSchema } from '@/server/schemas/attendance'
import { reviewAttendance } from '@/server/services/attendance'

/** Approve or reject a check-in */
export const PATCH = apiRoute<{ id: string }, typeof reviewAttendanceSchema>(
  { access: STAFF_ROLES, body: reviewAttendanceSchema, errorMessage: 'ไม่สามารถอัพเดทสถานะการเช็คอินได้' },
  ({ params, body, session }) => reviewAttendance(params.id, body, session)
)
