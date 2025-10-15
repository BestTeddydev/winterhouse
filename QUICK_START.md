# 🚀 Quick Start Guide - Winterhouse MongoDB

เริ่มต้นใช้งานโปรเจกต์ภายใน 5 นาที!

## 📋 ก่อนเริ่ม

ตรวจสอบว่าติดตั้งแล้ว:
- ✅ Docker Desktop
- ✅ Node.js 18+ (ถ้าจะรันแบบไม่ใช้ Docker)

---

## 🎯 วิธีที่ 1: ใช้ Docker (แนะนำ)

### 1. Clone โปรเจกต์
```bash
cd ~/Desktop/projects
cd winterhouse
```

### 2. Setup Environment
```bash
# คัดลอกไฟล์ environment
cp .env.mongodb .env

# แก้ไข .env (อย่างน้อยต้องตั้ง NEXTAUTH_SECRET)
nano .env
```

**สร้าง NEXTAUTH_SECRET:**
```bash
# macOS/Linux
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# หรือใช้เว็บ
# https://generate-secret.now.sh/32
```

**ตัวอย่าง `.env` ขั้นต่ำ:**
```env
# MongoDB (ใช้ค่านี้ก่อนได้)
DATABASE_URL="mongodb://admin:admin123@db:27017/winterhouse?authSource=admin&retryWrites=true&w=majority"

# NextAuth (ต้องเปลี่ยน!)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="YOUR-SECRET-FROM-OPENSSL-HERE"

# LINE (ใส่ dummy ก่อนได้ ถ้ายังไม่มี)
LINE_CHANNEL_ID="dummy"
LINE_CHANNEL_SECRET="dummy"
LINE_CHANNEL_ACCESS_TOKEN="dummy"
LINE_ADMIN_USER_ID="dummy"

# Omise (ใส่ dummy ก่อนได้)
OMISE_PUBLIC_KEY="pkey_test_dummy"
OMISE_SECRET_KEY="skey_test_dummy"
NEXT_PUBLIC_OMISE_PUBLIC_KEY="pkey_test_dummy"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. เริ่มใช้งาน
```bash
# เริ่ม MongoDB และ App
make dev

# หรือ
docker-compose up -d

# ดูว่า services ทำงานหรือยัง
docker-compose ps
```

### 4. Setup Database Schema
```bash
# Generate Prisma Client และ push schema ไป MongoDB
docker-compose exec app npx prisma generate
docker-compose exec app npx prisma db push

# ถ้าถาม "Do you want to continue?" พิมพ์ y
```

### 5. เปิดเบราว์เซอร์
```bash
# หน้าแอป
open http://localhost:3000

# Prisma Studio (Database GUI)
docker-compose up -d prisma-studio
open http://localhost:5555

# Mongo Express (MongoDB GUI - optional)
docker-compose --profile debug up -d mongo-express
open http://localhost:8081
# Login: admin / admin
```

### 6. สร้าง Admin User

**ใช้ Prisma Studio:**
1. เปิด http://localhost:5555
2. คลิก "User" table
3. คลิก "Add record"
4. กรอกข้อมูล:
   - name: Admin
   - email: admin@example.com
   - role: ADMIN (เลือกจาก dropdown)
5. คลิก "Save 1 change"

**หรือใช้ MongoDB Shell:**
```bash
# เข้า MongoDB shell
make db-shell

# ใน shell (แก้ email ให้ตรงกับที่จะใช้)
db.users.insertOne({
  name: "Admin User",
  email: "admin@example.com",
  role: "ADMIN",
  createdAt: new Date(),
  updatedAt: new Date()
})

# ออกจาก shell
exit
```

### 7. สร้างห้องพักตัวอย่าง

**ใช้ Prisma Studio:**
1. เปิด http://localhost:5555
2. คลิก "Room" table
3. คลิก "Add record"
4. กรอก:
   - name: Deluxe Room
   - description: A beautiful deluxe room
   - imageUrl: https://picsum.photos/800/600
   - price: 1500
   - capacity: 2
   - amenities: ["WiFi", "TV", "Air Conditioning"]
   - isActive: true
5. Save

**หรือใช้ MongoDB Shell:**
```bash
make db-shell

db.rooms.insertOne({
  name: "Deluxe Room",
  description: "A beautiful deluxe room with modern amenities",
  imageUrl: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800",
  price: 1500,
  capacity: 2,
  amenities: ["WiFi", "TV", "Air Conditioning", "Mini Bar"],
  isActive: true,
  hotspots: [
    { x: 30, y: 40, title: "King Size Bed", description: "Comfortable king size bed" },
    { x: 70, y: 30, title: "Work Desk", description: "Spacious work area" }
  ],
  createdAt: new Date(),
  updatedAt: new Date()
})
```

### 8. ทดสอบ

1. เปิด http://localhost:3000
2. ควรเห็นห้องพักที่สร้าง
3. คลิกเข้าไปดูรายละเอียด
4. ทดสอบ hotspots (คลิกวงกลมสีน้ำเงินบนรูป)

---

## 🎯 วิธีที่ 2: รันแบบ Local (ไม่ใช้ Docker)

### 1. ติดตั้ง MongoDB

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community@7
brew services start mongodb-community@7
```

