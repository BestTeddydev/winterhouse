import Omise from 'omise'

const omise = Omise({
  publicKey: process.env.OMISE_PUBLIC_KEY!,
  secretKey: process.env.OMISE_SECRET_KEY!,
})

export interface CreateChargeParams {
  amount: number // in satang (1 THB = 100 satang)
  currency: string
  description: string
  source?: string
  return_uri?: string
}

export async function createCharge(params: CreateChargeParams) {
  try {
    const charge = await omise.charges.create({
      amount: params.amount,
      currency: params.currency,
      description: params.description,
      source: params.source,
      return_uri: params.return_uri,
    })
    return charge
  } catch (error) {
    console.error('Error creating Omise charge:', error)
    throw error
  }
}

export async function retrieveCharge(chargeId: string) {
  try {
    const charge = await omise.charges.retrieve(chargeId)
    return charge
  } catch (error) {
    console.error('Error retrieving Omise charge:', error)
    throw error
  }
}

export default omise

