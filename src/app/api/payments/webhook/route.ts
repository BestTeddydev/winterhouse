import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Payment from '@/models/Payment'
import Booking from '@/models/Booking'
import { retrieveCharge } from '@/lib/omise'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Verify webhook is from Omise
    // In production, you should verify the signature
    
    if (body.key === 'charge.complete') {
      const chargeId = body.data.id
      
      await connectDB()
      
      // Retrieve charge from Omise
      const charge = await retrieveCharge(chargeId)
      
      // Find payment by charge ID
      const payment = await Payment.findOne({ omiseChargeId: chargeId })
        .populate('booking')

      if (!payment) {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
      }

      // Update payment status
      await Payment.findByIdAndUpdate(payment._id, {
        status: charge.status === 'successful' ? 'COMPLETED' : 'FAILED',
      })

      // Update booking status if payment successful
      if (charge.status === 'successful') {
        await Booking.findByIdAndUpdate(payment.bookingId, { status: 'CONFIRMED' })
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}