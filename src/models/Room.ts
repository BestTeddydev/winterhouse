import mongoose, { Document, Schema } from 'mongoose'

export interface IRoom extends Document {
  name: string
  description: string
  imageUrls: string[]
  price: number // Base price (for backward compatibility)
  pricing: {
    weekday: number   // Monday-Thursday
    weekend: number   // Friday-Sunday
    holiday: number   // Holiday rates
  }
  seasonalPricing?: Array<{
    name: string // ชื่อช่วงเวลา เช่น "ช่วงฤดูหนาว"
    startMonth: number // เดือนเริ่มต้น (1-12)
    endMonth: number // เดือนสิ้นสุด (1-12)
    weekday: number // ราคาวันธรรมดาในช่วงนี้
    weekend: number // ราคาวันหยุดสุดสัปดาห์ในช่วงนี้
    holiday: number // ราคาวันหยุดนักขัตฤกษ์ในช่วงนี้
  }>
  capacity: number
  amenities: string[]
  buildingId?: mongoose.Types.ObjectId
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const RoomSchema = new Schema<IRoom>({
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  description: { 
    type: String, 
    required: true,
    trim: true 
  },
  imageUrls: [{ 
    type: String, 
    required: true 
  }],
  price: { 
    type: Number, 
    required: true,
    min: 0 
  },
  pricing: {
    weekday: { type: Number, min: 0 },
    weekend: { type: Number, min: 0 },
    holiday: { type: Number, min: 0 }
  },
  seasonalPricing: [{
    name: { type: String, trim: true },
    startMonth: { type: Number, min: 1, max: 12 },
    endMonth: { type: Number, min: 1, max: 12 },
    weekday: { type: Number, min: 0 },
    weekend: { type: Number, min: 0 },
    holiday: { type: Number, min: 0 }
  }],
  capacity: { 
    type: Number, 
    required: true,
    min: 1 
  },
  amenities: [{
    type: String,
    trim: true
  }],
  buildingId: {
    type: Schema.Types.ObjectId,
    ref: 'Building',
    required: false
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
}, {
  timestamps: true,
})

// Index for efficient queries
RoomSchema.index({ buildingId: 1 })
RoomSchema.index({ isActive: 1 })
RoomSchema.index({ price: 1 })

export default mongoose.models.Room || mongoose.model<IRoom>('Room', RoomSchema)
