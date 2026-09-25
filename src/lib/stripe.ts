import Stripe from 'stripe'

let client: Stripe | null = null

function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.')
  }
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-09-30.clover' })
  return client
}

interface PaymentParams {
  /** In satang (1 THB = 100 satang) */
  amount: number
  currency: string
  description: string
  metadata: Record<string, string>
}

const lineItem = ({ amount, currency, description }: PaymentParams) => ({
  price_data: { currency, product_data: { name: description }, unit_amount: amount },
  quantity: 1,
})

/**
 * Payment Link for QR / PromptPay. Its id is stored on the payment and matched in the webhook
 * (checkout.session.completed carries `payment_link`). The link can be paid only once.
 */
export async function createQRCodePayment(params: PaymentParams) {
  const paymentLink = await getStripe().paymentLinks.create({
    line_items: [lineItem(params)],
    metadata: params.metadata,
    payment_intent_data: { metadata: params.metadata },
    restrictions: { completed_sessions: { limit: 1 } },
  })
  return { paymentLink, qrCodeUrl: paymentLink.url }
}

/** Stripe Checkout expires a little after the booking's payment hold (min. 30 minutes) */
const CHECKOUT_EXPIRES_SECONDS = 31 * 60

export async function createCheckoutSession(params: PaymentParams & { success_url: string; cancel_url: string }) {
  return getStripe().checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [lineItem(params)],
    mode: 'payment',
    success_url: params.success_url,
    cancel_url: params.cancel_url,
    metadata: params.metadata,
    expires_at: Math.floor(Date.now() / 1000) + CHECKOUT_EXPIRES_SECONDS,
  })
}

/** Verifies the Stripe signature and parses the webhook event (throws if invalid) */
export function constructWebhookEvent(body: string, signature: string, secret: string): Stripe.Event {
  return getStripe().webhooks.constructEvent(body, signature, secret)
}
