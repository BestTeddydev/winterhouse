import type { Session } from 'next-auth'
import type Stripe from 'stripe'
import { upfrontAmount } from '@/lib/bookingPrice'
import { formatPaymentNotificationEmail, sendEmailNotification } from '@/lib/email'
import { formatPaymentThankYouMessage, sendLineNotification } from '@/lib/line'
import { getDb } from '@/lib/firebase'
import { createCheckoutSession, createQRCodePayment } from '@/lib/stripe'
import Booking from '@/models/Booking'
import Payment from '@/models/Payment'
import { assertOwnerOrStaff } from '../auth'
import { badRequest, notFound } from '../errors'
import { assertAvailable } from './availability'
import { notifyOwnersOfBooking } from './notifications'

export type PaymentMethod = 'card' | 'qr_code' | string

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? ''

async function loadBookingForPayment(bookingId: string, session: Session) {
  const booking = await Booking.findById(bookingId)
    .populate('paymentId', 'status amount totalAmount paidAmount remainingAmount')
    .populate('roomId', 'name description price')
  if (!booking) throw notFound('ไม่พบข้อมูลการจอง')
  await assertOwnerOrStaff(session, booking.userId)
  if (!booking.paymentId) throw notFound('ไม่พบข้อมูลการชำระเงิน')
  if (booking.status === 'CANCELLED') throw badRequest('การจองนี้ถูกยกเลิกแล้ว')
  return booking
}

/** Creates the Stripe checkout (card) or payment link (QR) and stores its id on the payment */
async function openStripePayment(params: {
  booking: any
  paymentId: string
  amount: number
  paymentMethod: PaymentMethod
  paymentType: string
  description: string
  cancelPath: string
  session: Session
}) {
  const metadata = {
    bookingId: String(params.booking._id),
    paymentId: params.paymentId,
    userId: params.session.user.id,
    paymentType: params.paymentType,
  }
  const base = { amount: Math.round(params.amount * 100), currency: 'thb', description: params.description, metadata }

  try {
    if (params.paymentMethod === 'qr_code') {
      const { paymentLink, qrCodeUrl } = await createQRCodePayment(base)
      const payment = await Payment.findByIdAndUpdate(
        params.paymentId,
        { stripeSessionId: paymentLink.id, status: 'PENDING' },
        { new: true }
      )
      return { payment, qrCodeUrl }
    }

    const checkout = await createCheckoutSession({
      ...base,
      success_url: `${appUrl()}/bookings?payment=success&booking=${params.booking._id}`,
      cancel_url: `${appUrl()}/bookings/${params.booking._id}/${params.cancelPath}?canceled=true`,
    })
    const payment = await Payment.findByIdAndUpdate(
      params.paymentId,
      { stripeSessionId: checkout.id, status: 'PENDING' },
      { new: true }
    )
    return { payment, checkoutUrl: checkout.url }
  } catch (error) {
    await Payment.findByIdAndUpdate(params.paymentId, { status: 'FAILED' })
    throw error
  }
}

/** First payment of a booking: the full price or the 50% deposit, always computed from the booking */
export async function startPayment(input: { bookingId: string; paymentMethod: PaymentMethod }, session: Session) {
  const booking = await loadBookingForPayment(input.bookingId, session)
  if (booking.paymentId.status === 'COMPLETED') throw badRequest('การชำระเงินเสร็จสิ้นแล้ว')

  const paymentType = booking.paymentType === 'PARTIAL' ? 'PARTIAL' : 'FULL'
  await Payment.findByIdAndUpdate(booking.paymentId._id, { status: 'PROCESSING', paymentMethod: input.paymentMethod })

  return openStripePayment({
    booking,
    paymentId: booking.paymentId._id,
    amount: upfrontAmount(booking.totalPrice, paymentType),
    paymentMethod: input.paymentMethod,
    paymentType,
    description: `Booking for ${booking.roomId?.name || 'Room'} (${booking._id}) - ${paymentType === 'PARTIAL' ? '50% Deposit' : 'Full Payment'}`,
    cancelPath: 'payment-result',
    session,
  })
}

/** Second payment of a PARTIAL booking: the outstanding balance */
export async function startRemainingPayment(input: { bookingId: string; paymentMethod: PaymentMethod }, session: Session) {
  const booking = await loadBookingForPayment(input.bookingId, session)
  if (booking.paymentType !== 'PARTIAL') throw badRequest('การจองนี้ไม่ใช่การชำระมัดจำ')

  const payment = booking.paymentId
  // What was actually paid, not the status: the status is also PROCESSING/FAILED while the
  // balance checkout is open or failed, and FAILED when the deposit itself failed
  if (!((payment.paidAmount || 0) > 0)) throw badRequest('ยังไม่ได้ชำระมัดจำ')
  const remainingAmount = payment.remainingAmount || 0
  if (remainingAmount <= 0) throw badRequest('ไม่มีการชำระเงินที่ค้างอยู่')

  await Payment.findByIdAndUpdate(payment._id, {
    amount: remainingAmount,
    remainingAmount,
    paymentType: 'REMAINING',
    status: 'PROCESSING',
    paymentMethod: input.paymentMethod,
  })

  return openStripePayment({
    booking,
    paymentId: payment._id,
    amount: remainingAmount,
    paymentMethod: input.paymentMethod,
    paymentType: 'REMAINING',
    description: `Remaining payment for ${booking.roomId?.name || 'Room'} (${booking._id}) - Remaining Payment`,
    cancelPath: 'payment-remaining',
    session,
  })
}

// --- Stripe webhook ------------------------------------------------------------------

