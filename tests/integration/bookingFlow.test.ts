import { describe, expect, it } from 'vitest'
import * as bookingsRoute from '@/app/api/bookings/route'
import * as bookingRoute from '@/app/api/bookings/[id]/route'
import * as paymentsRoute from '@/app/api/payments/route'
import * as webhookRoute from '@/app/api/payments/webhook/route'
import Booking from '@/models/Booking'
import Payment from '@/models/Payment'
import { createAddOn, createBooking, createRoom, createUser, day } from '../support/factories'
import { call } from '../support/http'
import { signInAs, stripeMock } from '../support/mocks'

// A customer's booking from the booking form to the paid stay: one booking per stay, one open
// checkout per payment, and a room held only while the guest is actually paying.

const guest = { guestName: 'Somchai', guestEmail: 's@example.com', guestPhone: '0800000000' }
const stay = (from: number, nights: number) => ({ checkIn: day(from), checkOut: day(from + nights) })
const book = (body: Record<string, unknown>) => call(bookingsRoute.POST, 'POST', { body: { ...guest, ...body } })
const pay = (bookingId: string) => call(paymentsRoute.POST, 'POST', { body: { bookingId, paymentMethod: 'card' } })
const lapseHold = (id: string) => Booking.findByIdAndUpdate(id, { holdExpiresAt: new Date(Date.now() - 60_000) })

describe('booking again before paying', () => {
  it('continues the unpaid booking with the new details instead of creating another one', async () => {
    const room = await createRoom({ price: 1000, pricing: { weekday: 1000, weekend: 1000, holiday: 1000 } })
    const addOn = await createAddOn({ price: 300 })
    signInAs(await createUser())

    const first = await book({ ...stay(10, 2), roomId: room._id })
    expect(first.status).toBe(201)
    stripeMock.createCheckoutSession.mockResolvedValueOnce({ id: 'cs_first', url: 'https://checkout.stripe.test/cs_first' })
    await pay(first.body._id)

    // The guest left the payment page and submitted the form again, now with an add-on and a deposit
    const again = await book({ ...stay(10, 2), roomId: room._id, paymentType: 'PARTIAL', addOns: [{ addOnId: addOn._id, quantity: 1 }] })

    expect(again.status).toBe(200)
    expect(again.body._id).toBe(first.body._id)
    expect(await Booking.countDocuments({ roomId: room._id })).toBe(1)
    expect(again.body).toMatchObject({ paymentType: 'PARTIAL', totalPrice: Math.round(2300 * 1.03), status: 'PENDING' })
    expect(await Payment.findById(first.body.paymentId._id)).toMatchObject({ amount: 1185, totalAmount: 2369, paidAmount: 0, status: 'PENDING' })
    // The checkout opened for the old amount can't be paid any more
    expect(stripeMock.closeCheckout).toHaveBeenCalledWith('cs_first')
  })

  it('continues it also after the time to pay ran out, and with other dates', async () => {
    const room = await createRoom()
    signInAs(await createUser())
    const first = await book({ ...stay(10, 2), roomId: room._id })
    await lapseHold(first.body._id)

    const again = await book({ ...stay(11, 2), roomId: room._id })

    expect(again.body._id).toBe(first.body._id)
    expect(again.body.paymentExpired).toBe(false) // held again
    expect(await Booking.countDocuments({})).toBe(1)
  })

  it('does not touch a booking that is already paid (the room is taken, by the same guest)', async () => {
    const customer = await createUser()
    const room = await createRoom()
    await createBooking({ userId: customer._id, roomId: room._id, status: 'CONFIRMED' }, { status: 'COMPLETED', paidAmount: 2000 })
    signInAs(customer)
    expect((await book({ ...stay(10, 2), roomId: room._id })).status).toBe(409)
  })

  it("never continues another guest's booking", async () => {
    const room = await createRoom()
    signInAs(await createUser({ email: 'a@example.com' }))
    const first = await book({ ...stay(10, 2), roomId: room._id })
    await lapseHold(first.body._id)

    signInAs(await createUser({ email: 'b@example.com' }))
    const other = await book({ ...stay(10, 2), roomId: room._id })
    expect(other.status).toBe(201)
    expect(other.body._id).not.toBe(first.body._id)
  })
})

