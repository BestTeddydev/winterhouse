import mongoose, { Document, Schema } from 'mongoose'

export interface IHotspot {
  x: number
  y: number
  title: string
  description: string
}

export interface IRoom extends Document {
  name: string
  description: string
  imageUrl: string
  price: number
  capacity: number
  amenities: string[]
  isActive: boolean
  hotspots?: IHotspot[]
  createdAt: Date
  updatedAt: Date
}

const RoomSchema = new Schema<IRoom>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
  price: { type: Number, required: true },
  capacity: { type: Number, required: true },
  amenities: [{ type: String }],
  isActive: { type: Boolean, default: true },
  hotspots: [{
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
  }],
}, {
  timestamps: true,
})

export default mongoose.models.Room || mongoose.model<IRoom>('Room', RoomSchema)
