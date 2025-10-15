import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Booking from '@/models/Booking'
import Payment from '@/models/Payment'
import { createCharge } from '@/lib/omise'
import mongoose from 'mongoose'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { bookingId, source, paymentMethod } = body

    await connectDB()

    // Get booking
    const booking = await Booking.findById(bookingId)
      .populate('payment')
      .populate('room')

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (booking.payment.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Payment already completed' }, { status: 400 })
    }

    // Update payment status to processing
    await Payment.findByIdAndUpdate(booking.payment._id, {
      status: 'PROCESSING',
      paymentMethod,
    })

    try {
      // Create charge with Omise
      const charge = await createCharge({
        amount: Math.round(parseFloat(booking.totalPrice.toString()) * 100), // Convert to satang
        currency: 'thb',
        description: `Booking for ${booking.room.name} (${booking.id})`,
        source,
        return_uri: `${process.env.NEXT_PUBLIC_APP_URL}/bookings/${bookingId}/payment-result`,
      })

      // Update payment with charge ID
      const payment = await Payment.findByIdAndUpdate(
        booking.payment._id,
        {
          omiseChargeId: charge.id,
          status: charge.status === 'successful' ? 'COMPLETED' : 'PENDING',
        },
        { new: true }
      )

      // Update booking status if payment successful
      if (charge.status === 'successful') {
        await Booking.findByIdAndUpdate(bookingId, { status: 'CONFIRMED' })
      }

      return NextResponse.json({
        payment,
        charge,
        authorizeUri: charge.authorize_uri,
      })
    } catch (error: any) {
      // Update payment status to failed
      await Payment.findByIdAndUpdate(booking.payment._id, {
        status: 'FAILED',
      })

      throw error
    }
  } catch (error) {
    console.error('Error processing payment:', error)
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    )
  }
}