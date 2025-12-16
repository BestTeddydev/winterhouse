import mongoose, { Document, Schema } from 'mongoose'

export interface IBuilding extends Document {
  name: string
  description: string
  buildingType: 'accommodation' | 'cafe' | 'restaurant' | 'facility' | 'parking' | 'garden' | 'camping'
  facilities: string[]
  x: number
  y: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const BuildingSchema = new Schema<IBuilding>({
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
  buildingType: {
    type: String,
    enum: ['accommodation', 'cafe', 'restaurant', 'facility', 'parking', 'garden', 'camping'],
    default: 'accommodation',
    required: true
  },
  facilities: [{
    type: String,
    trim: true
  }],
  x: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  y: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
}, {
  timestamps: true,
})

// Index for efficient queries
BuildingSchema.index({ isActive: 1 })
BuildingSchema.index({ buildingType: 1 })

export default mongoose.models.Building || mongoose.model<IBuilding>('Building', BuildingSchema)
