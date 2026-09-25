// Booking price rules, shared by the server (source of truth) and the booking pages.

/** VAT charged on customer (online) bookings */
export const VAT_RATE = 0.03
/** Share of the total paid up front for a PARTIAL (deposit) payment */
export const DEPOSIT_RATE = 0.5

export type PaymentType = 'FULL' | 'PARTIAL'

const DAY_MS = 24 * 60 * 60 * 1000

export function countNights(checkIn: Date, checkOut: Date): number {
  return Math.ceil((checkOut.getTime() - checkIn.getTime()) / DAY_MS)
}

export interface BookingPriceInput {
  /** Rooms and camping blocks for the whole stay */
  accommodationTotal: number
  addOnsTotal: number
  /** Percentage off the accommodation (0-100); staff only */
  discountPercent?: number
  /** Fixed amount off the accommodation; takes precedence over the percentage; staff only */
  discountAmount?: number
  /** Customer bookings include VAT; bookings made by staff don't */
  includeVat: boolean
}

/**
 * Total price of a booking. Discounts apply to the accommodation only, add-ons are
 * added after the discount, VAT (customer bookings) is charged on the result.
 */
export function calculateBookingTotal({
  accommodationTotal,
  addOnsTotal,
  discountPercent = 0,
  discountAmount = 0,
  includeVat,
}: BookingPriceInput): number {
  let accommodation = accommodationTotal
  if (discountAmount > 0) accommodation -= discountAmount
  else if (discountPercent > 0) accommodation -= (accommodationTotal * discountPercent) / 100

  const subtotal = accommodation + addOnsTotal
  const vat = includeVat ? Math.round(subtotal * VAT_RATE) : 0
  return Math.max(0, Math.round(subtotal + vat))
}

/** Amount charged now: the full price, or the deposit for a PARTIAL payment */
export function upfrontAmount(total: number, paymentType: PaymentType): number {
  return paymentType === 'PARTIAL' ? Math.round(total * DEPOSIT_RATE) : total
}
