import * as mongoose from '@/lib/odm'
import { Document, Schema } from '@/lib/odm'

export interface IUser extends Document {
  name?: string
  email?: string
  emailVerified?: Date
  image?: string
  lineUserId?: string
  role: 'ADMIN' | 'CUSTOMER' | 'OWNER' | 'EMPLOYEE'
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>({
  name: { type: String },
  email: { type: String, sparse: true },
  emailVerified: { type: Date },
  image: { type: String },
  lineUserId: { type: String, unique: true, sparse: true,index: true },
  role: { type: String, enum: ['ADMIN', 'CUSTOMER', 'OWNER', 'EMPLOYEE'], default: 'CUSTOMER' },
}, {
  timestamps: true,
})

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
