# คู่มือการติดตั้งและตั้งค่าระบบ Winterhouse

## 📋 สิ่งที่ต้องเตรียม

### 1. ซอฟต์แวร์ที่ต้องติดตั้ง
- [Node.js](https://nodejs.org/) เวอร์ชัน 18 หรือสูงกว่า
- [PostgreSQL](https://www.postgresql.org/) เวอร์ชัน 14 หรือสูงกว่า
- [Git](https://git-scm.com/)
- Text Editor (แนะนำ VS Code)

### 2. บัญชีที่ต้องสมัคร (ฟรี)
- [LINE Developers Account](https://developers.line.biz/)

## 🔧 ขั้นตอนการติดตั้ง

### ขั้นที่ 1: ติดตั้ง PostgreSQL

#### บน macOS (ใช้ Homebrew)
```bash
brew install postgresql@14
brew services start postgresql@14
```

#### บน Windows
1. ดาวน์โหลด PostgreSQL จาก https://www.postgresql.org/download/windows/
2. ติดตั้งและจำรหัสผ่าน postgres user

#### บน Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### ขั้นที่ 2: สร้าง Database

```bash
# เข้าสู่ PostgreSQL
psql -U postgres

# สร้าง database
CREATE DATABASE winterhouse;

# ออกจาก psql
\q
```

### ขั้นที่ 3: Clone โปรเจกต์

```bash
git clone <repository-url>
cd winterhouse
```

### ขั้นที่ 4: ติดตั้ง Dependencies

```bash
npm install
```

### ขั้นที่ 5: ตั้งค่า Environment Variables

1. คัดลอกไฟล์ตัวอย่าง:
```bash
cp .env.local.example .env
```

2. แก้ไขไฟล์ `.env` ด้วย text editor

```env
# 1. Database URL
DATABASE_URL="postgresql://postgres:your-password@localhost:5432/winterhouse?schema=public"

# 2. NextAuth Secret (สร้างด้วย openssl)
# macOS/Linux: openssl rand -base64 32
# Windows: ใช้เว็บไซต์ https://generate-secret.now.sh/32
NEXTAUTH_SECRET="your-generated-secret"

# 3-8. เติมค่าอื่นๆ ตามขั้นตอนด้านล่าง
```

## 🔑 การตั้งค่า LINE Developers

### ส่วนที่ 1: LINE Login Channel

1. **สร้าง Provider**
   - เข้า https://developers.line.biz/console/
   - คลิก "Create a new provider"
   - ตั้งชื่อ Provider (เช่น "Winterhouse")

2. **สร้าง LINE Login Channel**
   - เลือก Provider ที่สร้าง
   - คลิก "Create a new channel"
   - เลือก "LINE Login"
   - กรอกข้อมูล:
     - Channel name: "Winterhouse Login"
     - Channel description: "Login for Winterhouse booking system"
     - App types: เลือก "Web app"
   - กด "Create"

3. **ตั้งค่า Callback URL**
   - ไปที่แท็บ "LINE Login"
   - Callback URL: `http://localhost:3000/api/auth/callback/line`
   - กด "Update"

4. **คัดลอก Credentials**
   - ไปที่แท็บ "Basic settings"
   - คัดลอก "Channel ID" → ใส่ใน `LINE_CHANNEL_ID`
   - คัดลอก "Channel secret" → ใส่ใน `LINE_CHANNEL_SECRET`

### ส่วนที่ 2: LINE Messaging API Channel

1. **สร้าง Messaging API Channel**
   - เลือก Provider เดิม
   - คลิก "Create a new channel"
   - เลือก "Messaging API"
   - กรอกข้อมูล:
     - Channel name: "Winterhouse Notifications"
     - Channel description: "Notifications for Winterhouse"
   - กด "Create"

2. **Issue Channel Access Token**
   - ไปที่แท็บ "Messaging API"
   - ส่วน "Channel access token (long-lived)"
   - กด "Issue"
   - คัดลอก token → ใส่ใน `LINE_CHANNEL_ACCESS_TOKEN`

3. **หา LINE User ID ของแอดมิน**
   - เพิ่มเพื่อน Official Account ที่สร้างขึ้น (ใช้ QR Code ในหน้า Messaging API)
   - ส่งข้อความอะไรก็ได้
   - ไปที่ https://developers.line.biz/console/
   - คลิกที่ channel → แท็บ "Messaging API"
   - ใช้ Webhook URL หรือใช้เครื่องมือ LINE Bot Designer เพื่อหา User ID
   - หรือใช้ code นี้ชั่วคราว:

```javascript
// วาง code นี้ใน api/webhooks/line.ts เพื่อหา User ID
export async function POST(request) {
  const body = await request.json()
  console.log('LINE Webhook:', body)
  // ดู User ID ใน console
  return new Response('OK')
}
```


## 🗄️ การตั้งค่า Database Schema

```bash
# วิธีที่ 1: ใช้ db push (แนะนำสำหรับ development)
npx prisma db push

# วิธีที่ 2: ใช้ migration (แนะนำสำหรับ production)
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate
```

## 🚀 เริ่มต้นใช้งาน

```bash
npm run dev
```

เปิดเบราว์เซอร์ที่ http://localhost:3000

## 👨‍💼 สร้าง Admin User

1. **Login ด้วย LINE ครั้งแรก**
   - เปิด http://localhost:3000
   - คลิก "เข้าสู่ระบบ"
   - Login ด้วย LINE

2. **อัพเกรดเป็น Admin**

   **วิธีที่ 1: ใช้ Prisma Studio**
   ```bash
   npx prisma studio
   ```
   - เปิดเบราว์เซอร์ที่ http://localhost:5555
   - เลือก "User" table
   - หา user ของคุณ
   - เปลี่ยน `role` จาก `CUSTOMER` เป็น `ADMIN`
   - กด "Save"

   **วิธีที่ 2: ใช้ SQL**
   ```bash
   psql -U postgres -d winterhouse
   ```
   ```sql
   UPDATE "User" 
   SET role = 'ADMIN' 
   WHERE email = 'your-email@example.com';
   ```

3. **Logout และ Login อีกครั้ง**
   - คุณจะเห็นเมนู "จัดการระบบ" ปรากฏขึ้น

## 🧪 ทดสอบระบบ

### 1. ทดสอบ LINE Login
- ไปที่ http://localhost:3000
- คลิก "เข้าสู่ระบบ"
- ควรเปลี่ยนเส้นทางไปที่ LINE Login
- Login สำเร็จควรกลับมาหน้าแรก

### 2. สร้างห้องพักทดสอบ
- Login ด้วย Admin account
- ไปที่ "จัดการระบบ" → "จัดการห้องพัก"
- คลิก "เพิ่มห้องพักใหม่"
- กรอกข้อมูล:
  - ชื่อห้อง: "Test Room"
  - คำอธิบาย: "This is a test room"
  - URL รูปภาพ: ใช้รูปจาก https://picsum.photos/800/600
  - ราคา: 1000
  - ความจุ: 2
  - เพิ่ม amenities: WiFi, แอร์, TV
  - เพิ่ม hotspots บนรูป
- กด "บันทึก"

### 3. ทดสอบการจอง
- Logout จาก Admin
- Login ด้วย LINE account อื่น (หรือใช้ account เดิม)
- เลือกห้องพักที่สร้าง
- เลือกวันที่
- กด "จองเลย"
- กรอกข้อมูล
- ทดสอบชำระเงิน (ใช้ Test Card)


## 🔍 การตรวจสอบปัญหา

### ปัญหา: Database connection ไม่ได้
```bash
# ตรวจสอบว่า PostgreSQL ทำงานอยู่หรือไม่
# macOS
brew services list

# Ubuntu/Debian
sudo systemctl status postgresql

# Windows
# ดูใน Services (services.msc)
```

### ปัญหา: LINE Login redirect ไม่กลับมา
- ตรวจสอบ Callback URL ใน LINE Developers Console
- ควรเป็น `http://localhost:3000/api/auth/callback/line`
- ตรวจสอบ `NEXTAUTH_URL` ใน `.env`

### ปัญหา: Prisma Error
```bash
# ลบ Prisma Client และ generate ใหม่
rm -rf node_modules/.prisma
npx prisma generate

# Reset database (ข้อมูลจะหายทั้งหมด!)
npx prisma migrate reset
```

### ปัญหา: Payment ไม่ทำงาน
- ตรวจสอบ Console เบราว์เซอร์มี error หรือไม่
- ตรวจสอบว่าใช้ Test Mode

### ดู Logs
```bash
# ดู development server logs
# ใน terminal ที่รัน npm run dev

# ดู Database queries
# เพิ่ม log ใน prisma/schema.prisma
# log: ["query", "error", "warn"]
```

## 📱 ทดสอบ LINE Notifications

1. **ทดสอบส่งข้อความ**
   - สร้างการจองใหม่
   - ตรวจสอบว่า Admin ได้รับการแจ้งเตือนใน LINE หรือไม่

2. **ทดสอบอัพเดทสถานะ**
   - Login ด้วย Admin
   - ไปที่ "จัดการการจอง"
   - เปลี่ยนสถานะการจอง
   - ลูกค้าควรได้รับการแจ้งเตือนใน LINE

## 🎓 เรียนรู้เพิ่มเติม

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [LINE Developers Documentation](https://developers.line.biz/en/docs/)

## 💡 Tips

1. **Development**
   - ใช้ Prisma Studio เพื่อดูข้อมูลใน database
   - เปิด React DevTools และ Network tab ขณะ debug
   - ดู logs ใน terminal และ browser console

2. **Security**
   - ไม่แชร์ `.env` file
   - ใช้ Test Keys ขณะ development
   - เปลี่ยนเป็น Live Keys เฉพาะตอน production

3. **Performance**
   - รูปภาพควรใช้ CDN (เช่น Cloudinary, imgix)
   - ใช้ Image Optimization ของ Next.js

## 🆘 ติดปัญหา?

- ตรวจสอบ Console logs
- อ่าน Error messages ให้ละเอียด
- ตรวจสอบว่าทุก environment variable ถูกต้อง
- ลองรัน `npm install` ใหม่
- ลอง restart development server

---

**Happy Coding! 🚀**

