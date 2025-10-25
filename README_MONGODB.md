# 🍃 Winterhouse - MongoDB Version

ระบบจองห้องพักที่เปลี่ยนจาก PostgreSQL มาใช้ **MongoDB** แทน

## 🎯 สิ่งที่เปลี่ยนแปลง

### ✅ อัพเดทแล้ว:

1. **Prisma Schema** → เปลี่ยนเป็น MongoDB provider
2. **Docker Compose** → ใช้ MongoDB 7 แทน PostgreSQL
3. **Data Types** → `Decimal` → `Float`, `@db.Text` → `String`
4. **IDs** → MongoDB ObjectId (24 hex characters)
5. **Database GUI** → เพิ่ม Mongo Express
6. **Migrations** → ใช้ `prisma db push` แทน migrations

---

## 🚀 Quick Start

### 1. Setup Environment

```bash
# คัดลอกไฟล์ MongoDB config
cp .env.mongodb .env

# แก้ไข .env (สำคัญ!)
nano .env
```

**ตัวอย่าง `.env`:**
```env
# MongoDB (Docker)
DATABASE_URL="mongodb://admin:admin123@db:27017/winterhouse?authSource=admin&retryWrites=true&w=majority"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

...
```

### 2. เริ่มใช้งาน

```bash
# เริ่ม MongoDB และ App
make dev

# หรือ
docker-compose up -d

# ตรวจสอบสถานะ
docker-compose ps
```

### 3. Push Schema to MongoDB

```bash
# Generate Prisma Client และ push schema
docker-compose exec app npx prisma generate
docker-compose exec app npx prisma db push

# เปิด Prisma Studio
docker-compose up -d prisma-studio
open http://localhost:5555
```

---

## 📊 GUI Tools

### 1. Prisma Studio (แนะนำ)
```bash
make db-studio
# หรือ
docker-compose up -d prisma-studio
open http://localhost:5555
```

### 2. Mongo Express
```bash
# เริ่ม Mongo Express
docker-compose --profile debug up -d mongo-express

# เข้าถึงที่
open http://localhost:8081

# Login: admin / admin
```

### 3. MongoDB Compass (Desktop)
- ดาวน์โหลด: https://www.mongodb.com/products/compass
- Connection String:
  ```
  mongodb://admin:admin123@localhost:27017/?authSource=admin
  ```

---

## 🔧 Commands

### Development

```bash
make dev              # เริ่ม development
make dev-logs         # ดู logs
make stop             # หยุด services
```

### Database

```bash
make db-shell         # เข้าสู่ MongoDB shell
make db-studio        # เปิด Prisma Studio
make db-backup        # Backup database
make db-restore FILE=backup.tar.gz
make db-push          # Push schema changes
```

### MongoDB Shell Commands

```bash
# เข้า MongoDB shell
make db-shell

# ใน MongoDB shell:
show dbs                          # แสดง databases
use winterhouse                   # เลือก database
show collections                  # แสดง collections
db.users.find().pretty()          # ดูข้อมูล users
db.users.countDocuments()         # นับจำนวน

# อัพเดท user เป็น ADMIN
db.users.updateOne(
  { email: "your@email.com" },
  { $set: { role: "ADMIN" } }
)
```

---

## 🌐 MongoDB Atlas (Cloud - ฟรี!)

### Setup MongoDB Atlas

1. **สมัครสมาชิก**
   - ไปที่ https://www.mongodb.com/cloud/atlas/register
   - สมัครฟรี (512MB)

2. **สร้าง Cluster**
   - Create Free Cluster
   - เลือก region: Singapore
   - Cluster name: winterhouse

3. **สร้าง User**
   - Database Access → Add New User
   - Username: `winterhouse`
   - Password: สร้างรหัสผ่าน
   - Role: Read and write to any database

4. **Whitelist IP**
   - Network Access → Add IP
   - Allow Access from Anywhere: `0.0.0.0/0`

5. **รับ Connection String**
   - Clusters → Connect → Connect your application
   - คัดลอก connection string:
   ```
   mongodb+srv://winterhouse:<password>@cluster.xxxxx.mongodb.net/
   ```

6. **อัพเดท .env**
   ```env
   DATABASE_URL="mongodb+srv://winterhouse:PASSWORD@cluster.xxxxx.mongodb.net/winterhouse?retryWrites=true&w=majority"
   ```

