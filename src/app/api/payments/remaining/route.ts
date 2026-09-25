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
      .populate('paymentId', 'status amount totalAmount paidAmount remainingAmount')
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

    // Validate that this is a partial payment booking
    if (booking.paymentType !== 'PARTIAL') {
      return NextResponse.json({ error: 'การจองนี้ไม่ใช่การชำระมัดจำ' }, { status: 400 })
    }

    // Validate that deposit has been paid or payment failed
    if (booking.paymentId?.status !== 'COMPLETED' && booking.paymentId?.status !== 'FAILED') {
      return NextResponse.json({ error: 'ยังไม่ได้ชำระมัดจำ' }, { status: 400 })
    }

    // Validate that there's remaining amount
    const remainingAmount = booking.paymentId?.remainingAmount || 0
    if (remainingAmount <= 0) {
      return NextResponse.json({ error: 'ไม่มีการชำระเงินที่ค้างอยู่' }, { status: 400 })
    }

    // Always charge the outstanding balance; never trust an amount sent by the client
    const paymentAmount = remainingAmount

    // Update existing payment record for remaining amount
    const updatedPayment = await Payment.findByIdAndUpdate(
      booking.paymentId._id,
      {
        amount: paymentAmount,
        paidAmount: booking.paymentId?.paidAmount || 0, // Keep only the amount actually paid
        remainingAmount: remainingAmount,
        paymentType: 'REMAINING',
        status: 'PROCESSING',
        paymentMethod,
      },
      { new: true }
    )

    try {
      if (paymentMethod === 'qr_code') {
        // Create Stripe QR Code Payment
        const qrPayment = await createQRCodePayment({
          amount: Math.round(parseFloat(paymentAmount.toString()) * 100), // Convert to satang
          currency: 'thb',
          description: `Remaining payment for ${booking.roomId?.name || 'Room'} (${booking.id}) - Remaining Payment`,
          metadata: {
            bookingId: bookingId.toString(),
            userId: session.user.id,
            paymentType: 'REMAINING',
            paymentId: updatedPayment._id.toString(),
          },
        })

        // Update payment with QR payment info
        const payment = await Payment.findByIdAndUpdate(
          updatedPayment._id,
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
          description: `Remaining payment for ${booking.roomId?.name || 'Room'} (${booking.id}) - Remaining Payment`,
          metadata: {
            bookingId: bookingId.toString(),
            userId: session.user.id,
            paymentType: 'REMAINING',
            paymentId: updatedPayment._id.toString(),
          },
          success_url: `${process.env.NEXT_PUBLIC_APP_URL}/bookings?payment=success&booking=${bookingId}`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/bookings/${bookingId}/payment-remaining?canceled=true`,
        })

        // Update payment with session ID
        const payment = await Payment.findByIdAndUpdate(
          updatedPayment._id,
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
      await Payment.findByIdAndUpdate(updatedPayment._id, {
        status: 'FAILED',
      })

      throw error
    }
  } catch (error: any) {
    return apiErrorResponse(error, 'ไม่สามารถดำเนินการชำระเงินได้')
  }
}