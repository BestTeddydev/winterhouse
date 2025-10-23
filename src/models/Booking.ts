import mongoose, { Document, Schema } from 'mongoose'

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'

export interface IBooking extends Document {
  roomId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  paymentId?: mongoose.Types.ObjectId
  checkIn: Date
  checkOut: Date
  totalPrice: number
  status: BookingStatus
  guestName: string
  guestEmail?: string
  guestPhone?: string
  guestCount?: number
  specialRequests?: string
  isManualBooking?: boolean
  manualBookingNotes?: string
  createdBy?: mongoose.Types.ObjectId
  paymentType?: 'FULL' | 'PARTIAL'
  createdAt: Date
  updatedAt: Date
}

const BookingSchema = new Schema<IBooking>({
  roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  totalPrice: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'], 
    default: 'PENDING' 
  },
  guestName: { type: String, required: true },
  guestEmail: { type: String },
  guestPhone: { type: String },
  guestCount: { type: Number, default: 1 },
  specialRequests: { type: String },
  isManualBooking: { type: Boolean, default: false },
  manualBookingNotes: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  paymentType: { type: String, enum: ['FULL', 'PARTIAL'], default: 'FULL' }
}, {
  timestamps: true,
})

// Index for availability queries
BookingSchema.index({ roomId: 1, checkIn: 1, checkOut: 1 })
BookingSchema.index({ userId: 1 })

export default mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema)
