import Booking from '@/models/Booking'
import CampingBlockBlock from '@/models/CampingBlockBlock'
import RoomBlock from '@/models/RoomBlock'
import { conflict } from '../errors'

/**
 * A PENDING booking holds its rooms while the guest is paying. Without this, two guests could
 * both reserve and pay for the same room. Stripe Checkout sessions expire after the same time.
 */
export const PAYMENT_HOLD_MINUTES = 30

export interface StayRange {
  checkIn: Date
  checkOut: Date
}

interface Options {
  /** Booking being edited or confirmed (it doesn't conflict with itself) */
  excludeBookingId?: string
  now?: Date
}

type BookingRefs = {
  _id: string
  status: string
  checkIn?: Date
  checkOut?: Date
  createdAt?: Date
  roomId?: string
  roomIds?: string[]
  rooms?: Array<{ roomId?: string }>
  campingBlockId?: string
  campingBlockIds?: string[]
}

const asId = (value: unknown) => (value == null ? undefined : String((value as { _id?: unknown })._id ?? value))

export function bookingRoomIds(booking: BookingRefs): string[] {
  const ids = [booking.roomId, ...(booking.roomIds ?? []), ...(booking.rooms ?? []).map((r) => r.roomId)]
  return [...new Set(ids.map(asId).filter((id): id is string => !!id))]
}

export function bookingCampingBlockIds(booking: BookingRefs): string[] {
  const ids = [booking.campingBlockId, ...(booking.campingBlockIds ?? [])]
  return [...new Set(ids.map(asId).filter((id): id is string => !!id))]
}

/** Two stays overlap when each starts before the other ends (check-out day is free) */
export function overlapFilter({ checkIn, checkOut }: StayRange) {
  return { $and: [{ checkIn: { $lt: checkOut } }, { checkOut: { $gt: checkIn } }] }
}

/** Bookings overlapping the stay that occupy their rooms/blocks: confirmed ones and fresh pending ones */
export async function findOccupyingBookings(range: StayRange, { excludeBookingId, now = new Date() }: Options = {}) {
  const holdStart = now.getTime() - PAYMENT_HOLD_MINUTES * 60_000
  const bookings: BookingRefs[] = await Booking.find({
    status: { $in: ['CONFIRMED', 'PENDING'] },
    ...overlapFilter(range),
  })
    .select('_id status checkIn checkOut createdAt roomId roomIds rooms campingBlockId campingBlockIds')
    .lean()

  return bookings.filter(
    (b) =>
      b._id !== excludeBookingId &&
      (b.status === 'CONFIRMED' || (b.createdAt !== undefined && new Date(b.createdAt).getTime() > holdStart))
  )
}

interface Inventory {
  rooms?: Array<{ _id: string; name?: string }>
  campingBlocks?: Array<{ _id: string; name?: string }>
}

/** Throws 409 when any room or camping block is booked or locked by an admin during the stay */
export async function assertAvailable({ rooms = [], campingBlocks = [] }: Inventory, range: StayRange, options: Options = {}) {
  if (rooms.length === 0 && campingBlocks.length === 0) return
  const lockOverlap = { $and: [{ startDate: { $lt: range.checkOut } }, { endDate: { $gt: range.checkIn } }] }

  const [bookings, roomLocks, blockLocks] = await Promise.all([
    findOccupyingBookings(range, options),
    rooms.length
      ? RoomBlock.find({ roomId: { $in: rooms.map((r) => r._id) }, isActive: true, ...lockOverlap }).lean()
      : Promise.resolve([]),
    campingBlocks.length
      ? CampingBlockBlock.find({ campingBlockId: { $in: campingBlocks.map((b) => b._id) }, isActive: true, ...lockOverlap }).lean()
      : Promise.resolve([]),
  ])

  const reasonSuffix = (lock?: { reason?: string }) => (lock?.reason ? ` (${lock.reason})` : '')

  for (const room of rooms) {
    if (bookings.some((b) => bookingRoomIds(b).includes(room._id))) {
      throw conflict(`ห้องพัก ${room.name ?? room._id} ไม่ว่างในวันที่เลือก`)
    }
    const lock = roomLocks.find((l: { roomId: string }) => String(l.roomId) === room._id)
    if (lock) throw conflict(`ห้องพัก ${room.name ?? room._id} ถูกล็อคไม่ให้จองในช่วงวันที่เลือก${reasonSuffix(lock)}`)
  }

  for (const block of campingBlocks) {
    if (bookings.some((b) => bookingCampingBlockIds(b).includes(block._id))) {
      throw conflict(`บล็อคกางเต๊นท์ ${block.name ?? block._id} ไม่ว่างในวันที่เลือก`)
    }
    const lock = blockLocks.find((l: { campingBlockId: string }) => String(l.campingBlockId) === block._id)
    if (lock) throw conflict(`บล็อคกางเต๊นท์ ${block.name ?? block._id} ถูกล็อคไม่ให้จองในช่วงวันที่เลือก${reasonSuffix(lock)}`)
  }
}

const toKey = (d: Date) => d.toISOString().split('T')[0]

/** Day-by-day availability of one room ("YYYY-MM-DD" -> available/booked) for the availability calendar */
export async function getRoomAvailability(roomId: string, from: Date, to: Date) {
  const range = { checkIn: from, checkOut: to }
  const [bookings, locks] = await Promise.all([
    findOccupyingBookings(range),
    RoomBlock.find({
      roomId,
      isActive: true,
      $and: [{ startDate: { $lt: to } }, { endDate: { $gt: from } }],
    })
      .select('startDate endDate')
      .lean(),
  ])
  const roomBookings = bookings.filter((b) => bookingRoomIds(b).includes(roomId))

  const availability: Record<string, 'available' | 'booked'> = {}
  for (const day = new Date(from); day < to; day.setDate(day.getDate() + 1)) availability[toKey(day)] = 'available'

  const markBooked = (start: Date, end: Date) => {
    // Nights from start to end; the end (check-out) day stays available
    for (const day = new Date(start); day < new Date(end); day.setDate(day.getDate() + 1)) {
      const key = toKey(day)
      if (key in availability) availability[key] = 'booked'
    }
  }

  roomBookings.forEach((b) => markBooked(b.checkIn!, b.checkOut!))
  locks.forEach((l: { startDate: Date; endDate: Date }) => markBooked(l.startDate, l.endDate))

  return {
    availability,
    bookings: roomBookings.map((b) => ({ id: b._id, checkIn: b.checkIn, checkOut: b.checkOut, status: b.status })),
  }
}
