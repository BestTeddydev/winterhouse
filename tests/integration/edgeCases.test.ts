import { afterEach, describe, expect, it, vi } from 'vitest'
import * as checkInRoute from '@/app/api/employee/attendance/checkin/route'
import * as bookingsRoute from '@/app/api/bookings/route'
import * as bookingRoute from '@/app/api/bookings/[id]/route'
import * as buildingRoute from '@/app/api/buildings/[id]/route'
import * as campingBlocksRoute from '@/app/api/camping-blocks/route'
import * as campingBlockRoute from '@/app/api/camping-blocks/[id]/route'
import * as linkBuildingRoute from '@/app/api/rooms/link-building/route'
import * as paymentsRoute from '@/app/api/payments/route'
import * as remainingRoute from '@/app/api/payments/remaining/route'
import * as webhookRoute from '@/app/api/payments/webhook/route'
import Booking from '@/models/Booking'
import Building from '@/models/Building'
import EmployeeAttendance from '@/models/EmployeeAttendance'
import Payment from '@/models/Payment'
import { createBooking, createCampingBlock, createRoom, createUser, day } from '../support/factories'
import { call } from '../support/http'
import { signInAs, stripeMock } from '../support/mocks'

// Cases that are easy to get wrong: money that is charged twice or not at all, double bookings
// from requests arriving at the same time, and data the forms can send but should never accept.

const guest = { guestName: 'Somchai', guestEmail: 's@example.com', guestPhone: '0800000000' }
const stay = (from: number, nights: number) => ({ checkIn: day(from), checkOut: day(from + nights) })

const checkoutEvent = (session: Record<string, unknown>) => ({
  type: 'checkout.session.completed',
  data: { object: { payment_link: null, metadata: {}, ...session } },
})
const deliver = (event: unknown) => {
  stripeMock.constructWebhookEvent.mockReturnValue(event)
  return call(webhookRoute.POST, 'POST', { rawBody: '{}', headers: { 'stripe-signature': 'sig' } })
}

afterEach(() => {
  vi.useRealTimers()
})

describe('payments', () => {
  it('does not mark the balance paid when Stripe re-delivers the deposit event after the guest opened the balance checkout', async () => {
    const customer = await createUser()
    const { booking, payment } = await createBooking(
      { userId: customer._id, status: 'PENDING', paymentType: 'PARTIAL', totalPrice: 3000 },
      { stripeSessionId: 'cs_deposit', status: 'PENDING', paymentType: 'PARTIAL', amount: 1500, totalAmount: 3000 }
    )
    // Stripe sends back the metadata we attached to the checkout
    const depositPaid = checkoutEvent({ id: 'cs_deposit', metadata: { bookingId: booking._id, paymentId: payment._id } })
    await deliver(depositPaid)

    signInAs(customer)
    stripeMock.createCheckoutSession.mockResolvedValueOnce({ id: 'cs_balance', url: 'https://checkout.stripe.test/cs_balance' })
    expect((await call(remainingRoute.POST, 'POST', { body: { bookingId: booking._id } })).status).toBe(200)

    // A late retry of the deposit event (Stripe retries for days), with and without our metadata
    await deliver(depositPaid)
    await deliver(checkoutEvent({ id: 'cs_deposit', metadata: { bookingId: booking._id, paymentId: payment._id, paymentType: 'PARTIAL' } }))

    const stored = await Payment.findById(payment._id)
    expect(stored.paidAmount).toBe(1500)
    expect(stored.remainingAmount).toBe(1500)
    expect(stored.status).not.toBe('COMPLETED')
  })

  it('counts a payment once when Stripe delivers the same event twice at the same time', async () => {
    const { payment } = await createBooking(
      { paymentType: 'PARTIAL', totalPrice: 3000 },
      { stripeSessionId: 'cs_balance', status: 'PROCESSING', paymentType: 'REMAINING', amount: 1500, paidAmount: 1500, totalAmount: 3000 }
    )
    stripeMock.constructWebhookEvent.mockReturnValue(checkoutEvent({ id: 'cs_balance' }))
    const post = () => call(webhookRoute.POST, 'POST', { rawBody: '{}', headers: { 'stripe-signature': 'sig' } })

    await Promise.all([post(), post()])

    expect((await Payment.findById(payment._id)).paidAmount).toBe(3000)
  })

  it('refuses the balance when the deposit itself failed (nothing was paid yet)', async () => {
    const customer = await createUser()
    const { booking } = await createBooking(
      { userId: customer._id, status: 'PENDING', paymentType: 'PARTIAL', totalPrice: 3000 },
      { status: 'FAILED', paymentType: 'PARTIAL', amount: 1500, paidAmount: 0, remainingAmount: 1500, totalAmount: 3000 }
    )
    signInAs(customer)
    // Paying only the "balance" would confirm the booking with half the price paid
    expect((await call(remainingRoute.POST, 'POST', { body: { bookingId: booking._id } })).status).toBe(400)
  })

  it('lets a guest open the balance checkout again after closing it without paying', async () => {
    const customer = await createUser()
    const { booking } = await createBooking(
      { userId: customer._id, paymentType: 'PARTIAL', totalPrice: 3000 },
      { status: 'COMPLETED', paymentType: 'PARTIAL', amount: 1500, paidAmount: 1500, remainingAmount: 1500, totalAmount: 3000 }
    )
    signInAs(customer)
    expect((await call(remainingRoute.POST, 'POST', { body: { bookingId: booking._id } })).status).toBe(200)
    // The guest closed the Stripe page and tries again
    expect((await call(remainingRoute.POST, 'POST', { body: { bookingId: booking._id } })).status).toBe(200)
  })

  it('does not take payment for a cancelled booking', async () => {
    const customer = await createUser()
    const { booking } = await createBooking({ userId: customer._id, status: 'CANCELLED' }, { status: 'PENDING' })
    signInAs(customer)
    expect((await call(paymentsRoute.POST, 'POST', { body: { bookingId: booking._id } })).status).toBe(400)
    expect(stripeMock.createCheckoutSession).not.toHaveBeenCalled()
  })

  it('charges the new balance after staff change the total of a deposit booking', async () => {
    const customer = await createUser()
    const { booking } = await createBooking(
      { userId: customer._id, paymentType: 'PARTIAL', totalPrice: 3000 },
      { status: 'COMPLETED', paymentType: 'PARTIAL', amount: 1500, paidAmount: 1500, remainingAmount: 1500, totalAmount: 3000 }
    )
    signInAs(await createUser({ role: 'ADMIN' }))
    expect((await call(bookingRoute.PUT, 'PUT', { params: { id: booking._id }, body: { totalPrice: 4000 } })).status).toBe(200)

    signInAs(customer)
    await call(remainingRoute.POST, 'POST', { body: { bookingId: booking._id } })
    // 4000 - 1500 already paid = 2500 THB, in satang
    expect(stripeMock.createCheckoutSession).toHaveBeenCalledWith(expect.objectContaining({ amount: 250000 }))
  })
})

