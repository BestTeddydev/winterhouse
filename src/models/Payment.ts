import mongoose, { Document, Schema } from 'mongoose'

export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
export type PaymentType = 'FULL' | 'PARTIAL' | 'REMAINING'

export interface IPayment extends Document {
  bookingId: mongoose.Types.ObjectId
  amount: number
  currency: string
  status: PaymentStatus
  paymentMethod?: string
  paymentType: PaymentType
  totalAmount: number // Total amount for the booking
  paidAmount: number // Amount already paid
  remainingAmount: number // Amount remaining to be paid
  stripeSessionId?: string
  stripePaymentIntentId?: string
  stripeChargeId?: string
  isManualPayment?: boolean
  manualPaymentNotes?: string
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
  paymentType: { 
    type: String, 
    enum: ['FULL', 'PARTIAL', 'REMAINING'], 
    default: 'FULL' 
  },
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  remainingAmount: { type: Number, default: 0 },
  stripeSessionId: { type: String, unique: true, sparse: true },
  stripePaymentIntentId: { type: String, unique: true, sparse: true },
  stripeChargeId: { type: String, unique: true, sparse: true },
  isManualPayment: { type: Boolean, default: false },
  manualPaymentNotes: { type: String },
}, {
  timestamps: true,
})

export default mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema)
