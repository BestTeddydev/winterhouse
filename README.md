# Winterhouse - ระบบจองห้องพักออนไลน์

ระบบจองห้องพักที่ทันสมัย พร้อมฟีเจอร์ครบครัน รองรับการเข้าสู่ระบบด้วย LINE Login, การชำระเงินผ่าน Omise Payment Gateway, และระบบแจ้งเตือนผ่าน LINE Messaging API

## ✨ คุณสมบัติหลัก

### สำหรับลูกค้า
- 🔐 **LINE Login SSO** - เข้าสู่ระบบง่ายด้วยบัญชี LINE
- 🏠 **เลือกห้องพักพร้อม Hotspot** - คลิกดูรายละเอียดจุดสนใจต่างๆ บนรูปห้องพัก
- 📅 **ตรวจสอบห้องว่าง** - เช็คความพร้อมของห้องตามวันที่ต้องการ
- 💳 **ชำระเงินออนไลน์** - รองรับบัตรเครดิต/เดบิต และ PromptPay ผ่าน Omise
- 🔔 **แจ้งเตือนผ่าน LINE** - รับการอัพเดทสถานะการจองทันที
- 📱 **Responsive Design** - ใช้งานได้ทุกอุปกรณ์

### สำหรับแอดมิน
- 🎨 **Hotspot Editor** - สร้างและจัดการจุดสนใจบนรูปห้องพักแบบ Interactive
- 📊 **จัดการห้องพัก** - เพิ่ม แก้ไข ลบ และเปิด/ปิดห้องพัก
- 📋 **จัดการการจอง** - ดูและอัพเดทสถานะการจองทั้งหมด
- 🔔 **แจ้งเตือนอัตโนมัติ** - รับแจ้งเตือนเมื่อมีการจองใหม่

## 🚀 เทคโนโลยีที่ใช้

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with LINE Provider
- **Payment**: Omise Payment Gateway
- **Notifications**: LINE Messaging API
- **State Management**: React Query, Zustand
- **UI Components**: Custom components with Tailwind CSS

## 📋 ความต้องการของระบบ

- Node.js 18+ 
- PostgreSQL 14+
- บัญชี LINE Developers (สำหรับ LINE Login และ Messaging API)
- บัญชี Omise (สำหรับ Payment Gateway)

## 🛠️ การติดตั้ง

### 1. Clone โปรเจกต์

```bash
git clone <repository-url>
cd winterhouse
```

### 2. ติดตั้ง Dependencies

```bash
npm install
```

### 3. ตั้งค่า Environment Variables

สร้างไฟล์ `.env` ในโฟลเดอร์ root และกรอกข้อมูลดังนี้:

```env
# Database
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/winterhouse?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key-here"

# LINE Login
LINE_CHANNEL_ID="your-line-channel-id"
LINE_CHANNEL_SECRET="your-line-channel-secret"

# LINE Messaging API
LINE_CHANNEL_ACCESS_TOKEN="your-line-messaging-api-access-token"
LINE_ADMIN_USER_ID="admin-line-user-id"

# Omise
OMISE_PUBLIC_KEY="your-omise-public-key"
OMISE_SECRET_KEY="your-omise-secret-key"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_OMISE_PUBLIC_KEY="your-omise-public-key"
```

### 4. ตั้งค่า Database

```bash
# สร้าง Database
npx prisma db push

# หรือใช้ Migration
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate
```

### 5. เริ่มต้นใช้งาน

```bash
npm run dev
```

