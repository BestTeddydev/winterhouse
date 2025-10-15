import mongoose from 'mongoose'

export interface BuildingHotspot {
  id: string
  x: number
  y: number
  buildingName: string
  buildingType: 'accommodation' | 'cafe' | 'restaurant' | 'facility' | 'parking' | 'garden'
  rooms: string[]
  description: string
  facilities: string[]
}

export interface ISiteMap extends mongoose.Document {
  imageUrl: string
  hotspots: BuildingHotspot[]
  createdAt: Date
  updatedAt: Date
}

const BuildingHotspotSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  x: {
    type: Number,
    required: true,
  },
  y: {
    type: Number,
    required: true,
  },
  buildingName: {
    type: String,
    required: true,
  },
  buildingType: {
    type: String,
    enum: ['accommodation', 'cafe', 'restaurant', 'facility', 'parking', 'garden'],
    default: 'accommodation',
  },
  rooms: [{
    type: String,
  }],
  description: {
    type: String,
    default: '',
  },
  facilities: [{
    type: String,
  }],
})

const SiteMapSchema = new mongoose.Schema(
  {
    imageUrl: {
      type: String,
      required: true,
    },
    hotspots: [BuildingHotspotSchema],
  },
  {
    timestamps: true,
  }
)

export default mongoose.models.SiteMap || mongoose.model<ISiteMap>('SiteMap', SiteMapSchema)

