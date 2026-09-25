import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import connectDB from '@/lib/db'
import { constructWebhookEvent } from '@/lib/stripe'
import { errorResponse } from '@/server/errors'
import { handleCheckoutCompleted } from '@/server/services/payments'

/** Stripe webhook (signature-verified). Only checkout.session.completed changes data. */
export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature')
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!signature) return NextResponse.json({ error: 'No signature' }, { status: 400 })
  if (!secret) return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })

  let event: Stripe.Event
  try {
    // The raw body is required for signature verification
    event = constructWebhookEvent(await request.text(), signature, secret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true, message: `Unhandled event type: ${event.type}` })
  }

  try {
    await connectDB()
    const result = await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
    return NextResponse.json({ received: true, ...result })
  } catch (error) {
    return errorResponse(error, 'Failed to process webhook')
  }
}
