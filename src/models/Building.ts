import { Document, Schema, model } from '@/lib/odm'
import { BUILDING_TYPES, type BuildingType } from '@/lib/buildingTypes'

export interface IBuilding extends Document {
  name: string
  description: string
  buildingType: BuildingType
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
    enum: BUILDING_TYPES,
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

export default model<IBuilding>('Building', BuildingSchema)
