import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Booking from '@/models/Booking'
import Payment from '@/models/Payment'
import { createCheckoutSession, createQRCodePayment } from '@/lib/stripe'
import mongoose from 'mongoose'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 401 })
    }

    const body = await request.json()
    const { bookingId, source, paymentMethod, amount, paymentType } = body

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
        select: 'status amount'
      })
      .populate({
        path: 'roomId',
        model: 'Room',
        select: 'name description price'
      })

    if (!booking) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลการจอง' }, { status: 404 })
    }

    // Calculate payment amount based on payment type
    const paymentAmount = amount || (paymentType === 'PARTIAL' 
      ? Math.round(booking.totalPrice * 0.5) 
      : booking.totalPrice)

   

    if (booking.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 401 })
    }

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
            paymentType: paymentType || 'FULL',
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
            paymentType: paymentType || 'FULL',
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
  } catch (error: any) {
    console.error('Error processing payment:', error)
    
    // More detailed error logging
    if (error.response) {
      console.error('Payment API Error Response:', error.response.data)
      console.error('Status:', error.response.status)
    } else if (error.request) {
      console.error('Network Error:', error.request)
    } else {
      console.error('Error Message:', error.message)
    }
    
    // Return more specific error message
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