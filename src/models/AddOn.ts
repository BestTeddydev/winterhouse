import mongoose, { Document, Schema } from 'mongoose'

export interface IAddOn extends Document {
  name: string
  description?: string
  price: number // ราคาต่อหน่วย
  unit?: string // หน่วย เช่น "ชั่วโมง", "ครั้ง", "ชุด"
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
  isActive: { 
    type: Boolean, 
    default: true 
  },
}, {
  timestamps: true,
})

// Index for efficient queries
AddOnSchema.index({ isActive: 1 })

export default mongoose.models.AddOn || mongoose.model<IAddOn>('AddOn', AddOnSchema)

