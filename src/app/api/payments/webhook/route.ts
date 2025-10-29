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
      

      // Get booking to check current status
      const booking = await Booking.findById(payment.bookingId)
      
      if (!booking) {
        console.error('Booking not found for payment:', payment._id)
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      }

      // Calculate updated payment amounts
      let updatedPaidAmount = payment.paidAmount || 0
      let updatedRemainingAmount = payment.remainingAmount || 0

      if (payment.paymentType === 'REMAINING') {
        // Remaining payment - add the payment amount to existing paid amount
        // The payment.amount is the remaining amount that was just paid
        updatedPaidAmount = (payment.paidAmount || 0) + payment.amount
        updatedRemainingAmount = 0
      } else if (payment.paymentType === 'PARTIAL') {
        // Partial payment (deposit) - this is the first payment
        updatedPaidAmount = payment.amount
        updatedRemainingAmount = payment.totalAmount - payment.amount
      } else {
        // Full payment
        updatedPaidAmount = payment.totalAmount
        updatedRemainingAmount = 0
      }

      // Update payment status and amounts
      const updatedPayment = await Payment.findByIdAndUpdate(
        payment._id,
        {
          status: 'COMPLETED',
          paidAmount: updatedPaidAmount,
          remainingAmount: updatedRemainingAmount,
        },
        { new: true }
      )

      // Update booking status only if this is the initial payment (booking status is PENDING)
      // If booking is already CONFIRMED, it means this is a remaining payment
      let updatedBooking = booking
      
      if (booking.status === 'PENDING') {
        // First payment completed - confirm the booking
        updatedBooking = await Booking.findByIdAndUpdate(
          payment.bookingId,
          {
            status: 'CONFIRMED',
            updatedAt: new Date(),
          },
          { new: true }
        )
        console.log('Booking confirmed after initial payment:', updatedBooking?._id)
      } else if (booking.status === 'CONFIRMED' && payment.paymentType === 'REMAINING') {
        // Remaining payment - just update the booking timestamp
        updatedBooking = await Booking.findByIdAndUpdate(
          payment.bookingId,
          {
            updatedAt: new Date(),
          },
          { new: true }
        )
        console.log('Remaining payment completed for booking:', updatedBooking?._id)
      } else {
        console.log('Booking already confirmed, no status update needed')
      }

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