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

/** How an add-on is charged: once per booking (BBQ set) or for every night of the stay (extra bed) */
export const ADD_ON_PRICING = ['PER_STAY', 'PER_NIGHT'] as const
export type AddOnPricing = (typeof ADD_ON_PRICING)[number]

export const ADD_ON_PRICING_LABELS: Record<AddOnPricing, string> = {
  PER_STAY: 'ครั้งเดียวต่อการจอง',
  PER_NIGHT: 'ต่อคืน',
}

/** Price of a booked add-on; add-ons without a pricing mode (older bookings) are charged once */
export function addOnTotal(addOn: { price: number; quantity: number; pricing?: string }, nights: number): number {
  return addOn.price * addOn.quantity * (addOn.pricing === 'PER_NIGHT' ? nights : 1)
}

export const addOnsTotal = (addOns: Array<{ price: number; quantity: number; pricing?: string }>, nights: number) =>
  addOns.reduce((sum, addOn) => sum + addOnTotal(addOn, nights), 0)

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
  // A discount larger than the stay makes the stay free, but the add-ons are still charged
  accommodation = Math.max(0, accommodation)

  const subtotal = accommodation + addOnsTotal
  const vat = includeVat ? Math.round(subtotal * VAT_RATE) : 0
  return Math.max(0, Math.round(subtotal + vat))
}

/** Amount charged now: the full price, or the deposit for a PARTIAL payment */
export function upfrontAmount(total: number, paymentType: PaymentType): number {
  return paymentType === 'PARTIAL' ? Math.round(total * DEPOSIT_RATE) : total
}