describe('bookings', () => {
  it('books one room once for two guests asking at the same time', async () => {
    const room = await createRoom()
    const [a, b] = [await createUser({ email: 'a@example.com' }), await createUser({ email: 'b@example.com' })]
    const book = async (user: typeof a) => {
      signInAs(user)
      return call(bookingsRoute.POST, 'POST', { body: { ...guest, ...stay(10, 2), roomId: room._id } })
    }

    const results = await Promise.all([book(a), book(b)])

    expect(results.map((r) => r.status).sort()).toEqual([201, 409])
    expect(await Booking.countDocuments({ roomId: room._id })).toBe(1)
  })

  it('frees the room for others once a booking is cancelled or moved to other dates', async () => {
    const [room, other] = [await createRoom(), await createRoom({ name: 'Room B' })]
    const customer = await createUser()
    signInAs(customer)
    const first = await call(bookingsRoute.POST, 'POST', { body: { ...guest, ...stay(10, 2), roomId: room._id } })
    const second = await call(bookingsRoute.POST, 'POST', { body: { ...guest, ...stay(10, 2), roomId: other._id } })

    signInAs(await createUser({ role: 'ADMIN' }))
    await call(bookingRoute.PUT, 'PUT', { params: { id: first.body._id }, body: { status: 'CANCELLED' } })
    await call(bookingRoute.PUT, 'PUT', { params: { id: second.body._id }, body: { checkIn: day(20), checkOut: day(22) } })

    signInAs(customer)
    expect((await call(bookingsRoute.POST, 'POST', { body: { ...guest, ...stay(10, 2), roomId: room._id } })).status).toBe(201)
    expect((await call(bookingsRoute.POST, 'POST', { body: { ...guest, ...stay(10, 2), roomId: other._id } })).status).toBe(201)
    // ...but the moved booking holds its new dates (for another guest)
    signInAs(await createUser({ email: 'other@example.com' }))
    expect((await call(bookingsRoute.POST, 'POST', { body: { ...guest, ...stay(21, 1), roomId: other._id } })).status).toBe(409)
  })

  it('does not charge twice for a room listed twice', async () => {
    const room = await createRoom({ price: 1000, pricing: { weekday: 1000, weekend: 1000, holiday: 1000 } })
    signInAs(await createUser())
    const res = await call(bookingsRoute.POST, 'POST', { body: { ...guest, ...stay(10, 1), roomIds: [room._id, room._id] } })
    if (res.status === 201) expect(res.body.totalPrice).toBe(Math.round(1000 * 1.03))
    else expect(res.status).toBe(400)
  })

  it('does not let a camping block listed twice go over its capacity', async () => {
    const block = await createCampingBlock({ minCapacity: 1, maxCapacity: 4 })
    signInAs(await createUser())
    const res = await call(bookingsRoute.POST, 'POST', {
      body: { ...guest, ...stay(10, 1), campingBlockIds: [block._id, block._id], guestCounts: [4, 4] },
    })
    expect(res.status).toBe(400)
  })

  it('treats "today" as the Thai date around midnight', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    const room = await createRoom()
    signInAs(await createUser())
    const book = (checkIn: string, checkOut: string) =>
      call(bookingsRoute.POST, 'POST', { body: { ...guest, checkIn, checkOut, roomId: room._id } })

    // 23:30 on 10 Jan in Thailand (16:30 UTC): the 10th is still today
    vi.setSystemTime(new Date('2030-01-10T16:30:00Z'))
    expect((await book('2030-01-10', '2030-01-11')).status).toBe(201)

    // 00:30 on 11 Jan in Thailand (17:30 UTC on the 10th): the 10th is now in the past
    vi.setSystemTime(new Date('2030-01-10T17:30:00Z'))
    expect((await book('2030-01-10', '2030-01-11')).status).toBe(400)
    expect((await book('2030-01-11', '2030-01-12')).status).toBe(201)
  })

  it('does not let staff move a cancelled booking to a check-out before its check-in', async () => {
    const { booking } = await createBooking({ status: 'CANCELLED', checkIn: day(10), checkOut: day(12) })
    signInAs(await createUser({ role: 'ADMIN' }))
    const res = await call(bookingRoute.PUT, 'PUT', { params: { id: booking._id }, body: { checkIn: day(15) } })
    expect(res.status).toBe(400)
  })
})

