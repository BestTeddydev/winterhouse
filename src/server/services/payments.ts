import type { Session } from 'next-auth'
import type Stripe from 'stripe'
import { upfrontAmount } from '@/lib/bookingPrice'
import { formatPaymentNotificationEmail, sendEmailNotification } from '@/lib/email'
import { formatPaymentThankYouMessage, sendLineNotification } from '@/lib/line'
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
  if (payment.status !== 'COMPLETED' && payment.status !== 'FAILED') throw badRequest('ยังไม่ได้ชำระมัดจำ')
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

/**
 * Handles checkout.session.completed: marks the payment paid, confirms a pending booking and
 * sends notifications. Idempotent: Stripe retries deliveries, and a payment that is already
 * COMPLETED is not counted again.
 */
export async function handleCheckoutCompleted(checkout: Stripe.Checkout.Session) {
  const payment = await findPaymentForCheckout(checkout)
  if (!payment) throw notFound('Payment not found')
  if (payment.status === 'COMPLETED') return { alreadyProcessed: true }

  const booking = await Booking.findById(payment.bookingId)
  if (!booking) throw notFound('Booking not found')

  const paid =
    payment.paymentType === 'REMAINING'
      ? { paidAmount: (payment.paidAmount || 0) + payment.amount, remainingAmount: 0 }
      : payment.paymentType === 'PARTIAL'
        ? { paidAmount: payment.amount, remainingAmount: payment.totalAmount - payment.amount }
        : { paidAmount: payment.totalAmount, remainingAmount: 0 }

  const updatedPayment = await Payment.findByIdAndUpdate(payment._id, { status: 'COMPLETED', ...paid }, { new: true })

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
