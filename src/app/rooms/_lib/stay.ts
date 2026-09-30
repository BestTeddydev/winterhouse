// Pure helpers for the rooms page: prices, availability and locks for the selected stay.
import type { IRoom } from '@/models/Room'
import { formatPrice, getDayType, getDayTypeLabel, getRoomPriceForDate, parseLocalDate } from '@/lib/pricing'
import type { Room, RoomAvailability, Stay } from './types'

type BookingLike = {
  status?: string
  checkIn: string | Date
  checkOut: string | Date
  roomId?: unknown
  roomIds?: unknown[]
  rooms?: Array<{ roomId?: unknown }>
}

type LockLike = { isActive?: boolean; startDate: string | Date; endDate: string | Date; roomId?: unknown; campingBlockId?: unknown }

const idOf = (value: unknown): string | undefined =>
  value == null ? undefined : String((value as { _id?: unknown })._id ?? value).trim()

/** Check-out date ("YYYY-MM-DD") for a stay, or '' without a check-in */
export function checkOutDate({ checkInDate, nights }: Stay): string {
  if (!checkInDate) return ''
  const checkOut = new Date(checkInDate)
  checkOut.setDate(checkOut.getDate() + nights)
  return checkOut.toISOString().split('T')[0]
}

const overlaps = (start: Date, end: Date, from: string | Date, to: string | Date) => start < new Date(to) && end > new Date(from)

export function bookingIncludesRoom(booking: BookingLike, roomId: string, { includeRoomsArray = true } = {}) {
  if (idOf(booking.roomId) === roomId) return true
  if (booking.roomIds?.some((id) => idOf(id) === roomId)) return true
  return includeRoomsArray && !!booking.rooms?.some((r) => idOf(r.roomId) === roomId)
}

/** Whether a room is free for the whole stay (confirmed bookings only) */
export function isRoomAvailable(room: Room, stay: Stay, bookings: BookingLike[], roomAvailability: RoomAvailability | null) {
  if (!stay.checkInDate) return true
  const start = new Date(stay.checkInDate)
  const end = new Date(checkOutDate(stay))

  // Detailed availability of the room being viewed takes precedence
  if (roomAvailability && roomAvailability.roomId === room.id) {
    return !roomAvailability.bookings.some((b) => overlaps(start, end, b.checkIn, b.checkOut))
  }
  return !bookings.some(
    (b) => b.status === 'CONFIRMED' && bookingIncludesRoom(b, room.id) && overlaps(start, end, b.checkIn, b.checkOut)
  )
}

/** Whether a lock (admin block) covers any night of the stay */
export function isLocked(locks: LockLike[], field: 'roomId' | 'campingBlockId', id: string, stay: Stay) {
  if (!stay.checkInDate || locks.length === 0) return false
  const start = new Date(stay.checkInDate)
  const end = new Date(checkOutDate(stay))
  return locks.some((lock) => lock.isActive && idOf(lock[field]) === id && overlaps(start, end, lock.startDate, lock.endDate))
}

/** Whether the night starting on `date` ("YYYY-MM-DD") is booked for a room (calendar) */
export function isNightBooked(date: string, roomId: string, bookings: BookingLike[], roomAvailability: RoomAvailability | null) {
  const day = new Date(date)
  const booked = bookings.some(
    (b) =>
      ['PENDING', 'CONFIRMED'].includes(b.status ?? '') &&
      bookingIncludesRoom(b, roomId, { includeRoomsArray: false }) &&
      day >= new Date(b.checkIn) &&
      day < new Date(b.checkOut)
  )
  if (booked) return true
  if (roomAvailability?.roomId !== roomId) return false
  const status = roomAvailability.availability[date]
  if (status) return status === 'booked'
  return roomAvailability.bookings.some((b) => day >= new Date(b.checkIn) && day < new Date(b.checkOut))
}

/** Price shown on a room card: the check-in night's price and its day type */
export function roomDisplayPrice(room: Room, checkInDate: string) {
  if (!checkInDate) return { price: room.price, dayType: 'ราคาพื้นฐาน', formattedPrice: formatPrice(room.price) }
  const date = parseLocalDate(checkInDate)
  const price = getRoomPriceForDate(room as unknown as IRoom, date)
  return { price, dayType: getDayTypeLabel(getDayType(date)), formattedPrice: formatPrice(price) }
}

/** Price of a room for every night of the stay */
export function roomStayPrice(room: Room, { checkInDate, nights }: Stay): number {
  if (!checkInDate) return room.price * nights
  const checkIn = parseLocalDate(checkInDate)
  let total = 0
  for (let i = 0; i < nights; i++) {
    const night = new Date(checkIn)
    night.setDate(checkIn.getDate() + i)
    total += getRoomPriceForDate(room as unknown as IRoom, night)
  }
  return total
}

/** Rooms grouped by building name (rooms without a building listed separately) */
export function groupRoomsByBuilding(rooms: Room[]) {
  const grouped: Record<string, { buildingName: string; buildingType?: string; rooms: Room[] }> = {}
  const ungrouped: Room[] = []
  for (const room of rooms) {
    if (!room.buildingName) {
      ungrouped.push(room)
      continue
    }
    grouped[room.buildingName] ??= { buildingName: room.buildingName, buildingType: room.buildingType, rooms: [] }
    grouped[room.buildingName].rooms.push(room)
  }
  return { grouped, ungrouped }
}

/** All images of a room without duplicates (the main image is usually also the first of the list) */
export function roomImages(room: Pick<Room, 'imageUrl' | 'imageUrls'>): string[] {
  return [...new Set([room.imageUrl, ...(room.imageUrls ?? [])].filter(Boolean))]
}

export type RoomMedia = { type: 'image' | 'video'; url: string }

/** What the room gallery shows: the cover photo, then the video clips (so they are seen), then the other photos */
export function roomMedia(room: Pick<Room, 'imageUrl' | 'imageUrls' | 'videoUrls'>): RoomMedia[] {
  const [cover, ...photos] = roomImages(room).map((url): RoomMedia => ({ type: 'image', url }))
  const videos = (room.videoUrls ?? []).map((url): RoomMedia => ({ type: 'video', url }))
  return [...(cover ? [cover] : []), ...videos, ...photos]
}
