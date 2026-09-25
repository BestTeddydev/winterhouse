import { describe, expect, it } from 'vitest'
import * as paymentsRoute from '@/app/api/payments/route'
import * as remainingRoute from '@/app/api/payments/remaining/route'
import * as webhookRoute from '@/app/api/payments/webhook/route'
import Booking from '@/models/Booking'
import Payment from '@/models/Payment'
import { createBooking, createRoom, createUser, day } from '../support/factories'
import { call } from '../support/http'
import { emailMock, lineMock, signInAs, stripeMock } from '../support/mocks'

const checkoutEvent = (session: Record<string, unknown>) => ({
  type: 'checkout.session.completed',
  data: { object: { id: 'cs_test_1', payment_link: null, metadata: {}, ...session } },
})

const postWebhook = () => call(webhookRoute.POST, 'POST', { rawBody: '{}', headers: { 'stripe-signature': 'sig' } })

describe('POST /api/payments', () => {
  it('charges the amount computed from the booking, ignoring the amount sent by the client', async () => {
    const customer = await createUser()
    const { booking, payment } = await createBooking({ userId: customer._id, status: 'PENDING', totalPrice: 3000, paymentType: 'PARTIAL' })
    signInAs(customer)

    const res = await call(paymentsRoute.POST, 'POST', {
      body: { bookingId: booking._id, paymentMethod: 'card', amount: 1, paymentType: 'FULL' },
    })

    expect(res.status).toBe(200)
    expect(res.body.checkoutUrl).toBe('https://checkout.stripe.test/cs_test_1')
    // 50% deposit of 3000 THB, in satang
    expect(stripeMock.createCheckoutSession).toHaveBeenCalledWith(expect.objectContaining({ amount: 150000 }))
    expect((await Payment.findById(payment._id)).stripeSessionId).toBe('cs_test_1')
  })

  it('stores the payment link id for QR payments', async () => {
    const customer = await createUser()
    const { booking, payment } = await createBooking({ userId: customer._id, status: 'PENDING' })
    signInAs(customer)
    const res = await call(paymentsRoute.POST, 'POST', { body: { bookingId: booking._id, paymentMethod: 'qr_code' } })
    expect(res.body.qrCodeUrl).toBe('https://buy.stripe.test/plink_test_1')
    expect((await Payment.findById(payment._id)).stripeSessionId).toBe('plink_test_1')
  })

  it("rejects paying someone else's booking or an already paid one", async () => {
    const { booking } = await createBooking({ userId: (await createUser())._id })
    signInAs(await createUser())
    expect((await call(paymentsRoute.POST, 'POST', { body: { bookingId: booking._id } })).status).toBe(403)

    const owner = await createUser()
    const paid = await createBooking({ userId: owner._id }, { status: 'COMPLETED' })
    signInAs(owner)
    const res = await call(paymentsRoute.POST, 'POST', { body: { bookingId: paid.booking._id } })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('การชำระเงินเสร็จสิ้นแล้ว')
  })

  it('marks the payment FAILED when Stripe fails', async () => {
    const customer = await createUser()
    const { booking, payment } = await createBooking({ userId: customer._id, status: 'PENDING' })
    signInAs(customer)
    stripeMock.createCheckoutSession.mockRejectedValueOnce(new Error('stripe down'))
    const res = await call(paymentsRoute.POST, 'POST', { body: { bookingId: booking._id } })
    expect(res.status).toBe(500)
    expect(res.body.error).toBe('ไม่สามารถดำเนินการชำระเงินได้') // no internal details leaked
    expect((await Payment.findById(payment._id)).status).toBe('FAILED')
  })
})

describe('POST /api/payments/remaining', () => {
  it('charges the outstanding balance of a paid deposit', async () => {
    const customer = await createUser()
    const { booking, payment } = await createBooking(
      { userId: customer._id, paymentType: 'PARTIAL', totalPrice: 3000 },
      { status: 'COMPLETED', paymentType: 'PARTIAL', amount: 1500, paidAmount: 1500, remainingAmount: 1500 }
    )
    signInAs(customer)
    const res = await call(remainingRoute.POST, 'POST', { body: { bookingId: booking._id, amount: 1 } })
    expect(res.status).toBe(200)
    expect(stripeMock.createCheckoutSession).toHaveBeenCalledWith(expect.objectContaining({ amount: 150000 }))
    expect(await Payment.findById(payment._id)).toMatchObject({ paymentType: 'REMAINING', amount: 1500 })
  })

  it('requires a deposit booking with a paid deposit', async () => {
    const customer = await createUser()
    signInAs(customer)
    const full = await createBooking({ userId: customer._id, paymentType: 'FULL' })
    expect((await call(remainingRoute.POST, 'POST', { body: { bookingId: full.booking._id } })).body.error).toBe(
      'การจองนี้ไม่ใช่การชำระมัดจำ'
    )
    const unpaid = await createBooking({ userId: customer._id, paymentType: 'PARTIAL' }, { status: 'PENDING', remainingAmount: 1000 })
    expect((await call(remainingRoute.POST, 'POST', { body: { bookingId: unpaid.booking._id } })).body.error).toBe('ยังไม่ได้ชำระมัดจำ')
  })
})

