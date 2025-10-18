import mongoose, { Document, Schema } from 'mongoose'

export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'

export interface IPayment extends Document {
  bookingId: mongoose.Types.ObjectId
  amount: number
  currency: string
  status: PaymentStatus
  paymentMethod?: string
  omiseChargeId?: string
  stripeSessionId?: string
  stripePaymentIntentId?: string
  stripeChargeId?: string
  createdAt: Date
  updatedAt: Date
}

const PaymentSchema = new Schema<IPayment>({
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'thb' },
  status: { 
    type: String, 
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED'], 
    default: 'PENDING' 
  },
  paymentMethod: { type: String },
  omiseChargeId: { type: String, unique: true, sparse: true },
  stripeSessionId: { type: String, unique: true, sparse: true },
  stripePaymentIntentId: { type: String, unique: true, sparse: true },
  stripeChargeId: { type: String, unique: true, sparse: true },
}, {
  timestamps: true,
})

export default mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema)
