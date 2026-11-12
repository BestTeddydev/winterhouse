import { describe, expect, it } from 'vitest'
import { bookingQuery, parseBookingRequest } from './bookingRequest'
import { separateBookings, unpaidBookingOf, withBooking, withoutItem, type StayBooking } from './sameStay'

const request = { roomIds: ['a4'], campingBlocks: [], checkIn: '2026-12-06', checkOut: '2026-12-07' }
const booking = (overrides: Partial<StayBooking> = {}): StayBooking => ({
  id: 'b1',
  status: 'PENDING',
  checkIn: '2026-12-06T00:00:00.000Z',
  checkOut: '2026-12-07T00:00:00.000Z',
  payment: { status: 'PENDING', paidAmount: 0 },
  rooms: [{ _id: 'a3', name: 'A3' }],
  ...overrides,
})

describe('the unpaid booking of the stay', () => {
  it('is the newest unpaid booking the guest made that overlaps the stay', () => {
    expect(unpaidBookingOf([booking()], request)?.id).toBe('b1')
    expect(unpaidBookingOf([booking({ checkOut: '2026-12-08T00:00:00.000Z' })], request)?.id).toBe('b1') // other dates: changed
    expect(unpaidBookingOf([booking({ checkIn: '2026-12-07T00:00:00.000Z', checkOut: '2026-12-08T00:00:00.000Z' })], request)).toBeNull()
    expect(unpaidBookingOf([booking({ id: 'new' }), booking({ id: 'old' })], request)?.id).toBe('new')
  })

  it('is never a paid booking, a cancelled one or one made by staff', () => {
    expect(unpaidBookingOf([booking({ status: 'CONFIRMED' })], request)).toBeNull()
    expect(unpaidBookingOf([booking({ status: 'CANCELLED' })], request)).toBeNull()
    expect(unpaidBookingOf([booking({ payment: { status: 'PROCESSING', paidAmount: 100 } })], request)).toBeNull()
    expect(unpaidBookingOf([booking({ createdBy: 'admin' })], request)).toBeNull()
    // Added to it, then it got paid (e.g. in another tab)
    expect(unpaidBookingOf([booking({ status: 'CONFIRMED' })], { ...request, addTo: 'b1' })).toBeNull()
  })

  it('leaves the other bookings of the stay separate', () => {
    const paid = booking({ id: 'paid', status: 'CONFIRMED' })
    const list = [booking(), paid, booking({ id: 'gone', status: 'CANCELLED' })]
    expect(separateBookings(list, request, unpaidBookingOf(list, request)).map((b) => b.id)).toEqual(['paid'])
  })
})

describe('changing the selection', () => {
  it('keeps the unpaid booking\'s rooms and blocks next to the new ones', () => {
    const next = withBooking(
      { ...request, campingBlocks: [{ id: 'c1', guests: 3 }] },
      booking({ campingBlocks: [{ _id: 'c1' }, { _id: 'c2' }], guestCounts: [2, 4] })
    )
    expect(next).toEqual({
      ...request,
      roomIds: ['a3', 'a4'],
      campingBlocks: [{ id: 'c1', guests: 3 }, { id: 'c2', guests: 4 }],
      addTo: 'b1',
    })
  })

  it('removes one room or block and round-trips through the URL', () => {
    const next = withoutItem({ ...request, roomIds: ['a3', 'a4'], addTo: '6af5cfdccd806d5172d087df' }, 'room', 'a3')
    expect(next.roomIds).toEqual(['a4'])
    const blocks = { ...request, campingBlocks: [{ id: 'c1', guests: 2 }, { id: 'c2' }] }
    expect(parseBookingRequest(new URLSearchParams(bookingQuery(next)))).toEqual({ request: next })
    expect(parseBookingRequest(new URLSearchParams(bookingQuery(blocks)))).toEqual({ request: blocks })
  })
})
