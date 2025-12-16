import mongoose, { Document, Schema } from 'mongoose'

export interface IRoomBlock extends Document {
  roomId: mongoose.Types.ObjectId
  startDate: Date
  endDate: Date
  reason?: string // เหตุผลในการล็อค เช่น "ซ่อมแซม", "ปิดใช้งานชั่วคราว"
  isActive: boolean
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const RoomBlockSchema = new Schema<IRoomBlock>({
  roomId: {
    type: Schema.Types.ObjectId,
    ref: 'Room',
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
RoomBlockSchema.index({ roomId: 1, startDate: 1, endDate: 1 })
RoomBlockSchema.index({ isActive: 1, startDate: 1, endDate: 1 })

export default mongoose.models.RoomBlock || mongoose.model<IRoomBlock>('RoomBlock', RoomBlockSchema)

