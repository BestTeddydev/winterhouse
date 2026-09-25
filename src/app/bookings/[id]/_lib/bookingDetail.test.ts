import { describe, expect, it } from 'vitest'
import { amountDue, detailItems, nextPayment } from './bookingDetail'

describe('booking detail', () => {
  it('lists the current rooms with the price charged for the stay, and camping blocks with guests', () => {
    const items = detailItems({
      rooms: [{ _id: 'r1', name: 'A1', price: 1500, imageUrls: ['a.jpg'] }, null],
      roomPrices: [{ roomId: { _id: 'r1' }, price: 3000 }],
      campingBlocks: [{ _id: 'c1', name: 'B1', minCapacity: 2 }],
      guestCount: 4,
    })
    expect(items.rooms).toEqual([{ id: 'r1', name: 'A1', description: undefined, capacity: undefined, image: 'a.jpg', stayPrice: 3000, nightlyPrice: 1500 }])
    expect(items.campingBlocks).toMatchObject([{ id: 'c1', name: 'B1', guests: 4 }])
  })

  it('owes the total minus what was paid', () => {
    expect(amountDue({ totalPrice: 5000, payment: { paidAmount: 2500 } })).toBe(2500)
    expect(amountDue({ totalPrice: 5000, payment: { paidAmount: 5000, remainingAmount: 0 } })).toBe(0)
    expect(amountDue({ totalPrice: 5000 })).toBe(5000)
  })

  it('offers the next payment step', () => {
    const b = { id: 'b1', status: 'PENDING', totalPrice: 1000, payment: { status: 'PENDING', paidAmount: 0 } }
    expect(nextPayment(b)?.href).toBe('/bookings/b1/payment')
    expect(nextPayment({ ...b, status: 'CANCELLED' })).toBeNull()
    const deposit = { ...b, status: 'CONFIRMED', paymentType: 'PARTIAL', payment: { status: 'COMPLETED', paidAmount: 500 } }
    expect(nextPayment(deposit)?.href).toBe('/bookings/b1/payment-remaining')
    expect(nextPayment({ ...deposit, payment: { status: 'COMPLETED', paidAmount: 1000 } })).toBeNull()
  })
})
