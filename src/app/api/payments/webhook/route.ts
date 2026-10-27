import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import connectDB from '@/lib/db'
import { constructWebhookEvent } from '@/lib/stripe'
import { errorResponse } from '@/server/errors'
import { handleCheckoutCompleted } from '@/server/services/payments'

/**
 * Checkout events that can mean the guest paid. Cards are paid when the checkout completes;
 * PromptPay may complete unpaid and be paid later (async_payment_succeeded).
 */
const PAID_EVENTS = new Set(['checkout.session.completed', 'checkout.session.async_payment_succeeded'])

/** Stripe webhook (signature-verified). Only paid checkouts change data. */
export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature')
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!signature) return NextResponse.json({ error: 'No signature' }, { status: 400 })
  if (!secret) {
    console.error('Stripe webhook: STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    // The raw body is required for signature verification
    event = constructWebhookEvent(await request.text(), signature, secret)
  } catch (error) {
    // Usually STRIPE_WEBHOOK_SECRET is not this endpoint's signing secret (whsec_..., per endpoint and per test/live mode)
    console.error('Stripe webhook: signature verification failed:', (error as Error).message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (!PAID_EVENTS.has(event.type)) {
    return NextResponse.json({ received: true, message: `Unhandled event type: ${event.type}` })
  }

  const checkout = event.data.object as Stripe.Checkout.Session
  // A completed PromptPay checkout may still be unpaid: its async_payment_succeeded event follows
  if (checkout.payment_status === 'unpaid') {
    return NextResponse.json({ received: true, message: 'Checkout not paid yet' })
  }

  try {
    await connectDB()
    const result = await handleCheckoutCompleted(checkout)
    return NextResponse.json({ received: true, ...result })
  } catch (error) {
    console.error(`Stripe webhook: failed to process ${event.type} for checkout ${checkout.id}:`, error)
    return errorResponse(error, 'Failed to process webhook')
  }
}
