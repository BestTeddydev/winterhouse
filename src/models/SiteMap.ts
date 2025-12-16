import mongoose, { Document, Schema } from 'mongoose'

export interface ISiteMap extends Document {
  name: string
  description: string
  imageUrl: string
  type: 'accommodation' | 'camping' // ประเภทแผนผัง: accommodation = ห้องพัก, camping = ลานกางเต๊นท์
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const SiteMapSchema = new Schema<ISiteMap>({
  name: {
    type: String,
    required: true,
    trim: true,
    default: 'แผนผังหลัก'
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  imageUrl: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['accommodation', 'camping'],
    default: 'accommodation',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
}, {
  timestamps: true,
})

// Index for efficient queries
SiteMapSchema.index({ isActive: 1, type: 1 })

export default mongoose.models.SiteMap || mongoose.model<ISiteMap>('SiteMap', SiteMapSchema)