describe('employee attendance', () => {
  it('creates one record when check-in is pressed twice quickly', async () => {
    const employee = await createUser({ role: 'EMPLOYEE' })
    signInAs(employee)
    const press = () => call(checkInRoute.POST, 'POST', { body: { location: 'เข้างาน' } })

    const results = await Promise.all([press(), press()])

    expect(results.map((r) => r.status).sort()).toEqual([201, 400])
    expect(await EmployeeAttendance.countDocuments({ employeeId: employee._id })).toBe(1)
  })
})

describe('catalog', () => {
  const block = { name: 'C', description: 'd', imageUrls: ['u'], pricePerPerson: 200 }

  it('refuses camping blocks whose minimum is above their maximum', async () => {
    signInAs(await createUser({ role: 'ADMIN' }))
    const created = await call(campingBlocksRoute.POST, 'POST', { body: { ...block, minCapacity: 5, maxCapacity: 2 } })
    expect(created.status).toBe(400)

    const valid = await call(campingBlocksRoute.POST, 'POST', { body: { ...block, minCapacity: 2, maxCapacity: 4 } })
    const lowered = await call(campingBlockRoute.PUT, 'PUT', { params: { id: valid.body._id }, body: { maxCapacity: 1 } })
    expect(lowered.status).toBe(400)
  })

  it('does not put a room in a deleted building', async () => {
    signInAs(await createUser({ role: 'ADMIN' }))
    const building = await Building.create({ name: 'Old', description: 'd', buildingType: 'accommodation', x: 1, y: 1 })
    await call(buildingRoute.DELETE, 'DELETE', { params: { id: building._id } })
    const room = await createRoom()

    const res = await call(linkBuildingRoute.POST, 'POST', { body: { roomId: room._id, buildingId: building._id } })
    expect(res.status).toBe(404)
  })

  it('refuses to delete a camping spot that still has camping blocks (like buildings with rooms)', async () => {
    signInAs(await createUser({ role: 'ADMIN' }))
    const spot = await Building.create({ name: 'Camp', description: 'd', buildingType: 'camping', x: 1, y: 1 })
    await createCampingBlock({ buildingId: spot._id })

    expect((await call(buildingRoute.DELETE, 'DELETE', { params: { id: spot._id } })).status).toBe(400)
  })
})
