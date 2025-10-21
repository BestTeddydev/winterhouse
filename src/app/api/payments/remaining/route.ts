import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Payment from '@/models/Payment'
import Booking from '@/models/Booking'
import { createCheckoutSession, createQRCodePayment } from '@/lib/stripe'
import mongoose from 'mongoose'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 401 })
    }

    const body = await request.json()
    const { bookingId, paymentMethod } = body

    await connectDB()
    
    // Set strictPopulate to false to avoid schema validation errors
    mongoose.set('strictPopulate', false)
    
    // Ensure models are registered
    if (!mongoose.models.Booking) {
      require('@/models/Booking')
    }
    if (!mongoose.models.Payment) {
      require('@/models/Payment')
    }
    if (!mongoose.models.Room) {
      require('@/models/Room')
    }

    // Get booking
    const booking = await Booking.findById(bookingId)
      .populate({
        path: 'paymentId',
        model: 'Payment',
        select: 'status amount totalAmount paidAmount remainingAmount paymentType'
      })
      .populate({
        path: 'roomId',
        model: 'Room',
        select: 'name description price'
      })

    if (!booking) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลการจอง' }, { status: 404 })
    }

    if (booking.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 401 })
    }

    if (!booking.paymentId) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลการชำระเงิน' }, { status: 404 })
    }

    // Check if there's remaining amount to pay
    if (booking.paymentId.remainingAmount <= 0) {
      return NextResponse.json({ error: 'ไม่มียอดเงินที่ต้องชำระเพิ่มเติม' }, { status: 400 })
    }

    // Update payment status to processing
    await Payment.findByIdAndUpdate(booking.paymentId._id, {
      status: 'PROCESSING',
      paymentMethod,
    })

    try {
      if (paymentMethod === 'qr_code') {
        // Create Stripe QR Code Payment for remaining amount
        const qrPayment = await createQRCodePayment({
          amount: Math.round(booking.paymentId.remainingAmount * 100), // Convert to satang
          currency: 'thb',
          description: `Remaining payment for ${booking.roomId?.name || 'Room'} (${booking.id})`,
          metadata: {
            bookingId: bookingId,
            userId: session.user.id,
            paymentType: 'REMAINING',
          },
        })

        // Create new payment record for remaining amount
        const remainingPayment = new Payment({
          bookingId: booking._id,
          amount: booking.paymentId.remainingAmount,
          totalAmount: booking.paymentId.totalAmount,
          paidAmount: booking.paymentId.paidAmount,
          remainingAmount: booking.paymentId.remainingAmount,
          paymentType: 'REMAINING',
          stripePaymentIntentId: qrPayment.paymentIntent.id,
          stripeSessionId: qrPayment.paymentLink.id,
          status: 'PENDING',
        })
        await remainingPayment.save()

        return NextResponse.json({
          payment: remainingPayment,
          qrCodeUrl: qrPayment.qrCodeUrl,
          paymentIntentId: qrPayment.paymentIntent.id,
        })
      } else {
        // Create Stripe Checkout Session for remaining amount
        const checkoutSession = await createCheckoutSession({
          amount: Math.round(booking.paymentId.remainingAmount * 100), // Convert to satang
          currency: 'thb',
          description: `Remaining payment for ${booking.roomId?.name || 'Room'} (${booking.id})`,
          metadata: {
            bookingId: bookingId,
            userId: session.user.id,
            paymentType: 'REMAINING',
          },
          success_url: `${process.env.NEXT_PUBLIC_APP_URL}/bookings?payment=success&booking=${bookingId}`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/bookings/${bookingId}/payment-result?canceled=true`,
        })

        // Create new payment record for remaining amount
        const remainingPayment = new Payment({
          bookingId: booking._id,
          amount: booking.paymentId.remainingAmount,
          totalAmount: booking.paymentId.totalAmount,
          paidAmount: booking.paymentId.paidAmount,
          remainingAmount: booking.paymentId.remainingAmount,
          paymentType: 'REMAINING',
          stripeSessionId: checkoutSession.id,
          status: 'PENDING',
        })
        await remainingPayment.save()

        return NextResponse.json({
          payment: remainingPayment,
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
  } catch (error: any) {
    console.error('Error processing remaining payment:', error)
    
    let errorMessage = 'ไม่สามารถดำเนินการชำระเงินได้'
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error.message) {
      errorMessage = error.message
    }
    
    return NextResponse.json(
      { error: errorMessage, details: error.response?.data || error.message },
      { status: 500 }
    )
  }
}
