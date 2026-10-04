import { describe, expect, it } from 'vitest'
import {
  bookingIncludesRoom,
  checkOutDate,
  groupRoomsByBuilding,
  isLocked,
  isNightBooked,
  isRoomAvailable,
  roomImages,
  roomMedia,
  roomStayPrice,
} from './stay'
import type { Room } from './types'

const room = (overrides: Partial<Room> = {}): Room => ({
  id: 'r1',
  name: 'A1',
  description: '',
  imageUrl: 'a.jpg',
  imageUrls: ['a.jpg', 'b.jpg'],
  price: 1000,
  pricing: { weekday: 1000, weekend: 1500, holiday: 2000 },
  capacity: 2,
  amenities: [],
  hotspots: [],
  isActive: true,
  ...overrides,
})

const stay = { checkInDate: '2030-01-10', nights: 2 } // Thu + Fri nights

describe('rooms page stay helpers', () => {
  it('computes the check-out date', () => {
    expect(checkOutDate(stay)).toBe('2030-01-12')
    expect(checkOutDate({ checkInDate: '', nights: 2 })).toBe('')
  })

  it('prices every night of the stay', () => {
    expect(roomStayPrice(room(), stay)).toBe(1000 + 1500)
  })

  it('finds a room in roomId, roomIds or rooms[]', () => {
    expect(bookingIncludesRoom({ roomId: { _id: 'r1' }, checkIn: '', checkOut: '' }, 'r1')).toBe(true)
    expect(bookingIncludesRoom({ roomIds: ['r2', 'r1'], checkIn: '', checkOut: '' }, 'r1')).toBe(true)
    expect(bookingIncludesRoom({ rooms: [{ roomId: 'r1' }], checkIn: '', checkOut: '' }, 'r1')).toBe(true)
    expect(bookingIncludesRoom({ rooms: [{ roomId: 'r1' }], checkIn: '', checkOut: '' }, 'r1', { includeRoomsArray: false })).toBe(false)
  })

  it('treats a room as unavailable only for overlapping confirmed bookings', () => {
    const booking = { roomId: 'r1', status: 'CONFIRMED', checkIn: '2030-01-11', checkOut: '2030-01-13' }
    expect(isRoomAvailable(room(), stay, [booking], null)).toBe(false)
    expect(isRoomAvailable(room(), stay, [{ ...booking, status: 'PENDING' }], null)).toBe(true)
    expect(isRoomAvailable(room(), stay, [{ ...booking, checkIn: '2030-01-12', checkOut: '2030-01-14' }], null)).toBe(true)
  })

  it('checks locks by id and period', () => {
    const lock = { isActive: true, roomId: 'r1', startDate: '2030-01-11', endDate: '2030-01-15' }
    expect(isLocked([lock], 'roomId', 'r1', stay)).toBe(true)
    expect(isLocked([lock], 'roomId', 'r2', stay)).toBe(false)
    expect(isLocked([{ ...lock, isActive: false }], 'roomId', 'r1', stay)).toBe(false)
  })

  it('marks nights booked from bookings or the room availability', () => {
    const bookings = [{ roomId: 'r1', status: 'PENDING', checkIn: '2030-01-10', checkOut: '2030-01-11' }]
    expect(isNightBooked('2030-01-10', 'r1', bookings, null)).toBe(true)
    expect(isNightBooked('2030-01-11', 'r1', bookings, null)).toBe(false) // check-out day
    const availability = { roomId: 'r1', availability: { '2030-01-20': 'booked' as const }, bookings: [] }
    expect(isNightBooked('2030-01-20', 'r1', [], availability)).toBe(true)
  })

  it('groups rooms by building', () => {
    const { grouped, ungrouped } = groupRoomsByBuilding([room({ buildingName: 'B' }), room({ id: 'r2' })])
    expect(Object.keys(grouped)).toEqual(['B'])
    expect(ungrouped.map((r) => r.id)).toEqual(['r2'])
  })

  it('lists buildings in the order set on the site map editor', () => {
    const { grouped } = groupRoomsByBuilding([
      room({ id: 'a', buildingName: 'Late', buildingSortOrder: 2 }),
      room({ id: 'b', buildingName: 'Unordered' }),
      room({ id: 'c', buildingName: 'First', buildingSortOrder: 0 }),
      room({ id: 'd', buildingName: 'Late', buildingSortOrder: 2 }),
    ])
    expect(Object.keys(grouped)).toEqual(['First', 'Late', 'Unordered'])
    expect(grouped.Late.rooms.map((r) => r.id)).toEqual(['a', 'd'])
  })

  it('lists room images once each (gallery index matches thumbnails)', () => {
    expect(roomImages(room())).toEqual(['a.jpg', 'b.jpg'])
  })
})

describe('roomMedia', () => {
  it('shows the cover photo first, then the video clips, then the other photos', () => {
    const media = roomMedia({ imageUrl: 'a.jpg', imageUrls: ['a.jpg', 'b.jpg'], videoUrls: ['tour.mp4'] })
    expect(media).toEqual([
      { type: 'image', url: 'a.jpg' },
      { type: 'video', url: 'tour.mp4' },
      { type: 'image', url: 'b.jpg' },
    ])
  })

  it('is just the photos for rooms without videos', () => {
    expect(roomMedia({ imageUrl: 'a.jpg', imageUrls: ['a.jpg'] })).toEqual([{ type: 'image', url: 'a.jpg' }])
  })
})
