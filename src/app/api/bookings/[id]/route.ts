import { STAFF_ROLES } from '@/server/auth'
import { apiRoute } from '@/server/http'
import { updateBookingSchema } from '@/server/schemas/bookings'
import { getBooking, updateBooking } from '@/server/services/bookings'

export const dynamic = 'force-dynamic'

type Params = { id: string }

export const GET = apiRoute<Params>(
  { access: 'authenticated', errorMessage: 'ไม่สามารถโหลดข้อมูลการจองได้' },
  ({ params, session }) => getBooking(params.id, session)
)

export const PUT = apiRoute<Params, typeof updateBookingSchema>(
  { access: STAFF_ROLES, body: updateBookingSchema, errorMessage: 'ไม่สามารถอัพเดทการจองได้' },
  async ({ params, body }) => ({ message: 'อัพเดทการจองสำเร็จ', booking: await updateBooking(params.id, body) })
)
