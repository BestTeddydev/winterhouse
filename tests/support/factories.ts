import AddOn from '@/models/AddOn'
import Booking from '@/models/Booking'
import CampingBlock from '@/models/CampingBlock'
import Payment from '@/models/Payment'
import Room from '@/models/Room'
import User from '@/models/User'
import { newId } from '@/lib/odm'

/** "YYYY-MM-DD" n days from today (Bangkok date) */
export function day(offset: number): string {
  const d = new Date(Date.now() + 7 * 3600_000) // shift to Bangkok before taking the UTC date
  d.setUTCDate(d.getUTCDate() + offset)
  return d.toISOString().slice(0, 10)
}

export const createUser = (overrides: Record<string, unknown> = {}) =>
  User.create({ name: 'Customer', email: 'c@example.com', lineUserId: `U${Math.random()}`, role: 'CUSTOMER', ...overrides })

export const createRoom = (overrides: Record<string, unknown> = {}) =>
  Room.create({
    name: 'Room A',
    description: 'desc',
    imageUrls: ['https://img.test/a.jpg'],
    price: 1000,
    pricing: { weekday: 1000, weekend: 1000, holiday: 1000 },
    capacity: 2,
    isActive: true,
    ...overrides,
  })

export const createCampingBlock = (overrides: Record<string, unknown> = {}) =>
  CampingBlock.create({
    name: 'Block 1',
    description: 'desc',
    imageUrls: ['https://img.test/b.jpg'],
    pricePerPerson: 200,
    minCapacity: 1,
    maxCapacity: 4,
    isActive: true,
    ...overrides,
  })

export const createAddOn = (overrides: Record<string, unknown> = {}) =>
  AddOn.create({ name: 'BBQ', price: 300, unit: 'ชุด', isActive: true, ...overrides })

export async function createBooking(overrides: Record<string, unknown> = {}, paymentOverrides: Record<string, unknown> = {}) {
  const booking = new Booking({
    userId: newId(),
    checkIn: day(10),
    checkOut: day(12),
    totalPrice: 2000,
    guestName: 'Guest',
    guestEmail: 'g@example.com',
    status: 'CONFIRMED',
    paymentType: 'FULL',
    ...overrides,
  })
  const payment = new Payment({
    bookingId: booking._id,
    amount: booking.totalPrice,
    totalAmount: booking.totalPrice,
    paidAmount: 0,
    remainingAmount: 0,
    paymentType: booking.paymentType,
    ...paymentOverrides,
  })
  booking.paymentId = payment._id
  await booking.save()
  await payment.save()
  return { booking, payment }
}