**Ubuntu:**
```bash
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

**Windows:**
- ดาวน์โหลดจาก https://www.mongodb.com/try/download/community

### 2. Setup Environment
```bash
cp .env.mongodb .env
nano .env
```

เปลี่ยน DATABASE_URL:
```env
DATABASE_URL="mongodb://localhost:27017/winterhouse"
```

### 3. ติดตั้ง Dependencies
```bash
npm install
```

### 4. Setup Database
```bash
npx prisma generate
npx prisma db push
```

### 5. เริ่มใช้งาน
```bash
npm run dev
```

เปิด http://localhost:3000

---

## 🔧 คำสั่งที่ใช้บ่อย

### Docker Commands
```bash
make dev              # เริ่ม services
make dev-logs         # ดู logs
make stop             # หยุด services
make restart          # restart
make db-shell         # MongoDB shell
make db-studio        # Prisma Studio
make clean            # ลบทุกอย่าง (รวม data)
make help             # ดูคำสั่งทั้งหมด
```

### Database Commands
```bash
# Generate Prisma Client
docker-compose exec app npx prisma generate

# Push schema changes
docker-compose exec app npx prisma db push

# Open Prisma Studio
docker-compose up -d prisma-studio

# MongoDB Shell
make db-shell

# Backup
make db-backup

# Restore
make db-restore FILE=backup.tar.gz
```

---

## 🐛 แก้ปัญหาเบื้องต้น

### ปัญหา: Port already in use
```bash
# ดู process ที่ใช้ port
lsof -i :3000
lsof -i :27017

# Kill process
kill -9 <PID>
```

### ปัญหา: Prisma error
```bash
# Stop containers
docker-compose down

# Remove volumes
docker volume rm winterhouse_mongodb_data

# Start again
make dev

# Setup database
docker-compose exec app npx prisma generate
docker-compose exec app npx prisma db push
```

### ปัญหา: Can't connect to MongoDB
```bash
# Check if MongoDB is running
docker-compose ps db

# View logs
docker-compose logs db

# Restart
docker-compose restart db
```

### ปัญหา: App won't start
```bash
# Rebuild
docker-compose up -d --build

# Check logs
docker-compose logs -f app

# Enter container to debug
docker-compose exec app sh
```

---

## 📚 Next Steps

หลังจากระบบทำงานแล้ว:

1. **Setup LINE Login**
   - ดูคู่มือที่ `ENV_SETUP_GUIDE.md`
   - สร้าง LINE Login Channel
   - อัพเดท credentials ใน `.env`

2. **Setup Omise Payment**
   - สมัครที่ https://dashboard.omise.co
   - รับ Test API Keys
   - อัพเดทใน `.env`

3. **Setup LINE Messaging API**
   - สร้าง Messaging API Channel
   - รับ Channel Access Token
   - ตั้งค่า Admin User ID

4. **อ่านเอกสารเพิ่มเติม**
   - `README.md` - Overview
   - `MONGODB.md` - MongoDB guide
   - `DOCKER.md` - Docker guide
   - `SETUP.md` - Full setup guide

---

## 🎓 MongoDB Basics

### ดูข้อมูล
```javascript
// เข้า shell
make db-shell

// คำสั่งพื้นฐาน
show dbs                        // แสดง databases
use winterhouse                 // เลือก database
show collections                // แสดง collections

db.users.find().pretty()        // ดู users ทั้งหมด
db.rooms.find().pretty()        // ดู rooms ทั้งหมด
db.bookings.find().pretty()     // ดู bookings ทั้งหมด

db.users.countDocuments()       // นับ users
```

### แก้ไขข้อมูล
```javascript
// เปลี่ยน user เป็น ADMIN
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { role: "ADMIN" } }
)

// เปลี่ยนราคาห้อง
db.rooms.updateOne(
  { name: "Deluxe Room" },
  { $set: { price: 2000 } }
)

// ลบห้อง
db.rooms.deleteOne({ name: "Old Room" })
```

---

## ✅ Checklist

ก่อน production:

- [ ] เปลี่ยน MongoDB password ให้แข็งแรง
- [ ] ตั้งค่า LINE Login credentials จริง
- [ ] ตั้งค่า Omise Live Keys (ถ้าพร้อม production)
- [ ] เปลี่ยน NEXTAUTH_SECRET ให้แข็งแรง
- [ ] ตั้งค่า backup schedule
- [ ] ทดสอบ payment flow
- [ ] ทดสอบ LINE notifications
- [ ] Setup monitoring
- [ ] Setup SSL/HTTPS

---

**Happy Coding! 🚀**

ถ้ามีปัญหาดูที่:
- `DOCKER.md` - Docker troubleshooting
- `MONGODB.md` - MongoDB guide
- `SETUP.md` - Full setup guide

