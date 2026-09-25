import { STAFF_ROLES } from '@/server/auth'
import { apiRoute, created } from '@/server/http'
import { manualBookingSchema } from '@/server/schemas/bookings'
import { createManualBooking } from '@/server/services/bookings'

/** Staff record a booking arranged offline (always CONFIRMED) */
export const POST = apiRoute(
  { access: STAFF_ROLES, body: manualBookingSchema, errorMessage: 'ไม่สามารถสร้างการจองได้' },
  async ({ body, session }) => created(await createManualBooking(body, session))
)
