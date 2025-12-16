import mongoose, { Document, Schema } from 'mongoose'

export interface ICampingBlock extends Document {
  name: string
  description: string
  imageUrls: string[] // รูปภาพบล็อค
  pricePerPerson: number // ราคาต่อคน
  maxCapacity: number // ความจุสูงสุด (จำนวนคน)
  minCapacity?: number // ความจุขั้นต่ำ (จำนวนคน)
  amenities: string[] // สิ่งอำนวยความสะดวก
  buildingId?: mongoose.Types.ObjectId // เชื่อมโยงกับ Building (ถ้ามี)
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const CampingBlockSchema = new Schema<ICampingBlock>({
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
  pricePerPerson: { 
    type: Number, 
    required: true,
    min: 0 
  },
  maxCapacity: { 
    type: Number, 
    required: true,
    min: 1 
  },
  minCapacity: { 
    type: Number, 
    min: 1,
    default: 1
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
CampingBlockSchema.index({ buildingId: 1 })
CampingBlockSchema.index({ isActive: 1 })
CampingBlockSchema.index({ pricePerPerson: 1 })

export default mongoose.models.CampingBlock || mongoose.model<ICampingBlock>('CampingBlock', CampingBlockSchema)

