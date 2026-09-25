import { Document, Schema, model } from '@/lib/odm'

export interface ICampingBlockBlock extends Document {
  campingBlockId: string
  startDate: Date
  endDate: Date
  reason?: string // เหตุผลในการล็อค เช่น "ซ่อมแซม", "ปิดใช้งานชั่วคราว"
  isActive: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

const CampingBlockBlockSchema = new Schema<ICampingBlockBlock>({
  campingBlockId: {
    type: Schema.Types.ObjectId,
    ref: 'CampingBlock',
    required: true,
    index: true
  },
  startDate: {
    type: Date,
    required: true,
    index: true
  },
  endDate: {
    type: Date,
    required: true,
    index: true
  },
  reason: {
    type: String,
    trim: true,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
})

// Compound index for efficient queries
CampingBlockBlockSchema.index({ campingBlockId: 1, startDate: 1, endDate: 1 })
CampingBlockBlockSchema.index({ isActive: 1, startDate: 1, endDate: 1 })

export default model<ICampingBlockBlock>('CampingBlockBlock', CampingBlockBlockSchema)

