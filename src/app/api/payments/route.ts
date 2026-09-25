import { apiRoute } from '@/server/http'
import { startPaymentSchema } from '@/server/schemas/payments'
import { startPayment } from '@/server/services/payments'

/** Starts the first payment (full or deposit) of a booking; the amount always comes from the booking */
export const POST = apiRoute(
  { access: 'authenticated', body: startPaymentSchema, errorMessage: 'ไม่สามารถดำเนินการชำระเงินได้' },
  ({ body, session }) => startPayment(body, session)
)