async function findPaymentForCheckout(checkout: Stripe.Checkout.Session) {
  // Card payments store the checkout session id; QR payments store the payment link id
  const ids = [checkout.id, typeof checkout.payment_link === 'string' ? checkout.payment_link : checkout.payment_link?.id]
  for (const id of ids.filter(Boolean)) {
    const payment = await Payment.findOne({ stripeSessionId: id })
    if (payment) return payment
  }
  if (checkout.metadata?.paymentId) return Payment.findById(checkout.metadata.paymentId)
  if (checkout.metadata?.bookingId) return Payment.findOne({ bookingId: checkout.metadata.bookingId })
  return null
}

/** Amounts after a successful checkout of the given stage */
function paidAmounts(payment: { paymentType: string; amount: number; totalAmount: number; paidAmount?: number }) {
  if (payment.paymentType === 'REMAINING') return { paidAmount: (payment.paidAmount || 0) + payment.amount, remainingAmount: 0 }
  if (payment.paymentType === 'PARTIAL') return { paidAmount: payment.amount, remainingAmount: payment.totalAmount - payment.amount }
  return { paidAmount: payment.totalAmount, remainingAmount: 0 }
}

/**
 * Marks the payment paid for one stage (FULL, PARTIAL deposit or REMAINING balance), at most once.
 * Runs in a transaction, so two deliveries of the same event at the same moment can't both count it.
 * Returns false when there is nothing to record: already paid, or the event is for an earlier stage
 * (e.g. a late retry of the deposit event after the guest opened the balance checkout).
 */
async function recordPaid(paymentId: string, stage: string) {
  const ref = Payment.collection().doc(String(paymentId))
  return getDb().runTransaction(async (tx) => {
    const current = (await tx.get(ref)).data()
    if (!current || current.status === 'COMPLETED' || current.paymentType !== stage) return false
    tx.update(ref, { status: 'COMPLETED', ...paidAmounts(current as any), updatedAt: new Date() })
    return true
  })
}

/**
 * Handles checkout.session.completed: marks the payment paid, confirms a pending booking and
 * sends notifications. Idempotent: Stripe retries deliveries, and a payment that is already
 * COMPLETED is not counted again.
 */
export async function handleCheckoutCompleted(checkout: Stripe.Checkout.Session) {
  const payment = await findPaymentForCheckout(checkout)
  if (!payment) throw notFound('Payment not found')

  const booking = await Booking.findById(payment.bookingId)
  if (!booking) throw notFound('Booking not found')

  // The stage the guest paid for is in the checkout metadata. Without it, only the payment's current
  // checkout counts: an older one is for an earlier stage (e.g. the deposit, re-delivered late).
  const linkId = typeof checkout.payment_link === 'string' ? checkout.payment_link : checkout.payment_link?.id
  const isCurrentCheckout = [checkout.id, linkId].includes(payment.stripeSessionId)
  const stage = checkout.metadata?.paymentType || (isCurrentCheckout ? payment.paymentType : undefined)
  if (!stage || !(await recordPaid(payment._id, stage))) return { alreadyProcessed: true }
  const updatedPayment = await Payment.findById(payment._id)

  let doubleBooked = false
  if (booking.status === 'PENDING') {
    // The payment hold may have lapsed (e.g. a slow QR payment): flag a clash for the owner
    try {
      await assertAvailable(
        {
          rooms: [...new Set([booking.roomId, ...(booking.roomIds ?? [])].filter(Boolean))].map((id) => ({ _id: String(id) })),
          campingBlocks: [...new Set([booking.campingBlockId, ...(booking.campingBlockIds ?? [])].filter(Boolean))].map(
            (id) => ({ _id: String(id) })
          ),
        },
        { checkIn: booking.checkIn, checkOut: booking.checkOut },
        { excludeBookingId: booking._id }
      )
    } catch {
      doubleBooked = true
    }
    await Booking.findByIdAndUpdate(booking._id, { status: 'CONFIRMED' })
  }

  await sendPaymentNotifications(booking._id, updatedPayment, doubleBooked)
  return { alreadyProcessed: false, doubleBooked }
}

async function sendPaymentNotifications(bookingId: string, payment: any, doubleBooked: boolean) {
  try {
    const booking = await Booking.findById(bookingId)
      .populate('roomId')
      .populate('roomIds')
      .populate('campingBlockId')
      .populate('campingBlockIds')
      .populate('userId')
    if (!booking) return

    const tasks: Promise<unknown>[] = []
    if (process.env.ADMIN_EMAIL) {
      tasks.push(
        sendEmailNotification({
          to: process.env.ADMIN_EMAIL,
          subject: `💰 การชำระเงินใหม่ - ${booking.roomId?.name || 'Room'}`,
          html: formatPaymentNotificationEmail(booking, payment),
        })
      )
    }
    if (booking.userId?.lineUserId) {
      tasks.push(
        sendLineNotification({ userId: booking.userId.lineUserId, message: formatPaymentThankYouMessage(booking, payment) })
      )
    }
    // Manual bookings already notified owners when they were created
    if (!booking.isManualBooking || doubleBooked) {
      tasks.push(
        notifyOwnersOfBooking(booking, doubleBooked ? '⚠️ ห้อง/บล็อคนี้มีการจองซ้อนในช่วงวันที่เดียวกัน กรุณาตรวจสอบ' : undefined)
      )
    }
    await Promise.allSettled(tasks)
  } catch (error) {
    // Notifications never fail the webhook (Stripe would retry)
    console.error('Error sending payment notifications:', error)
  }
}
