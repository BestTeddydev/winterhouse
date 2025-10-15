# 🔐 คู่มือการตั้งค่า Environment Variables

## 📝 ขั้นตอนการตั้งค่า

### 1. คัดลอกไฟล์ตัวอย่าง

```bash
cp .env.development .env
```

หรือสร้างไฟล์ `.env` ใหม่ในโฟลเดอร์ root

---

## 🗄️ DATABASE_URL

### ตัวอย่างสำหรับ Local PostgreSQL:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/winterhouse?schema=public"
```

**คำอธิบาย:**
- `postgres` = username
- `password` = รหัสผ่านของ PostgreSQL
- `localhost:5432` = host และ port
- `winterhouse` = ชื่อ database

### ตัวอย่างสำหรับ Supabase:
```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.abcdefghijklmnop.supabase.co:5432/postgres"
```

**หา Connection String ใน Supabase:**
1. ไปที่ Project Settings → Database
2. คัดลอก URI ส่วน "Connection string"
3. แทนที่ `[YOUR-PASSWORD]` ด้วยรหัส database

---

## 🔑 NEXTAUTH_SECRET

### วิธีสร้าง Secret Key:

**บน macOS/Linux:**
```bash
openssl rand -base64 32
```

**บน Windows (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**หรือใช้เว็บไซต์:**
- https://generate-secret.now.sh/32

**ตัวอย่าง:**
```env
NEXTAUTH_SECRET="Xk7pQ2mN9vB3fR8sT1wY4hG6jL5nM0pQ"
```

---

## 📱 LINE Login Configuration

### ขั้นตอนที่ 1: สร้าง LINE Login Channel

1. **เข้าสู่ LINE Developers Console**
   - ไปที่ https://developers.line.biz/console/
   - Login ด้วยบัญชี LINE

2. **สร้าง Provider** (ถ้ายังไม่มี)
   - คลิก "Create a new provider"
   - ตั้งชื่อ เช่น "Winterhouse"

3. **สร้าง LINE Login Channel**
   - คลิก "Create a new channel"
   - เลือก **"LINE Login"**
   - กรอกข้อมูล:
     - **Channel name**: Winterhouse Login
     - **Channel description**: ระบบจองห้องพัก Winterhouse
     - **App types**: เลือก "Web app"
   - คลิก "Create"

4. **ตั้งค่า Callback URL**
   - ไปที่แท็บ "LINE Login"
   - ส่วน "Callback URL"
   - เพิ่ม:
     - Development: `http://localhost:3000/api/auth/callback/line`
     - Production: `https://your-domain.com/api/auth/callback/line`
   - คลิก "Update"

5. **คัดลอก Credentials**
   - ไปที่แท็บ "Basic settings"
   - คัดลอก **Channel ID**
   - คัดลอก **Channel secret**

### ตัวอย่าง:
```env
LINE_CHANNEL_ID="1657889012"
LINE_CHANNEL_SECRET="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
```

---

## 💬 LINE Messaging API Configuration

### ขั้นตอนที่ 1: สร้าง Messaging API Channel

1. **สร้าง Channel ใหม่**
   - ใน Provider เดิม คลิก "Create a new channel"
   - เลือก **"Messaging API"**
   - กรอกข้อมูล:
     - **Channel name**: Winterhouse Notifications
     - **Channel description**: แจ้งเตือนการจอง
     - **Category**: Travel & leisure
     - **Subcategory**: Hotel
   - คลิก "Create"

2. **Issue Channel Access Token**
   - ไปที่แท็บ "Messaging API"
   - ส่วน "Channel access token (long-lived)"
   - คลิก "Issue"
   - คัดลอก token

### ตัวอย่าง:
```env
LINE_CHANNEL_ACCESS_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### ขั้นตอนที่ 2: หา LINE User ID ของแอดมิน

**วิธีที่ 1: ใช้ LINE Official Account**

1. เพิ่มเพื่อน Official Account (ใช้ QR Code ในหน้า Messaging API)
2. ส่งข้อความอะไรก็ได้ไปที่ bot
3. ใช้ Webhook เพื่อดู User ID

**สร้าง Webhook ชั่วคราว:**

สร้างไฟล์ `app/api/webhooks/line-test/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  
  console.log('=== LINE Webhook ===')
  console.log(JSON.stringify(body, null, 2))
  
  // User ID จะอยู่ใน body.events[0].source.userId
  if (body.events && body.events[0]) {
    console.log('USER ID:', body.events[0].source.userId)
  }
  
  return NextResponse.json({ status: 'ok' })
}
```

4. ตั้งค่า Webhook URL ใน LINE Console:
   - ไปที่แท็บ "Messaging API"
   - ตั้ง Webhook URL: `https://your-ngrok-url/api/webhooks/line-test`
   - เปิด "Use webhook"
5. ส่งข้อความไปที่ bot
6. ดู User ID ใน console logs

**วิธีที่ 2: ใช้ LINE Profile API (ง่ายกว่า)**

ใช้ Postman หรือ cURL:

```bash
curl -X GET \
  'https://api.line.me/v2/bot/profile/USER_ID_HERE' \
  -H 'Authorization: Bearer YOUR_CHANNEL_ACCESS_TOKEN'
```

### ตัวอย่าง:
```env
LINE_ADMIN_USER_ID="U1234567890abcdefghijklmnopqrstuv"
```

