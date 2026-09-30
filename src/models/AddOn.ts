import { Document, Schema, model } from '@/lib/odm'
import { ADD_ON_PRICING, type AddOnPricing } from '@/lib/bookingPrice'

export interface IAddOn extends Document {
  name: string
  description?: string
  price: number // ราคาต่อหน่วย
  unit?: string // หน่วย เช่น "ชั่วโมง", "ครั้ง", "ชุด"
  pricing: AddOnPricing // once per booking or per night (e.g. extra bed)
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const AddOnSchema = new Schema<IAddOn>({
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  description: { 
    type: String, 
    trim: true 
  },
  price: { 
    type: Number, 
    required: true,
    min: 0 
  },
  unit: { 
    type: String, 
    trim: true,
    default: 'หน่วย'
  },
  pricing: {
    type: String,
    enum: ADD_ON_PRICING,
    default: 'PER_STAY'
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
}, {
  timestamps: true,
})

// Index for efficient queries
AddOnSchema.index({ isActive: 1 })

export default model<IAddOn>('AddOn', AddOnSchema)

