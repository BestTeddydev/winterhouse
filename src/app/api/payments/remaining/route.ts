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
        select: 'status amount totalAmount paidAmount remainingAmount'
      })
      .populate({
        path: 'roomId',
        model: 'Room',
        select: 'name description price'
      })

    if (!booking) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลการจอง' }, { status: 404 })
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

    // Calculate payment amount (should be the remaining amount)
    const paymentAmount = amount || remainingAmount

    // Debug logging
    console.log('Remaining payment booking found:', {
      id: booking._id,
      userId: booking.userId,
      roomId: booking.roomId,
      paymentId: booking.paymentId,
      totalPrice: booking.totalPrice,
      paymentType: paymentType,
      remainingAmount: remainingAmount,
      paymentAmount: paymentAmount
    })

    if (booking.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต' }, { status: 401 })
    }

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
    console.error('Error processing remaining payment:', error)
    
    // Handle specific error types
    if (error instanceof mongoose.Error.CastError) {
      return NextResponse.json({ 
        error: `รูปแบบ ID ไม่ถูกต้อง: ${error.path}` 
      }, { status: 400 })
    }
    
    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json({ 
        error: 'ข้อมูลไม่ถูกต้อง', 
        details: Object.values(error.errors).map(err => err.message)
      }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'ไม่สามารถดำเนินการชำระเงินได้' }, { status: 500 })
  }
}