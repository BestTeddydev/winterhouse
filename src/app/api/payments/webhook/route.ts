import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Payment from '@/models/Payment'
import Booking from '@/models/Booking'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
})

export async function POST(request: NextRequest) {
  try {
    console.log('Webhook received, processing...')
    
    // Get raw body as buffer to preserve exact formatting
    const body = await request.arrayBuffer()
    const bodyString = Buffer.from(body).toString('utf-8')
    const signature = request.headers.get('stripe-signature')
    
    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    // Additional validation
    if (bodyString.length === 0) {
      return NextResponse.json({ error: 'Empty body' }, { status: 400 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(
        bodyString,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      )
      console.log('Event constructed successfully:', event.type, event.id)
    } catch (err: any) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log('Webhook received:', event.type, 'Event ID:', event.id)
    
    await connectDB()
    console.log('Database connected')
    
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      // Find payment by session ID
      const payment = await Payment.findOne({ bookingId:session.metadata?.bookingId || ''})

      if (!payment) {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
      }

      // Update payment status
      const updatedPayment = await Payment.findOneAndUpdate({_id: payment._id}, {
        status: 'COMPLETED',
      }, { new: true,upsert: true })

      // Update booking status
      const updatedBooking = await Booking.findOneAndUpdate({_id: payment.bookingId}, { 
        status: 'CONFIRMED',
        updatedAt: new Date(),
      }, { new: true,upsert: true })
      
      console.log('Updated booking status to CONFIRMED:', updatedBooking?.status)
    } else {
      console.log('Unhandled event type:', event.type)
      // Return success for unhandled events to prevent retries
      return NextResponse.json({ received: true, message: `Unhandled event type: ${event.type}` })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}