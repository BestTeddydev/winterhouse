import Stripe from 'stripe'

// Only create Stripe client if STRIPE_SECRET_KEY is available
let stripe: Stripe | null = null

if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-09-30.clover',
  })
}

export interface CreatePaymentIntentParams {
  amount: number // in satang (1 THB = 100 satang)
  currency: string
  description: string
  metadata?: Record<string, string>
  return_url?: string
}

export async function createPaymentIntent(params: CreatePaymentIntentParams) {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.')
  }
  
  try {
    console.log('Creating Stripe PaymentIntent with params:', {
      amount: params.amount,
      currency: params.currency,
      description: params.description,
      return_url: params.return_url
    })
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: params.amount,
      currency: params.currency,
      description: params.description,
      metadata: params.metadata || {},
      automatic_payment_methods: {
        enabled: true,
      },
      return_url: params.return_url,
    })
    
    console.log('Stripe PaymentIntent created successfully:', paymentIntent.id)
    return paymentIntent
  } catch (error: any) {
    console.error('Error creating Stripe PaymentIntent:', error)
    
    // Log more detailed error information
    if (error.code) {
      console.error('Stripe Error Code:', error.code)
    }
    if (error.message) {
      console.error('Stripe Error Message:', error.message)
    }
    if (error.type) {
      console.error('Stripe Error Type:', error.type)
    }
    
    throw error
  }
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
    console.log('Creating Stripe QR Code payment with params:', params)
    
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
    
    console.log('Stripe PaymentIntent created for QR Code:', paymentIntent.id)
    
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
    
    console.log('Stripe Payment Link created:', paymentLink.id)
    
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

export async function retrievePaymentIntent(paymentIntentId: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.')
  }
  
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    return paymentIntent
  } catch (error) {
    console.error('Error retrieving Stripe PaymentIntent:', error)
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
    
    console.log('Stripe Checkout Session created successfully:', session.id)
    return session
  } catch (error: any) {
    console.error('Error creating Stripe Checkout Session:', error)
    throw error
  }
}

export default stripe