เปิดเบราว์เซอร์ที่ [http://localhost:3000](http://localhost:3000)

## 📱 การตั้งค่า LINE Login

### 1. สร้าง LINE Login Channel

1. ไปที่ [LINE Developers Console](https://developers.line.biz/console/)
2. สร้าง Provider ใหม่ (ถ้ายังไม่มี)
3. สร้าง Channel ประเภท "LINE Login"
4. ตั้งค่า Callback URL: `http://localhost:3000/api/auth/callback/line`
5. คัดลอก Channel ID และ Channel Secret ไปใส่ใน `.env`

### 2. ตั้งค่า LINE Messaging API

1. ไปที่ [LINE Developers Console](https://developers.line.biz/console/)
2. สร้าง Channel ประเภท "Messaging API"
3. Issue Channel Access Token
4. คัดลอก Channel Access Token ไปใส่ใน `.env`
5. เพิ่ม Webhook URL (ถ้าต้องการ): `https://your-domain.com/api/webhooks/line`

## 💳 การตั้งค่า Omise Payment Gateway

### 1. สร้างบัญชี Omise

1. ไปที่ [Omise Dashboard](https://dashboard.omise.co/)
2. สร้างบัญชีและทำการยืนยันตัวตน
3. ไปที่ Keys เพื่อดู Public Key และ Secret Key
4. คัดลอก Keys ทั้งสองไปใส่ใน `.env`

### 2. ตั้งค่า Webhook (Optional)

1. ไปที่ Webhooks ใน Omise Dashboard
2. เพิ่ม Webhook URL: `https://your-domain.com/api/payments/webhook`
3. เลือก Events: `charge.complete`

## 🏗️ โครงสร้างโปรเจกต์

```
winterhouse/
├── app/                      # Next.js App Router
│   ├── api/                 # API Routes
│   │   ├── auth/           # Authentication endpoints
│   │   ├── rooms/          # Room management
│   │   ├── bookings/       # Booking management
│   │   └── payments/       # Payment processing
│   ├── admin/              # Admin pages
│   │   ├── rooms/         # Room management UI
│   │   └── bookings/      # Booking management UI
│   ├── auth/              # Auth pages
│   ├── bookings/          # Customer booking pages
│   └── rooms/             # Room listing & details
├── components/             # Reusable components
│   ├── Navbar.tsx
│   ├── HotspotImage.tsx
│   ├── HotspotEditor.tsx
│   └── RoomCard.tsx
├── lib/                    # Utilities & configurations
│   ├── auth.ts            # NextAuth config
│   ├── prisma.ts          # Prisma client
│   ├── omise.ts           # Omise integration
│   ├── line.ts            # LINE messaging
│   └── utils.ts           # Helper functions
├── prisma/
│   └── schema.prisma      # Database schema
└── types/                 # TypeScript type definitions
```

## 📊 Database Schema

### Models

- **User** - ผู้ใช้งานระบบ (ADMIN, CUSTOMER)
- **Room** - ห้องพัก พร้อม hotspots
- **Booking** - การจอง
- **Payment** - การชำระเงิน
- **Account, Session** - NextAuth tables

## 🎨 Hotspot Feature

ระบบ Hotspot ช่วยให้แอดมินสร้างจุดสนใจบนรูปห้องพักได้แบบ Interactive:

1. **สำหรับแอดมิน**:
   - คลิก "เพิ่มจุดสนใจ"
   - คลิกบนรูปภาพเพื่อวางจุด hotspot
   - กรอกหัวข้อและรายละเอียด
   - บันทึก

2. **สำหรับลูกค้า**:
   - เห็นจุด hotspot เป็นวงกลมสีน้ำเงิน
   - คลิกเพื่อดูรายละเอียด
   - ปิดโดยคลิก X

## 💰 Payment Flow

1. ลูกค้าเลือกห้องและวันที่ต้องการ
2. กรอกข้อมูลผู้เข้าพัก
3. เลือกวิธีชำระเงิน (บัตรเครดิต/PromptPay)
4. ระบบสร้าง charge ผ่าน Omise
5. ลูกค้าชำระเงิน
6. ระบบอัพเดทสถานะและแจ้งเตือนผ่าน LINE

## 🔔 LINE Notification

### การแจ้งเตือนที่มี:

- **แจ้งแอดมิน**: เมื่อมีการจองใหม่
- **แจ้งลูกค้า**: เมื่อสถานะการจองเปลี่ยน (CONFIRMED, CANCELLED, COMPLETED)

## 👨‍💼 การสร้าง Admin User

เนื่องจากระบบใช้ LINE Login แบบ SSO ต้องทำการอัพเดท role ใน database โดยตรง:

```sql
UPDATE "User" 
SET role = 'ADMIN' 
WHERE email = 'your-email@example.com';
```

หรือใช้ Prisma Studio:

```bash
npx prisma studio
```

## 🚀 Production Deployment

### 1. Deploy บน Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### 2. ตั้งค่า Environment Variables

เพิ่ม Environment Variables ทั้งหมดใน Vercel Dashboard

### 3. ตั้งค่า Database

ใช้ Database Provider เช่น:
- Supabase
- Railway
- Neon
- PlanetScale

### 4. อัพเดท URLs

- อัพเดท `NEXTAUTH_URL` และ `NEXT_PUBLIC_APP_URL`
- อัพเดท Callback URL ใน LINE Developers
- อัพเดท Webhook URLs ใน Omise

## 📝 License

MIT License

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## 📧 Support

หากมีปัญหาหรือข้อสงสัย สามารถติดต่อได้ที่ [your-email@example.com]

---

Made with ❤️ by Winterhouse Team

