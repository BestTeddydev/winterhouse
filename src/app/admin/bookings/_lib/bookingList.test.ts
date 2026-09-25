import { describe, expect, it } from 'vitest'
import { campingSummary, priceBeforeDiscount, roomImage, roomNames } from '@/lib/bookingDisplay'
import { nextStatuses, pageWindow } from './bookingList'

describe('booking list helpers', () => {
  it('names rooms and camping blocks of new and legacy bookings', () => {
    expect(roomNames({ rooms: [{ name: 'A1' }, {}] })).toBe('A1, N/A')
    expect(roomNames({ room: { name: 'A2' } })).toBe('A2')
    expect(roomNames({})).toBeNull()
    expect(roomImage({ rooms: [{ name: 'A1', imageUrls: ['a.jpg'] }] })).toEqual({ src: 'a.jpg', alt: 'A1' })
    expect(campingSummary({ campingBlocks: [{ name: 'C1' }, { name: 'C2', minCapacity: 2 }], guestCounts: [3] })).toBe('C1 (3 คน), C2 (2 คน)')
    expect(campingSummary({ campingBlock: { name: 'C3' }, guestCount: 4 })).toBe('C3 (4 คน)')
    expect(campingSummary({})).toBeNull()
  })

  it('shows the price before a discount', () => {
    expect(priceBeforeDiscount({ totalPrice: 900, discountAmount: 100 })).toBe(1000)
    expect(priceBeforeDiscount({ totalPrice: 900 })).toBeNull()
  })

  it('pages through five numbers around the current page', () => {
    expect(pageWindow(1, 3)).toEqual([1, 2, 3])
    expect(pageWindow(1, 10)).toEqual([1, 2, 3, 4, 5])
    expect(pageWindow(6, 10)).toEqual([4, 5, 6, 7, 8])
    expect(pageWindow(10, 10)).toEqual([6, 7, 8, 9, 10])
  })

  it('offers only valid status changes', () => {
    expect(nextStatuses('PENDING')).toEqual(['CONFIRMED', 'CANCELLED'])
    expect(nextStatuses('CANCELLED')).toEqual([])
  })
})

describe('stay name and image', () => {
  it('falls back to camping blocks for camping-only bookings', async () => {
    const { bookingImage, stayName } = await import('@/lib/bookingDisplay')
    const camping = { campingBlocks: [{ name: 'C1', imageUrls: ['c.jpg'] }], guestCounts: [2] }
    expect(stayName(camping)).toBe('C1 (2 คน)')
    expect(bookingImage(camping)).toEqual({ src: 'c.jpg', alt: 'C1' })
    expect(stayName({ rooms: [{ name: 'A1' }], ...camping })).toBe('A1 • C1 (2 คน)')
    expect(bookingImage({})).toEqual({ src: '/placeholder-room.svg', alt: 'Room' })
  })
})