describe('POST /api/payments/webhook', () => {
  it('rejects requests without a valid signature', async () => {
    expect((await call(webhookRoute.POST, 'POST', { rawBody: '{}' })).status).toBe(400)
    stripeMock.constructWebhookEvent.mockImplementationOnce(() => {
      throw new Error('bad signature')
    })
    expect((await postWebhook()).status).toBe(400)
  })

  it('confirms the booking, records the payment and notifies everyone', async () => {
    const customer = await createUser({ lineUserId: 'Ucustomer' })
    await createUser({ role: 'OWNER', lineUserId: 'Uowner' })
    process.env.ADMIN_EMAIL = 'admin@example.com'
    const { booking, payment } = await createBooking(
      { userId: customer._id, status: 'PENDING', totalPrice: 3000 },
      { stripeSessionId: 'cs_test_1', amount: 3000, totalAmount: 3000 }
    )
    stripeMock.constructWebhookEvent.mockReturnValue(checkoutEvent({ id: 'cs_test_1' }))

    const res = await postWebhook()

    expect(res.status).toBe(200)
    expect((await Booking.findById(booking._id)).status).toBe('CONFIRMED')
    expect(await Payment.findById(payment._id)).toMatchObject({ status: 'COMPLETED', paidAmount: 3000, remainingAmount: 0 })
    expect(emailMock.sendEmailNotification).toHaveBeenCalledOnce()
    const lineRecipients = lineMock.sendLineNotification.mock.calls.map(([n]) => (n as { userId: string }).userId)
    expect(lineRecipients).toEqual(expect.arrayContaining(['Ucustomer', 'Uowner']))
  })

  it('finds QR payments by their payment link', async () => {
    const { booking } = await createBooking({ status: 'PENDING' }, { stripeSessionId: 'plink_test_1' })
    stripeMock.constructWebhookEvent.mockReturnValue(checkoutEvent({ id: 'cs_other', payment_link: 'plink_test_1' }))
    expect((await postWebhook()).status).toBe(200)
    expect((await Booking.findById(booking._id)).status).toBe('CONFIRMED')
  })

  it('ignores duplicate deliveries of the same event (no double counting)', async () => {
    const { payment } = await createBooking(
      { paymentType: 'PARTIAL', totalPrice: 3000 },
      { stripeSessionId: 'cs_test_1', status: 'PENDING', paymentType: 'REMAINING', amount: 1500, paidAmount: 1500, totalAmount: 3000 }
    )
    stripeMock.constructWebhookEvent.mockReturnValue(checkoutEvent({ id: 'cs_test_1' }))

    await postWebhook()
    const second = await postWebhook()

    expect(second.body.alreadyProcessed).toBe(true)
    expect(await Payment.findById(payment._id)).toMatchObject({ paidAmount: 3000, remainingAmount: 0 })
  })

  it('confirms but warns owners when the room was taken while the guest was paying', async () => {
    await createUser({ role: 'OWNER', lineUserId: 'Uowner' })
    const room = await createRoom()
    await createBooking({ roomId: room._id, checkIn: day(10), checkOut: day(12) })
    await createBooking(
      { roomId: room._id, status: 'PENDING', checkIn: day(10), checkOut: day(12) },
      { stripeSessionId: 'cs_late' }
    )
    stripeMock.constructWebhookEvent.mockReturnValue(checkoutEvent({ id: 'cs_late' }))

    const res = await postWebhook()
    expect(res.body.doubleBooked).toBe(true)
    const ownerMessage = lineMock.sendLineNotification.mock.calls.find(([n]) => (n as { userId: string }).userId === 'Uowner')
    expect((ownerMessage?.[0] as { message: string }).message).toContain('มีการจองซ้อน')
  })

  it('acknowledges other event types without changes', async () => {
    stripeMock.constructWebhookEvent.mockReturnValue({ type: 'payment_intent.created', data: { object: {} } })
    const res = await postWebhook()
    expect(res.status).toBe(200)
    expect(res.body.received).toBe(true)
  })
})