---

## 💳 Omise Payment Gateway Configuration

### ขั้นตอนที่ 1: สร้างบัญชี Omise

1. **สมัครสมาชิก**
   - ไปที่ https://dashboard.omise.co/
   - คลิก "Sign Up"
   - กรอกข้อมูล (ใช้ Test Mode ได้ฟรี)

2. **ยืนยันอีเมล**
   - เช็คอีเมลและยืนยันบัญชี

3. **Login เข้าสู่ Dashboard**

### ขั้นตอนที่ 2: รับ API Keys

1. **เข้าสู่ Test Mode** (มุมบนขวา ให้แน่ใจว่าเป็น "Test")
2. ไปที่ **Settings → Keys**
3. คัดลอก:
   - **Public key (test)**: ขึ้นต้นด้วย `pkey_test_`
   - **Secret key (test)**: ขึ้นต้นด้วย `skey_test_`

### ตัวอย่าง:
```env
# Test Mode (สำหรับ Development)
OMISE_PUBLIC_KEY="pkey_test_5f2e8h3j9k1m4n6p8q0r2s4t6u8v0w2"
OMISE_SECRET_KEY="skey_test_5f2e8h3j9k1m4n6p8q0r2s4t6u8v0w2"
NEXT_PUBLIC_OMISE_PUBLIC_KEY="pkey_test_5f2e8h3j9k1m4n6p8q0r2s4t6u8v0w2"
```

### Test Cards สำหรับทดสอบ:

**บัตรที่ชำระสำเร็จ:**
```
Card Number: 4242 4242 4242 4242
Expiry: 12/25 (อนาคต)
CVV: 123
Name: TEST USER
```

**บัตรที่ชำระไม่สำเร็จ:**
```
Card Number: 4000 0000 0000 0002
```

### สำหรับ Production:

1. ทำการยืนยันตัวตน (KYC) ใน Omise Dashboard
2. เปลี่ยนเป็น **Live Mode**
3. รับ Live Keys (ขึ้นต้นด้วย `pkey_` และ `skey_`)
4. อัพเดทใน `.env`

---

## 🌐 Application URLs

### Development:
```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"
```

### Production (ตัวอย่าง):
```env
NEXT_PUBLIC_APP_URL="https://winterhouse.vercel.app"
NEXTAUTH_URL="https://winterhouse.vercel.app"
```

---

## ✅ ตรวจสอบการตั้งค่า

### 1. ตรวจสอบว่าไฟล์ .env ไม่ถูก commit

```bash
# ควรเห็น .env ใน .gitignore
cat .gitignore | grep .env
```

### 2. ตรวจสอบว่าทุก Variable ถูกตั้งค่า

สร้างไฟล์ทดสอบ `scripts/check-env.js`:

```javascript
const required = [
  'DATABASE_URL',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'LINE_CHANNEL_ID',
  'LINE_CHANNEL_SECRET',
  'LINE_CHANNEL_ACCESS_TOKEN',
  'LINE_ADMIN_USER_ID',
  'OMISE_PUBLIC_KEY',
  'OMISE_SECRET_KEY',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_OMISE_PUBLIC_KEY'
]

console.log('🔍 ตรวจสอบ Environment Variables...\n')

let missing = []

required.forEach(key => {
  if (process.env[key]) {
    console.log(`✅ ${key}`)
  } else {
    console.log(`❌ ${key} - MISSING!`)
    missing.push(key)
  }
})

if (missing.length > 0) {
  console.log(`\n❌ ขาด ${missing.length} variables:`)
  missing.forEach(key => console.log(`   - ${key}`))
  process.exit(1)
} else {
  console.log('\n✅ ทุก Environment Variables พร้อมใช้งาน!')
}
```

รันด้วย:
```bash
node -r dotenv/config scripts/check-env.js
```

---

## 🔒 Security Best Practices

1. **ห้าม commit `.env`** - ตรวจสอบว่ามี `.env` ใน `.gitignore`
2. **ใช้ Secret Manager** ใน Production (Vercel Env Vars, AWS Secrets Manager, etc.)
3. **หมุนเวียน Keys** - เปลี่ยน keys เป็นระยะ
4. **แยก Environment** - ใช้คนละ keys ระหว่าง dev, staging, production
5. **Encrypt Database** - ใช้ SSL/TLS สำหรับ database connection

---

## 📦 ไฟล์ตัวอย่างที่ครบถ้วน

ดูได้ที่ `.env.development` ในโฟลเดอร์ root

---

## ❓ คำถามที่พบบ่อย

### Q: NEXTAUTH_SECRET ต้องยาวแค่ไหน?
A: อย่างน้อย 32 characters แนะนำ 64 characters

### Q: ใช้ Test Keys ของ Omise ได้นานแค่ไหน?
A: ใช้ได้ตลอด ฟรี ไม่มีวันหมดอายุ

### Q: ต้องมี LINE Official Account ไหม?
A: ใช่ ต้องสร้าง Messaging API Channel (จะได้ Official Account ฟรี)

### Q: DATABASE_URL เชื่อมต่อไม่ได้?
A: ตรวจสอบ:
- PostgreSQL ทำงานอยู่หรือไม่
- Username/Password ถูกต้องไหม
- Database ถูกสร้างแล้วหรือยัง
- Port 5432 เปิดอยู่ไหม

---

**Happy Coding! 🚀**

