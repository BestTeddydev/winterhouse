// The guest's other bookings of the same stay. Until a booking is paid, everything the guest books
// for that stay goes into it (one booking, one payment); paid bookings stay as they are and new
// rooms become a separate booking.
import type { BookingRequest } from './bookingRequest'

type Item = { _id?: string; id?: string; name?: string }

export interface StayBooking {
  id: string
  status: string
  checkIn: string
  checkOut: string
  createdBy?: string | null
  isManualBooking?: boolean
  payment?: { status?: string; paidAmount?: number }
  rooms?: Item[]
  campingBlocks?: Item[]
  guestCounts?: number[]
  guestCount?: number
  guestName?: string
  guestEmail?: string
  guestPhone?: string
  specialRequests?: string
  paymentType?: string
  addOns?: Array<{ addOnId: string; name: string; price: number; quantity: number; unit?: string; pricing?: 'PER_STAY' | 'PER_NIGHT' }>
}

const day = (date: string) => new Date(date).toISOString().slice(0, 10)
const idOf = (item: Item) => String(item._id ?? item.id)

const overlaps = (b: StayBooking, request: BookingRequest) => day(b.checkIn) < request.checkOut && day(b.checkOut) > request.checkIn

/** Made by the guest, pending and nothing paid yet: it can still take other rooms or dates */
export const isUnpaid = (b: StayBooking) =>
  b.status === 'PENDING' && !b.createdBy && !b.isManualBooking && b.payment?.status !== 'COMPLETED' && !((b.payment?.paidAmount ?? 0) > 0)

export const sameDates = (b: StayBooking, request: BookingRequest) => day(b.checkIn) === request.checkIn && day(b.checkOut) === request.checkOut

/**
 * The unpaid booking of this stay that the request goes into: the one it is already added to, or
 * the newest overlapping one (`bookings` newest first, as the API lists them). The server picks
 * the same one.
 */
export function unpaidBookingOf(bookings: StayBooking[], request: BookingRequest): StayBooking | null {
  const booking = request.addTo ? bookings.find((b) => b.id === request.addTo) : bookings.find((b) => isUnpaid(b) && overlaps(b, request))
  return booking && isUnpaid(booking) ? booking : null
}

/** The guest's other bookings (not cancelled) overlapping the stay: paid ones, booked separately */
export const separateBookings = (bookings: StayBooking[], request: BookingRequest, unpaid: StayBooking | null) =>
  bookings.filter((b) => b.id !== unpaid?.id && b.status !== 'CANCELLED' && overlaps(b, request))

/** The request with the booking's rooms/blocks added (the guest counts just chosen win), going into that booking */
export function withBooking(request: BookingRequest, b: StayBooking): BookingRequest {
  const roomIds = [...new Set([...(b.rooms ?? []).map(idOf), ...request.roomIds])]
  const blocks = new Map<string, number | undefined>((b.campingBlocks ?? []).map((block, i) => [idOf(block), b.guestCounts?.[i] ?? b.guestCount]))
  for (const { id, guests } of request.campingBlocks) blocks.set(id, guests ?? blocks.get(id))
  return { ...request, roomIds, campingBlocks: [...blocks].map(([id, guests]) => ({ id, guests })), addTo: b.id }
}

/** The request without one room or camping block */
export const withoutItem = (request: BookingRequest, kind: 'room' | 'block', id: string): BookingRequest =>
  kind === 'room'
    ? { ...request, roomIds: request.roomIds.filter((r) => r !== id) }
    : { ...request, campingBlocks: request.campingBlocks.filter((c) => c.id !== id) }

/** "A3, B1": what a booking holds */
export const stayItems = (b: StayBooking) => [...(b.rooms ?? []), ...(b.campingBlocks ?? [])].map((item) => item.name).filter(Boolean).join(', ')
