# 🍃 MongoDB Setup Guide - Winterhouse

คู่มือการใช้งาน MongoDB กับระบบ Winterhouse

## 📋 เนื้อหา

- [ทำไมต้องเปลี่ยนเป็น MongoDB](#ทำไมต้องเปลี่ยนเป็น-mongodb)
- [ความแตกต่างจาก PostgreSQL](#ความแตกต่างจาก-postgresql)
- [Quick Start](#quick-start)
- [การใช้งาน MongoDB](#การใช้งาน-mongodb)
- [Prisma กับ MongoDB](#prisma-กับ-mongodb)
- [GUI Tools](#gui-tools)
- [MongoDB Atlas (Cloud)](#mongodb-atlas-cloud)

---

## ทำไมต้องเปลี่ยนเป็น MongoDB?

### ข้อดีของ MongoDB:
- ✅ **Flexible Schema** - ไม่ต้อง migrate ทุกครั้งที่แก้ schema
- ✅ **JSON-like Documents** - เหมาะกับ JavaScript/TypeScript
- ✅ **Horizontal Scaling** - Scale ได้ง่ายกว่า
- ✅ **Fast Development** - พัฒนาได้เร็วขึ้น
- ✅ **Embedded Documents** - เก็บข้อมูล nested ได้ดี (hotspots, amenities)
- ✅ **MongoDB Atlas** - Cloud database ฟรี 512MB

### ข้อเสียที่ควรรู้:
- ❌ ไม่มี JOIN ที่ซับซ้อนเหมือน SQL
- ❌ ใช้ memory มากกว่า PostgreSQL
- ❌ ACID transactions จำกัดกว่า

---

## ความแตกต่างจาก PostgreSQL

### Schema Definition

**PostgreSQL:**
```prisma
model User {
  id    String @id @default(cuid())
  email String @unique
}
```

**MongoDB:**
```prisma
model User {
  id    String @id @default(auto()) @map("_id") @db.ObjectId
  email String @unique
}
```

### Data Types

| PostgreSQL | MongoDB | หมายเหตุ |
|------------|---------|----------|
| `String` | `String` | เหมือนกัน |
| `Int` | `Int` | เหมือนกัน |
| `Decimal` | `Float` | MongoDB ไม่มี Decimal |
| `@db.Text` | `String` | MongoDB ไม่มี Text type |
| `cuid()` | `auto()` | ObjectId (24 hex chars) |

### Relations

**PostgreSQL:**
```prisma
model Booking {
  userId String
  user   User @relation(fields: [userId], references: [id])
}
```

**MongoDB:**
```prisma
model Booking {
  userId String @db.ObjectId
  user   User @relation(fields: [userId], references: [id])
}
```

### Migrations

**PostgreSQL:**
```bash
npx prisma migrate dev
npx prisma migrate deploy
```

**MongoDB:**
```bash
npx prisma db push  # ไม่มี migration system
```

---

## Quick Start

### 1. เตรียม Environment

```bash
# คัดลอกไฟล์ MongoDB config
cp .env.mongodb .env

# แก้ไข .env
nano .env
```

**ตัวอย่าง .env:**
```env
DATABASE_URL="mongodb://admin:admin123@db:27017/winterhouse?authSource=admin&retryWrites=true&w=majority"
```

### 2. เริ่ม MongoDB ด้วย Docker

```bash
# เริ่ม services
make dev

# หรือ
docker-compose up -d
```

### 3. Push Schema to MongoDB

```bash
# Generate Prisma Client และ push schema
docker-compose exec app npx prisma generate
docker-compose exec app npx prisma db push

# ตรวจสอบ
docker-compose exec app npx prisma studio
```

---

## การใช้งาน MongoDB

### เข้าสู่ MongoDB Shell

```bash
# ใช้ Makefile
make db-shell

# หรือ docker-compose
docker-compose exec db mongosh -u admin -p admin123 --authenticationDatabase admin winterhouse
```

### คำสั่ง MongoDB พื้นฐาน

```javascript
// แสดง databases
show dbs

// ใช้ database
use winterhouse

// แสดง collections
show collections

// ดูข้อมูลใน collection
db.users.find()
db.users.find().pretty()

// หาข้อมูลตาม email
db.users.findOne({ email: "user@example.com" })

// นับจำนวน
db.users.countDocuments()

// Insert document
db.users.insertOne({
  name: "Test User",
  email: "test@example.com",
  role: "CUSTOMER"
})

// Update document
db.users.updateOne(
  { email: "test@example.com" },
  { $set: { role: "ADMIN" } }
)

// Delete document
db.users.deleteOne({ email: "test@example.com" })

// Drop collection
db.users.drop()

// สร้าง index
db.users.createIndex({ email: 1 }, { unique: true })

// ดู indexes
db.users.getIndexes()
```

### Advanced Queries

```javascript
// Find with conditions
db.bookings.find({
  status: "CONFIRMED",
  checkIn: { $gte: new Date("2024-01-01") }
})

// Aggregation
db.bookings.aggregate([
  { $match: { status: "CONFIRMED" } },
  { $group: {
      _id: "$roomId",
      totalBookings: { $sum: 1 },
      totalRevenue: { $sum: "$totalPrice" }
    }
  }
])

// Text search
db.rooms.find({ $text: { $search: "deluxe" } })

// Regex search
db.rooms.find({ name: /deluxe/i })
```

---

## Prisma กับ MongoDB

### 1. Schema Changes

หลังจากแก้ `schema.prisma`:

```bash
# Generate Prisma Client
npx prisma generate

# Push to MongoDB (no migrations)
npx prisma db push

# ถ้ามี data จะถาม confirm
npx prisma db push --accept-data-loss
```

### 2. Seed Data

สร้าง `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@winterhouse.com',
      role: 'ADMIN',
    },
  })

  // Create sample room
  const room = await prisma.room.create({
    data: {
      name: 'Deluxe Room',
      description: 'A beautiful deluxe room',
      imageUrl: 'https://picsum.photos/800/600',
      price: 1500,
      capacity: 2,
      amenities: ['WiFi', 'TV', 'Air Conditioning'],
      hotspots: [
        {
          x: 30,
          y: 40,
          title: 'King Size Bed',
          description: 'Comfortable king size bed'
        }
      ],
    },
  })

  console.log({ admin, room })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

เพิ่มใน `package.json`:

```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

รัน seed:

```bash
docker-compose exec app npx prisma db seed
```

### 3. Prisma Client Usage

MongoDB ObjectId handling:

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Create
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'John Doe',
  },
})
// user.id จะเป็น MongoDB ObjectId (24 hex string)

// Find by ID (ObjectId)
const user = await prisma.user.findUnique({
  where: { id: '507f1f77bcf86cd799439011' },
})

// Relations
const booking = await prisma.booking.create({
  data: {
    roomId: room.id,  // MongoDB ObjectId
    userId: user.id,  // MongoDB ObjectId
    checkIn: new Date(),
    checkOut: new Date(),
    totalPrice: 1500,
    guestName: 'John Doe',
    guestEmail: 'john@example.com',
    guestPhone: '0812345678',
  },
  include: {
    room: true,
    user: true,
  },
})
```

---

## GUI Tools

### 1. Prisma Studio

```bash
# เริ่ม Prisma Studio
make db-studio

# หรือ
docker-compose up -d prisma-studio

# เปิดเบราว์เซอร์
open http://localhost:5555
```

### 2. Mongo Express (MongoDB GUI)

```bash
# เริ่ม Mongo Express
docker-compose --profile debug up -d mongo-express

# เปิดเบราว์เซอร์
open http://localhost:8081

# Login:
# Username: admin
# Password: admin
```

### 3. MongoDB Compass (Desktop App)

1. ดาวน์โหลด [MongoDB Compass](https://www.mongodb.com/products/compass)
2. เชื่อมต่อด้วย connection string:
   ```
   mongodb://admin:admin123@localhost:27017/?authSource=admin
   ```

### 4. VS Code Extension

ติดตั้ง extension: **MongoDB for VS Code**

Connection string:
```
mongodb://admin:admin123@localhost:27017/?authSource=admin
```

---

## MongoDB Atlas (Cloud)

### ทำไมต้องใช้ Atlas?

- ✅ **ฟรี 512MB** - เพียงพอสำหรับ development
- ✅ **No Setup** - ไม่ต้องติดตั้งอะไร
- ✅ **Auto Backup** - สำรองข้อมูลอัตโนมัติ
- ✅ **Global Distribution** - Deploy ได้ทั่วโลก
- ✅ **Monitoring** - มี dashboard ครบครัน

### Setup MongoDB Atlas

1. **สร้างบัญชี**
   - ไปที่ https://www.mongodb.com/cloud/atlas/register
   - สมัครสมาชิกฟรี

2. **สร้าง Cluster**
   - เลือก "Create a Free Cluster"
   - เลือก region ใกล้ที่สุด (Singapore สำหรับไทย)
   - Cluster name: winterhouse-cluster

3. **สร้าง Database User**
   - Database Access → Add New Database User
   - Username: `winterhouse`
   - Password: สร้าง password ที่แข็งแรง
   - Database User Privileges: Read and write to any database

4. **Whitelist IP**
   - Network Access → Add IP Address
   - Allow Access from Anywhere: `0.0.0.0/0` (สำหรับ development)
   - หรือใส่ IP ของคุณเฉพาะ

5. **รับ Connection String**
   - Clusters → Connect → Connect your application
   - Driver: Node.js
   - Version: 5.5 or later
   - คัดลอก connection string:
   ```
   mongodb+srv://winterhouse:<password>@winterhouse-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

6. **อัพเดท .env**
   ```env
   DATABASE_URL="mongodb+srv://winterhouse:YOUR_PASSWORD@winterhouse-cluster.xxxxx.mongodb.net/winterhouse?retryWrites=true&w=majority"
   ```

7. **Push Schema**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

### Deploy ด้วย Atlas

เมื่อ deploy production ให้:

1. เปลี่ยนเป็น cluster ที่ใหญ่ขึ้น
2. ตั้งค่า IP whitelist ให้เฉพาะ server
3. ใช้ connection string pooling
4. เปิด SSL/TLS
5. ตั้งค่า backup schedule

---

## Backup & Restore

### Backup

```bash
# ใช้ Makefile
make db-backup

# หรือ manual
docker-compose exec db mongodump \
  --username admin \
  --password admin123 \
  --authenticationDatabase admin \
  --db winterhouse \
  --out /tmp/backup

docker cp winterhouse-db:/tmp/backup ./backup
```

### Restore

```bash
# ใช้ Makefile
make db-restore FILE=backup.tar.gz

# หรือ manual
docker cp ./backup winterhouse-db:/tmp/restore
docker-compose exec db mongorestore \
  --username admin \
  --password admin123 \
  --authenticationDatabase admin \
  --db winterhouse \
  /tmp/restore/winterhouse
```

---

## Performance Tips

### 1. Indexes

```javascript
// สร้าง indexes ที่จำเป็น
db.bookings.createIndex({ roomId: 1, checkIn: 1, checkOut: 1 })
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ lineUserId: 1 }, { unique: true })
db.rooms.createIndex({ isActive: 1 })
```

### 2. Connection Pooling

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'error', 'warn'],
    // Connection pool settings
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### 3. Query Optimization

```typescript
// ❌ N+1 problem
const bookings = await prisma.booking.findMany()
for (const booking of bookings) {
  const room = await prisma.room.findUnique({ where: { id: booking.roomId } })
}

// ✅ Use include
const bookings = await prisma.booking.findMany({
  include: {
    room: true,
    user: true,
  },
})
```

---

## Troubleshooting

### ปัญหา: Connection failed

```bash
# ตรวจสอบว่า MongoDB ทำงานอยู่
docker-compose ps db

# ดู logs
docker-compose logs db

# Restart
docker-compose restart db
```

### ปัญหา: Authentication failed

ตรวจสอบ:
1. Username/Password ถูกต้องหรือไม่
2. `authSource=admin` อยู่ใน connection string หรือไม่
3. User มีสิทธิ์หรือไม่

### ปัญหา: Prisma Client ไม่ update

```bash
# Generate ใหม่
npx prisma generate

# Push schema อีกครั้ง
npx prisma db push --force-reset
```

---

## Migration จาก PostgreSQL

ถ้าคุณมีข้อมูลใน PostgreSQL อยู่แล้ว:

### 1. Export ข้อมูลจาก PostgreSQL

```bash
# Export เป็น JSON
docker-compose exec app node scripts/export-data.js
```

### 2. Import ไปยัง MongoDB

```bash
# Import JSON
docker-compose exec app node scripts/import-data.js
```

### 3. Verify Data

```bash
# ตรวจสอบข้อมูล
docker-compose exec app npx prisma studio
```

---

## 📚 Resources

- [MongoDB Documentation](https://www.mongodb.com/docs/)
- [Prisma MongoDB Documentation](https://www.prisma.io/docs/concepts/database-connectors/mongodb)
- [MongoDB University](https://university.mongodb.com/) - ฟรี!
- [MongoDB Cheat Sheet](https://www.mongodb.com/developer/products/mongodb/cheat-sheet/)

---

**Happy MongoDBing! 🍃**