describe('paying', () => {
  it('holds the room again while the guest pays', async () => {
    const room = await createRoom()
    signInAs(await createUser())
    const booking = await book({ ...stay(10, 2), roomId: room._id })
    await lapseHold(booking.body._id)

    expect((await pay(booking.body._id)).status).toBe(200)
    expect((await Booking.findById(booking.body._id)).holdExpiresAt.getTime()).toBeGreaterThan(Date.now())

    signInAs(await createUser({ email: 'other@example.com' }))
    expect((await book({ ...stay(10, 2), roomId: room._id })).status).toBe(409)
  })

  it('refuses to take money when the room was booked by someone else after the time to pay ran out', async () => {
    const room = await createRoom()
    signInAs(await createUser({ email: 'slow@example.com' }))
    const slow = await book({ ...stay(10, 2), roomId: room._id })
    await lapseHold(slow.body._id)

    signInAs(await createUser({ email: 'fast@example.com' }))
    expect((await book({ ...stay(10, 2), roomId: room._id })).status).toBe(201)

    signInAs(await Booking.findById(slow.body._id).then((b: any) => ({ _id: b.userId, role: 'CUSTOMER' as const })))
    expect((await pay(slow.body._id)).status).toBe(409)
    expect(stripeMock.createCheckoutSession).not.toHaveBeenCalled()
  })

  it('closes the previous checkout when the guest starts paying again', async () => {
    const room = await createRoom()
    signInAs(await createUser())
    const booking = await book({ ...stay(10, 2), roomId: room._id })
    stripeMock.createCheckoutSession.mockResolvedValueOnce({ id: 'cs_one', url: 'https://checkout.stripe.test/cs_one' })
    await pay(booking.body._id)
    stripeMock.createCheckoutSession.mockResolvedValueOnce({ id: 'cs_two', url: 'https://checkout.stripe.test/cs_two' })
    await pay(booking.body._id)

    expect(stripeMock.closeCheckout).toHaveBeenCalledWith('cs_one')
    expect((await Payment.findById(booking.body.paymentId._id)).stripeSessionId).toBe('cs_two')
  })

  it('records what Stripe actually charged', async () => {
    const { booking, payment } = await createBooking(
      { status: 'PENDING', totalPrice: 3000 },
      { stripeSessionId: 'cs_x', status: 'PROCESSING', amount: 3000, totalAmount: 3000 }
    )
    stripeMock.constructWebhookEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_x', payment_link: null, amount_total: 250000, metadata: { paymentType: 'FULL' } } },
    })
    await call(webhookRoute.POST, 'POST', { rawBody: '{}', headers: { 'stripe-signature': 'sig' } })

    expect(await Payment.findById(payment._id)).toMatchObject({ status: 'COMPLETED', paidAmount: 2500, remainingAmount: 500 })
    expect((await Booking.findById(booking._id)).status).toBe('CONFIRMED')
  })
})

describe('time to pay', () => {
  it('shows an unpaid customer booking as expired once its hold lapsed', async () => {
    const customer = await createUser()
    const room = await createRoom()
    signInAs(customer)
    const booking = await book({ ...stay(10, 2), roomId: room._id })
    expect(booking.body.paymentExpired).toBe(false)

    await lapseHold(booking.body._id)
    const detail = await call(bookingRoute.GET, 'GET', { params: { id: booking.body._id } })
    expect(detail.body.paymentExpired).toBe(true)
  })

  it('keeps holding bookings made by staff until staff confirm or cancel them', async () => {
    const room = await createRoom()
    signInAs(await createUser({ role: 'ADMIN' }))
    const byStaff = await book({ ...stay(10, 2), roomId: room._id, bookingStatus: 'PENDING', totalPrice: 2000 })
    await Booking.findByIdAndUpdate(byStaff.body._id, { createdAt: new Date(Date.now() - 24 * 3600_000) })

    signInAs(await createUser())
    expect((await book({ ...stay(10, 2), roomId: room._id })).status).toBe(409)
  })
})
