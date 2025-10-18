# 🔧 การแก้ไขปัญหาการชำระเงินผ่าน Omise

## 🔍 ปัญหาที่พบและแก้ไขแล้ว

### 1. **Environment Variables ผิด**
```bash
# ปัญหาเดิม
NEXT_PUBLIC_APP_URL=http://localhost:300  # ขาดเลข 0
NEXTAUTH_SECRET=bestauthsecret            # ซ้ำกัน
LINE_CHANNEL_ACCESS_TOKEN=b794253e01ee9be3281599ca5c09511d  # ใช้ค่าเดียวกับ secret

# แก้ไขเป็น
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=bestauthsecret
LINE_CHANNEL_ACCESS_TOKEN=YOUR_ACTUAL_LINE_ACCESS_TOKEN_HERE
```

### 2. **Database Schema ไม่ตรงกัน**
- **ปัญหา**: โมเดล `Booking` ไม่มีฟิลด์ `paymentId`
- **แก้ไข**: เพิ่ม `paymentId` ใน `Booking` schema
- **แก้ไข**: อัพเดทโค้ดให้ใช้ `paymentId` แทน `payment`

### 3. **Payment Flow ไม่สมบูรณ์**
- **ปัญหา**: การสร้าง booking ไม่ได้เชื่อม paymentId
- **แก้ไข**: เพิ่มการอัพเดท `booking.paymentId` หลังสร้าง payment

## ✅ สิ่งที่แก้ไขแล้ว

### 1. **โมเดล Booking** (`src/models/Booking.ts`)
```typescript
export interface IBooking extends Document {
  // เพิ่มฟิลด์ใหม่
  paymentId?: mongoose.Types.ObjectId
  // ... ฟิลด์อื่นๆ
}

const BookingSchema = new Schema<IBooking>({
  // เพิ่มฟิลด์ใหม่
  paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
  // ... ฟิลด์อื่นๆ
})
```

### 2. **API Payment** (`src/app/api/payments/route.ts`)
```typescript
// เปลี่ยนจาก
.populate({ path: 'payment', model: 'Payment' })
// เป็น
.populate({ path: 'paymentId', model: 'Payment' })

// เปลี่ยนจาก
if (!booking.payment) { ... }
// เป็น
if (!booking.paymentId) { ... }
```

### 3. **API Bookings** (`src/app/api/bookings/route.ts`)
```typescript
// เพิ่มการเชื่อม paymentId
booking.paymentId = payment._id
await booking.save()
```

### 4. **Payment Page** (`src/app/bookings/[id]/payment/page.tsx`)
```typescript
// เปลี่ยนจาก
booking.payment?.status
// เป็น
booking.paymentId?.status
```

## 🚀 วิธีทดสอบ

### 1. **แก้ไข Environment Variables**
```bash
# แก้ไขไฟล์ .env.local
nano .env.local

# เปลี่ยนเป็น
NEXT_PUBLIC_APP_URL=http://localhost:3000
LINE_CHANNEL_ACCESS_TOKEN=YOUR_ACTUAL_LINE_ACCESS_TOKEN
```

### 2. **เริ่มแอปพลิเคชัน**
```bash
npm run dev
```

### 3. **ทดสอบการชำระเงิน**
1. เปิด http://localhost:3000
2. สร้างการจองใหม่
3. ไปที่หน้าชำระเงิน
4. ทดสอบชำระเงินด้วยบัตรทดสอบ:
   - **หมายเลขบัตร**: 4242 4242 4242 4242
   - **วันหมดอายุ**: 12/25
   - **CVV**: 123
   - **ชื่อ**: TEST USER

### 4. **ตรวจสอบ Logs**
```bash
# ดู logs ของแอป
npm run dev

# หรือถ้าใช้ Docker
docker-compose logs -f app
```

## 🔧 การแก้ไขเพิ่มเติม (ถ้าจำเป็น)

### 1. **ถ้ายังมีปัญหา Environment Variables**
```bash
# ตรวจสอบว่าไฟล์ .env.local มีอยู่
ls -la .env.local

# ถ้าไม่มี ให้สร้างใหม่
cp .env.mongodb .env.local
nano .env.local
```

### 2. **ถ้ายังมีปัญหา Database**
```bash
# รีเซ็ต database (ระวัง! จะลบข้อมูลทั้งหมด)
docker-compose down
docker volume rm winterhouse_mongodb_data
docker-compose up -d
```

### 3. **ถ้ายังมีปัญหา Omise**
```bash
# ทดสอบการเชื่อมต่อ Omise
node test-omise.js
```

## 📋 Checklist การแก้ไข

- [x] แก้ไข NEXT_PUBLIC_APP_URL
- [x] แก้ไข NEXTAUTH_SECRET ซ้ำ
- [x] แก้ไข LINE_CHANNEL_ACCESS_TOKEN
- [x] เพิ่ม paymentId ใน Booking model
- [x] อัพเดท payment API ให้ใช้ paymentId
- [x] อัพเดท booking API ให้ใช้ paymentId
- [x] อัพเดท payment page ให้ใช้ paymentId
- [x] เพิ่มการเชื่อม paymentId ใน booking creation
- [x] ทดสอบการเชื่อมต่อ Omise API

## 🎯 ผลลัพธ์ที่คาดหวัง

หลังจากแก้ไขแล้ว ระบบการชำระเงินควรทำงานได้ปกติ:

1. **สร้างการจอง** → สร้าง payment record และเชื่อม paymentId
2. **เข้าหน้าชำระเงิน** → แสดงสถานะการชำระเงินถูกต้อง
3. **ชำระเงินด้วยบัตรเครดิต** → สร้าง Omise token และ charge สำเร็จ
4. **ชำระเงินด้วย PromptPay** → สร้าง Omise charge และ redirect ไป authorize URI
5. **Webhook** → อัพเดทสถานะการชำระเงินเมื่อ Omise ส่ง webhook

## 🆘 ถ้ายังมีปัญหา

1. **ตรวจสอบ Console Logs** ในเบราว์เซอร์ (F12)
2. **ตรวจสอบ Server Logs** ใน terminal
3. **ตรวจสอบ Network Tab** ในเบราว์เซอร์
4. **ทดสอบ Omise API** ด้วย `node test-omise.js`
5. **ตรวจสอบ Environment Variables** ด้วย `node test-payment.js`

---

**Happy Coding! 🚀**
