# 🔄 Migration from Prisma to Mongoose

คู่มือการเปลี่ยนจาก Prisma เป็น Mongoose สำหรับ MongoDB

## ✅ สิ่งที่เปลี่ยนไป

### 1. **Dependencies**
```json
// เก่า (Prisma)
"@prisma/client": "^6.17.1",
"@next-auth/prisma-adapter": "^1.0.7",
"prisma": "^6.17.1"

// ใหม่ (Mongoose)
"mongoose": "^8.8.4",
"@next-auth/mongodb-adapter": "^2.3.0"
```

### 2. **Database Connection**
```typescript
// เก่า (Prisma)
import { prisma } from '@/lib/prisma'

// ใหม่ (Mongoose)
import connectDB from '@/lib/mongodb'
await connectDB()
```

### 3. **Models**
```typescript
// เก่า (Prisma Schema)
model User {
  id    String @id @default(auto()) @map("_id") @db.ObjectId
  name  String?
  email String? @unique
}

// ใหม่ (Mongoose Schema)
const UserSchema = new Schema({
  name: { type: String },
  email: { type: String, unique: true, sparse: true },
})
```

### 4. **Queries**
```typescript
// เก่า (Prisma)
const users = await prisma.user.findMany({
  where: { role: 'ADMIN' }
})

// ใหม่ (Mongoose)
const users = await User.find({ role: 'ADMIN' })
```

## 🚀 ข้อดีของ Mongoose

- ✅ **No Replica Set Required** - ใช้ MongoDB standalone ได้
- ✅ **Native MongoDB** - เขียน queries แบบ MongoDB
- ✅ **Schema Validation** - Built-in validation
- ✅ **Middleware Support** - Pre/post hooks
- ✅ **Population** - Easy joins
- ✅ **TypeScript Support** - Full type safety

## 📦 ติดตั้ง Dependencies

```bash
# ถ้าใช้ Docker
docker-compose down
docker-compose up -d --build

# ถ้ารันแบบปกติ
npm install
```

## 🔧 Setup Database

### 1. เริ่ม MongoDB
```bash
# ใช้ Docker (ง่ายที่สุด)
docker-compose up -d

# หรือติดตั้ง MongoDB local
brew install mongodb-community@7
brew services start mongodb-community@7
```

### 2. ตรวจสอบ Connection
```bash
# ดู logs
docker-compose logs -f app

# ควรเห็น: "MongoDB connected successfully"
```

### 3. สร้างข้อมูลตัวอย่าง
```bash
# เข้า MongoDB shell
make db-shell

# สร้าง Admin User
db.users.insertOne({
  name: "Admin User",
  email: "admin@example.com",
  role: "ADMIN",
  createdAt: new Date(),
  updatedAt: new Date()
})

# สร้างห้องพัก
db.rooms.insertOne({
  name: "Deluxe Room",
  description: "Beautiful room with sea view",
  imageUrl: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800",
  price: 1500,
  capacity: 2,
  amenities: ["WiFi", "TV", "Air Conditioning"],
  isActive: true,
  hotspots: [
    { x: 30, y: 40, title: "Bed", description: "King size bed" }
  ],
  createdAt: new Date(),
  updatedAt: new Date()
})
```

## 🎯 API Changes

### Rooms API
```typescript
// GET /api/rooms
const rooms = await Room.find({ isActive: true }).sort({ createdAt: -1 })

// POST /api/rooms
const room = new Room({ name, description, price, ... })
await room.save()

// PUT /api/rooms/[id]
const room = await Room.findByIdAndUpdate(id, data, { new: true })

// DELETE /api/rooms/[id]
await Room.findByIdAndDelete(id)
```

### Bookings API
```typescript
// GET /api/bookings
const bookings = await Booking.find({ userId }).populate('room')

// POST /api/bookings
const booking = new Booking({ roomId, userId, checkIn, checkOut, ... })
await booking.save()
```

## 🔍 MongoDB Queries

### Find Documents
```javascript
// Find all active rooms
db.rooms.find({ isActive: true })

// Find user by email
db.users.findOne({ email: "user@example.com" })

// Find bookings for a room
db.bookings.find({ roomId: ObjectId("...") })
```

### Aggregation
```javascript
// Count bookings by status
db.bookings.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 } } }
])

// Revenue by month
db.bookings.aggregate([
  { $match: { status: "COMPLETED" } },
  { $group: {
    _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
    revenue: { $sum: "$totalPrice" }
  }}
])
```

## 🛠️ Development Tools

### 1. MongoDB Compass
- GUI สำหรับ MongoDB
- Connection: `mongodb://admin:admin123@localhost:27017/?authSource=admin`

### 2. Mongo Express
```bash
# เริ่ม Mongo Express
docker-compose --profile debug up -d mongo-express

# เข้าถึงที่ http://localhost:8081
# Login: admin / admin
```

### 3. MongoDB Shell
```bash
# เข้า shell
make db-shell

# หรือ
docker-compose exec db mongosh -u admin -p admin123 --authenticationDatabase admin winterhouse
```

## 📝 Environment Variables

```env
# MongoDB (ง่ายขึ้น - ไม่ต้อง replica set)
DATABASE_URL="mongodb://admin:admin123@db:27017/winterhouse?authSource=admin"

# หรือ local MongoDB
DATABASE_URL="mongodb://localhost:27017/winterhouse"
```

## 🎨 Frontend Changes

Frontend ไม่ต้องเปลี่ยนอะไร! API endpoints เหมือนเดิม

## 🔄 Migration Script

ถ้าคุณมีข้อมูลใน Prisma อยู่แล้ว:

```typescript
// scripts/migrate-from-prisma.ts
import { PrismaClient } from '@prisma/client'
import connectDB from '../lib/mongodb'
import Room from '../models/Room'
import User from '../models/User'

const prisma = new PrismaClient()

async function migrate() {
  await connectDB()
  
  // Migrate users
  const users = await prisma.user.findMany()
  for (const user of users) {
    await User.create({
      name: user.name,
      email: user.email,
      role: user.role,
      lineUserId: user.lineUserId,
    })
  }
  
  // Migrate rooms
  const rooms = await prisma.room.findMany()
  for (const room of rooms) {
    await Room.create({
      name: room.name,
      description: room.description,
      imageUrl: room.imageUrl,
      price: room.price,
      capacity: room.capacity,
      amenities: room.amenities,
      isActive: room.isActive,
      hotspots: room.hotspots,
    })
  }
  
  console.log('Migration completed!')
}

migrate().catch(console.error)
```

## 🚀 เริ่มใช้งาน

```bash
# 1. ติดตั้ง dependencies
npm install

# 2. เริ่ม MongoDB
docker-compose up -d

# 3. เริ่ม app
npm run dev

# 4. เปิดเบราว์เซอร์
open http://localhost:3000
```

## 🎯 ข้อดีที่ได้

1. **ง่ายขึ้น** - ไม่ต้อง replica set
2. **เร็วขึ้น** - Native MongoDB queries
3. **ยืดหยุ่น** - Schema validation
4. **Type Safe** - Full TypeScript support
5. **Middleware** - Pre/post hooks

---

**Mongoose ทำให้ MongoDB ใช้งานง่ายขึ้นมาก! 🚀**
