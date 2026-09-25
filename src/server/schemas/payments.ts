import { z } from 'zod'
import { objectId } from './common'

export const startPaymentSchema = z.object({
  bookingId: objectId('Booking ID'),
  paymentMethod: z.string().trim().min(1).default('card'),
})
