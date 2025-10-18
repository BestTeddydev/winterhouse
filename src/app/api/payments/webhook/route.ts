import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Payment from '@/models/Payment'
import Booking from '@/models/Booking'
import { retrievePaymentIntent } from '@/lib/stripe'
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
    // const signature = request.headers['stripe-signature'];
    
    console.log('Body length:', bodyString.length)
    console.log('Signature present:', !!signature)
    console.log('Body preview:', bodyString.substring(0, 100))
    console.log('signature stripe:', signature);
    
    if (!signature) {
      console.error('No Stripe signature found')
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET not configured')
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    // Additional validation
    if (bodyString.length === 0) {
      console.error('Empty body received')
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
      console.error('Webhook signature verification failed:', err.message)
      console.error('Error details:', err)
      console.error('Body being verified:', bodyString.substring(0, 200))
      console.error('Signature being used:', signature)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log('Webhook received:', event.type, 'Event ID:', event.id)
    
    await connectDB()
    console.log('Database connected')
    
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      
      console.log('Checkout session completed:', session.id)
      console.log('Session metadata:', session.metadata)
      
      // Find payment by session ID
      const payment = await Payment.findOne({ stripeSessionId: session.id })
        .populate('bookingId')

      if (!payment) {
        console.error('Payment not found for session:', session.id)
        console.log('Available payments with stripeSessionId:', await Payment.find({ stripeSessionId: { $exists: true } }).select('stripeSessionId'))
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
      }

      console.log('Found payment:', {
        id: payment._id,
        bookingId: payment.bookingId,
        status: payment.status,
        stripeSessionId: payment.stripeSessionId
      })

      // Update payment status
      const updatedPayment = await Payment.findByIdAndUpdate(payment._id, {
        status: 'COMPLETED',
        updatedAt: new Date(),
      }, { new: true })

      console.log('Updated payment status to COMPLETED:', updatedPayment?.status)

      // Update booking status
      const updatedBooking = await Booking.findByIdAndUpdate(payment.bookingId, { 
        status: 'CONFIRMED',
        updatedAt: new Date(),
      }, { new: true })
      
      console.log('Updated booking status to CONFIRMED:', updatedBooking?.status)
    } else {
      console.log('Unhandled event type:', event.type)
      // Return success for unhandled events to prevent retries
      return NextResponse.json({ received: true, message: `Unhandled event type: ${event.type}` })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: 'Failed to process webhook', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}