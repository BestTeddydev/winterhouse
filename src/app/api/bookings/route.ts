import { apiRoute, created } from '@/server/http'
import { createBookingSchema, listBookingsQuery } from '@/server/schemas/bookings'
import { createBooking, listBookings } from '@/server/services/bookings'

export const dynamic = 'force-dynamic'

/** Admin/owner: all bookings; customers: their own */
export const GET = apiRoute(
  { access: 'authenticated', query: listBookingsQuery, errorMessage: 'ไม่สามารถดึงข้อมูลการจองได้' },
  ({ query, session }) => listBookings(query, session)
)

export const POST = apiRoute(
  { access: 'authenticated', body: createBookingSchema, errorMessage: 'ไม่สามารถสร้างการจองได้' },
  async ({ body, session }) => created(await createBooking(body, session))
)
