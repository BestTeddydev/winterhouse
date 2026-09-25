import { getDb } from './firebase'

// Register every model so populate() can resolve refs regardless of which route imported what
import '@/models/AddOn'
import '@/models/Booking'
import '@/models/Building'
import '@/models/CampingBlock'
import '@/models/CampingBlockBlock'
import '@/models/EmployeeAttendance'
import '@/models/Payment'
import '@/models/Room'
import '@/models/RoomBlock'
import '@/models/SiteMap'
import '@/models/User'

// Firestore needs no connection; kept so routes keep calling `await connectDB()`
export default async function connectDB() {
  return getDb()
}
