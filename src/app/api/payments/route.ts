import { NextRequest, NextResponse } from 'next/server'
import { apiErrorResponse, findSessionUser, isStaff, requireSession } from '@/lib/api-auth'
import connectDB from '@/lib/db'
import Booking from '@/models/Booking'
import Payment from '@/models/Payment'
import { createCheckoutSession, createQRCodePayment } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession()
    const { bookingId, paymentMethod } = await request.json()

    await connectDB()

    const booking = await Booking.findById(bookingId)
      .populate('paymentId', 'status amount')
      .populate('roomId', 'name description price')

    if (!booking) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลการจอง' }, { status: 404 })
    }

    // Customers may only pay for their own bookings
    if (!isStaff(session)) {
      const user = await findSessionUser(session)
      if (!user || String(booking.userId) !== user._id) {
        return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึงการจองนี้' }, { status: 403 })
      }
    }

    // The amount is always derived from the booking; never trust an amount sent by the client
    const paymentType = booking.paymentType === 'PARTIAL' ? 'PARTIAL' : 'FULL'
    const paymentAmount = paymentType === 'PARTIAL' ? Math.round(booking.totalPrice * 0.5) : booking.totalPrice

    if (!booking.paymentId) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลการชำระเงิน' }, { status: 404 })
    }

    if (booking.paymentId.status === 'COMPLETED') {
      return NextResponse.json({ error: 'การชำระเงินเสร็จสิ้นแล้ว' }, { status: 400 })
    }

    // Update payment status to processing
    await Payment.findByIdAndUpdate(booking.paymentId._id, {
      status: 'PROCESSING',
      paymentMethod,
    })

    try {
      if (paymentMethod === 'qr_code') {
        // Create Stripe QR Code Payment
        const qrPayment = await createQRCodePayment({
          amount: Math.round(parseFloat(paymentAmount.toString()) * 100), // Convert to satang
          currency: 'thb',
          description: `Booking for ${booking.roomId?.name || 'Room'} (${booking.id}) - ${paymentType === 'PARTIAL' ? '50% Deposit' : 'Full Payment'}`,
          metadata: {
            bookingId: bookingId.toString(),
            userId: session.user.id,
            paymentType,
          },
        })

        // Update payment with QR payment info
        const payment = await Payment.findByIdAndUpdate(
          booking.paymentId._id,
          {
            stripePaymentIntentId: qrPayment.paymentIntent.id,
            stripeSessionId: qrPayment.paymentLink.id,
            status: 'PENDING',
          },
          { new: true }
        )

        return NextResponse.json({
          payment,
          qrCodeUrl: qrPayment.qrCodeUrl,
          paymentIntentId: qrPayment.paymentIntent.id,
        })
      } else {
        // Create Stripe Checkout Session
        const checkoutSession = await createCheckoutSession({
          amount: Math.round(parseFloat(paymentAmount.toString()) * 100), // Convert to satang
          currency: 'thb',
          description: `Booking for ${booking.roomId?.name || 'Room'} (${booking.id}) - ${paymentType === 'PARTIAL' ? '50% Deposit' : 'Full Payment'}`,
          metadata: {
            bookingId: bookingId.toString(),
            userId: session.user.id,
            paymentType,
          },
          success_url: `${process.env.NEXT_PUBLIC_APP_URL}/bookings?payment=success&booking=${bookingId}`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/bookings/${bookingId}/payment-result?canceled=true`,
        })

        // Update payment with session ID
        const payment = await Payment.findByIdAndUpdate(
          booking.paymentId._id,
          {
            stripeSessionId: checkoutSession.id,
            status: 'PENDING',
          },
          { new: true }
        )

        return NextResponse.json({
          payment,
          checkoutUrl: checkoutSession.url,
        })
      }
    } catch (error: any) {
      // Update payment status to failed
      await Payment.findByIdAndUpdate(booking.paymentId._id, {
        status: 'FAILED',
      })

      throw error
    }
  } catch (error) {
    return apiErrorResponse(error, 'ไม่สามารถดำเนินการชำระเงินได้')
  }
}