7. **Push Schema**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

---

## 📝 Schema Changes

### สิ่งที่เปลี่ยนไป:

**Before (PostgreSQL):**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id    String @id @default(cuid())
  email String @unique
}

model Room {
  price Decimal @db.Decimal(10, 2)
}
```

**After (MongoDB):**
```prisma
datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

model User {
  id    String @id @default(auto()) @map("_id") @db.ObjectId
  email String @unique
  
  @@map("users")
}

model Room {
  price Float  // MongoDB ไม่มี Decimal
}
```

### Relations

```prisma
model Booking {
  id     String @id @default(auto()) @map("_id") @db.ObjectId
  roomId String @db.ObjectId  // ต้องระบุ @db.ObjectId
  userId String @db.ObjectId
  
  room Room @relation(fields: [roomId], references: [id])
  user User @relation(fields: [userId], references: [id])
}
```

---

## ⚡ Performance Tips

### 1. Indexes

MongoDB ไม่มี auto-index (นอกจาก _id)

```javascript
// สร้าง indexes
db.bookings.createIndex({ roomId: 1, checkIn: 1, checkOut: 1 })
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ lineUserId: 1 }, { unique: true })
```

### 2. Query Optimization

```typescript
// ❌ N+1 Problem
const bookings = await prisma.booking.findMany()
for (const booking of bookings) {
  const room = await prisma.room.findUnique({
    where: { id: booking.roomId }
  })
}

// ✅ Use Include
const bookings = await prisma.booking.findMany({
  include: { room: true, user: true }
})
```

---

## 🔄 Migration จาก PostgreSQL

ถ้าคุณมีข้อมูลใน PostgreSQL:

### 1. Export จาก PostgreSQL

```bash
# Export users
docker-compose exec db psql -U postgres -d winterhouse -c "COPY users TO STDOUT WITH CSV HEADER" > users.csv

# หรือใช้ Prisma
npx prisma db pull
npx ts-node scripts/export.ts
```

### 2. Import ไปยัง MongoDB

```bash
# Import CSV
docker-compose exec db mongoimport \
  --username admin \
  --password admin123 \
  --authenticationDatabase admin \
  --db winterhouse \
  --collection users \
  --type csv \
  --headerline \
  --file /data/users.csv
```

---

## 🐛 Troubleshooting

### ปัญหา: Connection refused

```bash
# ตรวจสอบ MongoDB ทำงานหรือไม่
docker-compose ps db

# ดู logs
docker-compose logs db

# Restart
docker-compose restart db
```

### ปัญหา: Authentication failed

ตรวจสอบ:
1. Username/Password ใน .env ถูกต้องหรือไม่
2. มี `?authSource=admin` ใน connection string หรือไม่
3. Port 27017 ไม่ถูกใช้โดย process อื่น

### ปัญหา: Prisma schema error

```bash
# Generate ใหม่
npx prisma generate

# Push schema
npx prisma db push --force-reset
```

---

## 📚 Resources

- [MongoDB Documentation](https://www.mongodb.com/docs/)
- [Prisma MongoDB](https://www.prisma.io/docs/concepts/database-connectors/mongodb)
- [MongoDB University](https://university.mongodb.com/) - ฟรี!
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **MONGODB.md** - คู่มือฉบับสมบูรณ์

---

## 🎓 เรียนรู้เพิ่มเติม

### MongoDB Basics

```javascript
// CRUD Operations
db.collection.insertOne({ ... })
db.collection.find({ ... })
db.collection.updateOne({ ... }, { $set: { ... } })
db.collection.deleteOne({ ... })

// Aggregation
db.collection.aggregate([
  { $match: { ... } },
  { $group: { ... } },
  { $sort: { ... } }
])
```

### Prisma with MongoDB

```typescript
// Create with relations
const booking = await prisma.booking.create({
  data: {
    roomId: 'objectid-here',
    userId: 'objectid-here',
    checkIn: new Date(),
    checkOut: new Date(),
    totalPrice: 1500,
    // ... other fields
  },
  include: {
    room: true,
    user: true,
  }
})

// Find with filters
const bookings = await prisma.booking.findMany({
  where: {
    status: 'CONFIRMED',
    checkIn: {
      gte: new Date('2024-01-01')
    }
  },
  include: { room: true }
})
```

---

**ขอให้โชคดีกับการใช้ MongoDB! 🍃**

