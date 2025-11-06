import mongoose, { Document, Schema } from 'mongoose'

export type AttendanceStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface IEmployeeAttendance extends Document {
  employeeId: mongoose.Types.ObjectId
  checkInDate: Date
  checkInTime: Date
  checkoutTime?: Date
  location?: string
  notes?: string
  status: AttendanceStatus
  approvedBy?: mongoose.Types.ObjectId
  approvedAt?: Date
  rejectionReason?: string
  createdAt: Date
  updatedAt: Date
}

const EmployeeAttendanceSchema = new Schema<IEmployeeAttendance>({
  employeeId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  checkInDate: { 
    type: Date, 
    required: true,
    index: true
  },
  checkInTime: { 
    type: Date, 
    required: true,
    default: Date.now
  },
  checkoutTime: { 
    type: Date 
  },
  location: { 
    type: String 
  },
  notes: { 
    type: String 
  },
  status: { 
    type: String, 
    enum: ['PENDING', 'APPROVED', 'REJECTED'], 
    default: 'PENDING',
    index: true
  },
  approvedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  },
  approvedAt: { 
    type: Date 
  },
  rejectionReason: { 
    type: String 
  }
}, {
  timestamps: true,
})

// Compound index to prevent duplicate check-ins on same date
// Note: Using sparse unique index to handle cases where checkInDate might be null
EmployeeAttendanceSchema.index(
  { employeeId: 1, checkInDate: 1 }, 
  { 
    unique: true,
    partialFilterExpression: { checkInDate: { $exists: true } }
  }
)

export default mongoose.models.EmployeeAttendance || mongoose.model<IEmployeeAttendance>('EmployeeAttendance', EmployeeAttendanceSchema)

