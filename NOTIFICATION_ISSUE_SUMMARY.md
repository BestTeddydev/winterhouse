# 🔧 สรุปปัญหาและวิธีแก้ไขระบบแจ้งเตือน

## 📋 ปัญหาที่พบ

### 1. ❌ LINE Channel Access Token ไม่ถูกต้อง
**ปัญหา:** `LINE_CHANNEL_ACCESS_TOKEN` และ `LINE_CHANNEL_SECRET` มีค่าเดียวกัน
```
LINE_CHANNEL_ACCESS_TOKEN=b794253e01ee9be3281599ca5c09511d
LINE_CHANNEL_SECRET=b794253e01ee9be3281599ca5c09511d
```

**ผลกระทบ:** LINE notification จะไม่ทำงาน เพราะใช้ token ที่ผิด

### 2. ✅ ปัญหาในโค้ด webhook (แก้ไขแล้ว)
**ปัญหาเดิม:** การหา payment ใน webhook ไม่ถูกต้อง
**แก้ไขแล้ว:** เพิ่มการหา payment ทั้งจาก session ID และ bookingId

### 3. ✅ ปัญหาใน email template (แก้ไขแล้ว)
**ปัญหาเดิม:** ใช้ `booking.room.name` แต่ควรเป็น `booking.roomId.name`
**แก้ไขแล้ว:** แก้ไขในไฟล์ `src/lib/email.ts` และ `src/lib/line.ts`

## 🛠️ วิธีแก้ไข

### ขั้นตอนที่ 1: แก้ไข LINE Channel Access Token

1. **เข้าสู่ LINE Developers Console**
   - ไปที่ https://developers.line.biz/console/
   - Login ด้วยบัญชี LINE

2. **เลือก Messaging API Channel**
   - คลิกที่ Channel ที่สร้างไว้ (Channel ID: 2008285356)

3. **รับ Channel Access Token**
   - ไปที่แท็บ "Messaging API"
   - หาส่วน "Channel access token (long-lived)"
   - คลิก "Issue" เพื่อสร้าง token ใหม่
   - คัดลอก token ที่ได้

4. **อัพเดท .env.local**
   ```bash
   # แก้ไขบรรทัดนี้
   LINE_CHANNEL_ACCESS_TOKEN=your-new-channel-access-token-here
   ```

### ขั้นตอนที่ 2: ทดสอบการทำงาน

1. **ทดสอบการตั้งค่า**
   ```bash
   node check-notifications.js
   ```

2. **ทดสอบ webhook logic**
   ```bash
   node debug-webhook.js
   ```

3. **ทดสอบการชำระเงินจริง**
   - ทำการจองและชำระเงิน
   - ตรวจสอบ logs ใน server
   - ตรวจสอบว่าอีเมลและ LINE ส่งมาหรือไม่

## 📊 สถานะการแก้ไข

| ปัญหา | สถานะ | หมายเหตุ |
|-------|-------|----------|
| LINE Token | ❌ ต้องแก้ไข | ต้องได้ Channel Access Token ใหม่ |
| Webhook Logic | ✅ แก้ไขแล้ว | เพิ่มการหา payment ที่ดีขึ้น |
| Email Template | ✅ แก้ไขแล้ว | แก้ไข field references |
| Environment Variables | ✅ ถูกต้อง | ทุกตัวมีครบถ้วน |

## 🔍 การตรวจสอบเพิ่มเติม

### ตรวจสอบ Logs
เมื่อทำการชำระเงิน ให้ดู logs ใน server:
```bash
# ดู logs ของ Next.js
npm run dev
# หรือ
yarn dev
```

### ตรวจสอบ Webhook
1. ตรวจสอบว่า Stripe webhook ทำงาน
2. ดู logs ใน Stripe Dashboard
3. ตรวจสอบว่า webhook endpoint ถูกเรียก

### ตรวจสอบการส่งอีเมล
1. ตรวจสอบ Resend Dashboard
2. ดู email logs และ delivery status
3. ตรวจสอบ spam folder

### ตรวจสอบการส่ง LINE
1. ตรวจสอบ LINE Messaging API logs
2. ทดสอบส่งข้อความด้วย API
3. ตรวจสอบว่า bot มีเพื่อนและสามารถส่งข้อความได้

## 🚀 ขั้นตอนต่อไป

1. **แก้ไข LINE Token** - สำคัญที่สุด
2. **ทดสอบการชำระเงิน** - เพื่อดูว่า webhook ทำงาน
3. **ตรวจสอบ logs** - เพื่อดู error messages
4. **ทดสอบแจ้งเตือน** - ทั้งอีเมลและ LINE

## 📞 การขอความช่วยเหลือ

หากยังมีปัญหา ให้ส่งข้อมูลต่อไปนี้:
- Server logs เมื่อทำการชำระเงิน
- Environment variables (ปิดบัง sensitive data)
- Error messages ที่พบ
- ขั้นตอนที่ทำก่อนเกิดปัญหา

---

**หมายเหตุ:** ไฟล์นี้สร้างขึ้นเพื่อช่วยแก้ไขปัญหาการแจ้งเตือนหลังชำระเงิน
