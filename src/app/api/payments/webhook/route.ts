import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Payment from '@/models/Payment'
import Booking from '@/models/Booking'
import Room from '@/models/Room'
import User from '@/models/User'
import stripe from '@/lib/stripe'
import { Stripe } from 'stripe'
import { sendEmailNotification, formatPaymentNotificationEmail } from '@/lib/email'
import { sendLineNotification, formatPaymentThankYouMessage } from '@/lib/line'

export async function POST(request: NextRequest) {
  try {
    console.log('Webhook received, processing...')
    
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 })
    }
    
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
      console.log('Session metadata:', session.metadata)
      
      // Find payment by session ID first, then by bookingId from metadata
      let payment = await Payment.findOne({ stripeSessionId: session.id })
      
      if (!payment && session.metadata?.bookingId) {
        payment = await Payment.findOne({ bookingId: session.metadata.bookingId })
      }

      if (!payment) {
        console.error('Payment not found for session:', session.id, 'metadata:', session.metadata)
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
      }
      

      // Update payment status
      const updatedPayment = await Payment.findOneAndUpdate({_id: payment._id}, {
        status: 'COMPLETED',
      }, { new: true,upsert: true })

      // Handle remaining payment logic
      if (payment.paymentType === 'REMAINING') {
        // Update the current payment record (which is the same as the original for remaining payments)
        await Payment.findByIdAndUpdate(payment._id, {
          paidAmount: payment.totalAmount,
          remainingAmount: 0,
          status: 'COMPLETED',
        })
      }

      // Update booking status
      const updatedBooking = await Booking.findOneAndUpdate({_id: payment.bookingId}, { 
        status: 'CONFIRMED',
        updatedAt: new Date(),
      }, { new: true,upsert: true })
      
      console.log('Updated booking status to CONFIRMED:', updatedBooking?.status)

      // Send notifications after successful payment
      if (updatedBooking) {
        try {
          // Populate booking with room and user data
          const bookingWithRoom = await Booking.findById(updatedBooking._id)
            .populate('roomId')
            .populate('userId')
          
          if (bookingWithRoom) {
        
            
            // Send email notification to admin
            if (process.env.ADMIN_EMAIL) {
              const adminEmailHtml = formatPaymentNotificationEmail(bookingWithRoom, updatedPayment)
              await sendEmailNotification({
                to: process.env.ADMIN_EMAIL,
                subject: `💰 การชำระเงินใหม่ - ${bookingWithRoom.roomId?.name || 'Room'}`,
                html: adminEmailHtml
              })
              console.log('Admin email notification sent')
            }

            // Send LINE notification to customer if they have LINE ID
            if (bookingWithRoom.userId?.lineUserId) {
              const thankYouMessage = formatPaymentThankYouMessage(bookingWithRoom, updatedPayment)
              await sendLineNotification({
                userId: bookingWithRoom.userId.lineUserId,
                message: thankYouMessage
              })
              console.log('Customer LINE thank you message sent')
            } else {
              console.log('No LINE user ID found for customer')
            }

          }
        } catch (notificationError) {
          console.error('Error sending notifications:', notificationError)
          // Don't fail the webhook if notifications fail
        }
      }
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