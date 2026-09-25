import { apiRoute } from '@/server/http'
import { startPaymentSchema } from '@/server/schemas/payments'
import { startRemainingPayment } from '@/server/services/payments'

/** Pays the outstanding balance of a deposit (PARTIAL) booking */
export const POST = apiRoute(
  { access: 'authenticated', body: startPaymentSchema, errorMessage: 'ไม่สามารถดำเนินการชำระเงินได้' },
  ({ body, session }) => startRemainingPayment(body, session)
)
