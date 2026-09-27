import Booking from '@/models/Booking'
import CampingBlockBlock from '@/models/CampingBlockBlock'
import RoomBlock from '@/models/RoomBlock'
import { conflict } from '../errors'
import { claimKeys } from './claims'

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

/** "YYYY-MM-DD" of each night of the stay (stay dates are UTC midnight of the Thai date) */
function stayNights({ checkIn, checkOut }: StayRange): string[] {
  const nights: string[] = []
  for (const day = new Date(`${toKey(checkIn)}T00:00:00Z`); toKey(day) < toKey(checkOut); day.setUTCDate(day.getUTCDate() + 1)) {
    nights.push(toKey(day))
  }
  return nights
}

// Claim keys: "room_<id>_<night>" / "block_<id>_<night>"
const nightKeys = (kind: 'room' | 'block', ids: string[], range: StayRange) =>
  ids.flatMap((id) => stayNights(range).map((night) => `${kind}_${id}_${night}`))

/** Whether a booking still occupies the room/block night of a claim key */
async function bookingHolds(bookingId: string, key: string, now = new Date()) {
  const [kind, id, night] = key.split('_')
  const booking: BookingRefs | null = await Booking.findById(bookingId).lean()
  if (!booking) return 'unknown' as const
  const holdStart = now.getTime() - PAYMENT_HOLD_MINUTES * 60_000
  const active =
    booking.status === 'CONFIRMED' ||
    (booking.status === 'PENDING' && booking.createdAt !== undefined && new Date(booking.createdAt).getTime() > holdStart)
  const ids = kind === 'room' ? bookingRoomIds(booking) : bookingCampingBlockIds(booking)
  const inStay = !!booking.checkIn && !!booking.checkOut && night >= toKey(booking.checkIn) && night < toKey(booking.checkOut)
  return active && ids.includes(id) && inStay ? ('held' as const) : ('released' as const)
}

/**
 * Reserves the rooms/blocks for every night of the stay for `bookingId`, atomically, just before
 * the booking is saved. Two requests for the same room and night can pass `assertAvailable` at the
 * same moment; only one of them can claim it. Throws 409 for the other.
 */
export async function claimStay(bookingId: string, { rooms = [], campingBlocks = [] }: Inventory, range: StayRange) {
  const keys = [
    ...nightKeys('room', rooms.map((r) => String(r._id)), range),
    ...nightKeys('block', campingBlocks.map((b) => String(b._id)), range),
  ]
  const taken = await claimKeys(keys, String(bookingId), bookingHolds)
  if (!taken) return
  const [kind, id] = taken.split('_')
  const item = kind === 'room' ? rooms.find((r) => String(r._id) === id) : campingBlocks.find((b) => String(b._id) === id)
  throw conflict(`${kind === 'room' ? 'ห้องพัก' : 'บล็อคกางเต๊นท์'} ${item?.name ?? id} ไม่ว่างในวันที่เลือก`)
}

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

/**
 * Confirmed stays that haven't ended yet (dates and rooms/blocks only, no guest data),
 * used by the public room and site map pages to show availability.
 */
export async function listPublicStays() {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const bookings = await Booking.find({ status: 'CONFIRMED', checkOut: { $gt: yesterday } })
    .select('roomId roomIds rooms campingBlockId campingBlockIds checkIn checkOut status')
    .lean()
  return bookings.map((booking: { _id: string }) => ({ ...booking, id: booking._id }))
}
