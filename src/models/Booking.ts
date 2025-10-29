import mongoose, { Document, Schema } from 'mongoose'

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'

export interface IBooking extends Document {
  roomId: mongoose.Types.ObjectId
  roomIds?: mongoose.Types.ObjectId[] // สำหรับจองหลายห้อง
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
  discount?: number // Discount percentage (0-100)
  discountAmount?: number // Fixed discount amount in THB
  rooms?: Array<{
    roomId: mongoose.Types.ObjectId
    price: number
  }> // ราคาแต่ละห้อง
  createdAt: Date
  updatedAt: Date
}

const BookingSchema = new Schema<IBooking>({
  roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
  roomIds: [{ type: Schema.Types.ObjectId, ref: 'Room' }], // สำหรับจองหลายห้อง
  rooms: [{
    roomId: { type: Schema.Types.ObjectId, ref: 'Room' },
    price: { type: Number }
  }], // ราคาแต่ละห้องตามวันที่
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
  paymentType: { type: String, enum: ['FULL', 'PARTIAL'], default: 'FULL' },
  discount: { type: Number, default: 0, min: 0, max: 100 }, // Discount percentage
  discountAmount: { type: Number, default: 0, min: 0 } // Fixed discount amount
}, {
  timestamps: true,
})

// Index for availability queries
BookingSchema.index({ roomId: 1, checkIn: 1, checkOut: 1 })
BookingSchema.index({ userId: 1 })

export default mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema)
