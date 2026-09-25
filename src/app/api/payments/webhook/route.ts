import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db'
import Payment from '@/models/Payment'
import Booking from '@/models/Booking'
import User from '@/models/User'
import stripe from '@/lib/stripe'
import { Stripe } from 'stripe'
import { sendEmailNotification, formatPaymentNotificationEmail } from '@/lib/email'
import { sendLineNotification, formatPaymentThankYouMessage, formatBookingNotification } from '@/lib/line'

export async function POST(request: NextRequest) {
  try {
    
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
    } catch (err: any) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    await connectDB()
    
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      
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
      } else if (booking.status === 'CONFIRMED' && payment.paymentType === 'REMAINING') {
        // Remaining payment - just update the booking timestamp
        updatedBooking = await Booking.findByIdAndUpdate(
          payment.bookingId,
          {
            updatedAt: new Date(),
          },
          { new: true }
        )
      } else {
      }

      // Send notifications after successful payment
      if (updatedBooking) {
        try {
          // Populate booking with room and user data
          const bookingWithRoom = await Booking.findById(updatedBooking._id)
            .populate('roomId')
            .populate('roomIds')
            .populate('campingBlockId')
            .populate('campingBlockIds')
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
            }

            // Send LINE notification to customer if they have LINE ID
            if (bookingWithRoom.userId?.lineUserId) {
              const thankYouMessage = formatPaymentThankYouMessage(bookingWithRoom, updatedPayment)
              await sendLineNotification({
                userId: bookingWithRoom.userId.lineUserId,
                message: thankYouMessage
              })
            } else {
            }

            // Send LINE notification to OWNER users for customer bookings (not manual bookings)
            // Manual bookings already sent notification when created by admin
            if (!bookingWithRoom.isManualBooking) {
              try {
                const ownerUsers = await User.find({ 
                  role: 'OWNER',
                  lineUserId: { $exists: true, $ne: null }
                }).select('lineUserId name')
                
                if (ownerUsers.length > 0) {
                  // Format booking notification message
                  const notificationMessage = formatBookingNotification(bookingWithRoom)
                  
                  // Send notification to all OWNER users
                  const notificationPromises = ownerUsers
                    .filter(owner => owner.lineUserId)
                    .map(owner => 
                      sendLineNotification({
                        userId: owner.lineUserId!,
                        message: notificationMessage
                      }).catch(error => {
                        console.error(`Error sending LINE notification to owner ${owner.name} (${owner.lineUserId}):`, error)
                      })
                    )
                  
                  await Promise.allSettled(notificationPromises)
                }
              } catch (ownerNotificationError) {
                console.error('Error sending LINE notifications to OWNER:', ownerNotificationError)
                // Don't fail the webhook if owner notifications fail
              }
            } else {
            }

          }
        } catch (notificationError) {
          console.error('Error sending notifications:', notificationError)
          // Don't fail the webhook if notifications fail
        }
      }
    } else {
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