import Stripe from 'stripe'

// Only create Stripe client if STRIPE_SECRET_KEY is available
let stripe: Stripe | null = null

if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-09-30.clover',
  })
}

export async function createQRCodePayment(params: {
  amount: number
  currency: string
  description: string
  metadata?: Record<string, string>
}) {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.')
  }
  
  try {
    
    // Create Payment Intent for QR Code
    const paymentIntent = await stripe.paymentIntents.create({
      amount: params.amount,
      currency: params.currency,
      description: params.description,
      metadata: params.metadata || {},
      // payment_method_types: ['card', 'promptpay'],
      automatic_payment_methods: {
        enabled: true,
      },
    })

    // Create Payment Link for QR Code
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price_data: {
            currency: params.currency,
            product_data: {
              name: params.description,
            },
            unit_amount: params.amount,
          },
          quantity: 1,
        },
      ],
      metadata: params.metadata || {},
    })

    return {
      paymentIntent,
      paymentLink,
      qrCodeUrl: paymentLink.url,
    }
  } catch (error: any) {
    console.error('Error creating Stripe QR Code payment:', error)
    throw error
  }
}

export async function createCheckoutSession(params: {
  amount: number
  currency: string
  description: string
  metadata?: Record<string, string>
  success_url: string
  cancel_url: string
}) {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.')
  }
  
  try {
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: params.currency,
            product_data: {
              name: params.description,
            },
            unit_amount: params.amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: params.success_url,
      cancel_url: params.cancel_url,
      metadata: params.metadata || {},
    })
    
    return session
  } catch (error: any) {
    console.error('Error creating Stripe Checkout Session:', error)
    throw error
  }
}

export default stripe
