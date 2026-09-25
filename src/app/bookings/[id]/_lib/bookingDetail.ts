// What the booking detail page shows, derived from GET /api/bookings/:id
import { countNights } from '@/lib/bookingPrice'

export interface DetailRoom {
  id: string
  name: string
  description?: string
  capacity?: number
  image?: string
  /** Price of this room for the whole stay (when known) */
  stayPrice?: number
  nightlyPrice?: number
}

export interface DetailCampingBlock {
  id: string
  name: string
  description?: string
  image?: string
  guests: number
  pricePerPerson?: number
}

const refId = (ref: any) => String(ref?._id ?? ref)

export function detailItems(booking: any): { rooms: DetailRoom[]; campingBlocks: DetailCampingBlock[] } {
  const prices = new Map<string, number>((booking.roomPrices ?? []).map((r: any) => [refId(r.roomId), r.price]))
  const rooms = (booking.rooms ?? []).filter(Boolean).map((room: any) => ({
    id: refId(room),
    name: room.name ?? 'ห้องพัก',
    description: room.description,
    capacity: room.capacity,
    image: room.imageUrls?.[0],
    stayPrice: prices.get(refId(room)),
    nightlyPrice: room.price,
  }))
  const blocks: any[] = booking.campingBlocks ?? []
  const campingBlocks = blocks.filter(Boolean).map((block, i) => ({
    id: refId(block),
    name: block.name ?? 'บล็อคกางเต๊นท์',
    description: block.description,
    image: block.imageUrls?.[0],
    guests: booking.guestCounts?.[i] || (blocks.length === 1 ? booking.guestCount : undefined) || block.minCapacity || 1,
    pricePerPerson: block.pricePerPerson,
  }))
  return { rooms, campingBlocks }
}

export const stayNights = (booking: { checkIn: string; checkOut: string }) => countNights(new Date(booking.checkIn), new Date(booking.checkOut))

/** What is still to be paid: the total minus what was paid (never negative) */
export const amountDue = (booking: any) => Math.max(0, (booking.totalPrice || 0) - (booking.payment?.paidAmount || 0))

/** Which payment step the guest can take now, if any */
export function nextPayment(booking: any): { href: string; label: string } | null {
  if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') return null
  const paid = booking.payment?.status === 'COMPLETED'
  if (!paid) return { href: `/bookings/${booking.id}/payment`, label: 'ชำระเงิน' }
  if (booking.paymentType === 'PARTIAL' && amountDue(booking) > 0) return { href: `/bookings/${booking.id}/payment-remaining`, label: 'ชำระส่วนที่เหลือ' }
  return null
}
