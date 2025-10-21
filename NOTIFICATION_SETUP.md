# การตั้งค่าระบบแจ้งเตือนหลังชำระเงิน

## 1. การตั้งค่า Email (Resend)

### ขั้นตอนการตั้งค่า:
1. สมัครสมาชิก Resend ที่ https://resend.com
2. สร้าง API Key:
   - ไปที่ Dashboard > API Keys
   - สร้าง API Key ใหม่
3. เพิ่ม Domain:
   - ไปที่ Domains
   - เพิ่ม domain ของคุณ
   - ตั้งค่า DNS records ตามที่แนะนำ

### Environment Variables:
```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=Winter House <noreply@yourdomain.com>
ADMIN_EMAIL=admin@winterhouse.com
ADMIN_PHONE=02-xxx-xxxx
```

### ข้อดีของ Resend:
- ใช้งานง่าย ไม่ต้องตั้งค่า SMTP ซับซ้อน
- มี API ที่ทันสมัยและเสถียร
- รองรับ HTML emails ได้ดี
- มี analytics และ tracking
- ราคาถูก (ฟรี 3,000 emails/เดือน)

## 2. การตั้งค่า LINE

### ขั้นตอนการตั้งค่า:
1. สร้าง LINE Official Account
2. เปิดใช้งาน Messaging API
3. รับ Channel Access Token
4. รับ User ID ของแอดมิน

### Environment Variables:
```
LINE_CHANNEL_ACCESS_TOKEN=your-line-channel-access-token
ADMIN_LINE_USER_ID=your-admin-line-user-id
```

## 3. การตั้งค่า Base URL

```
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

## 4. การทำงานของระบบ

### เมื่อลูกค้าชำระเงินเสร็จ:
1. **ส่งอีเมลให้แอดมิน**: แจ้งเตือนการชำระเงินใหม่พร้อมรายละเอียดครบถ้วน
2. **ส่งอีเมลขอบคุณลูกค้า**: อีเมลขอบคุณพร้อมรายละเอียดการจอง
3. **ส่งข้อความ LINE ให้ลูกค้า**: ขอบคุณผ่าน LINE (ถ้ามี LINE ID)
4. **ส่งข้อความ LINE ให้แอดมิน**: แจ้งเตือนผ่าน LINE (ถ้ามี LINE ID)

### ข้อมูลที่ส่ง:
- รายละเอียดการจอง (ห้อง, วันที่, จำนวนคืน)
- ข้อมูลลูกค้า (ชื่อ, อีเมล, เบอร์โทร)
- ข้อมูลการชำระเงิน (จำนวนเงิน, สถานะ)
- ความต้องการพิเศษ (ถ้ามี)
- ข้อมูลติดต่อ

## 5. การทดสอบ

### ทดสอบ Email:
- ใช้ Gmail SMTP
- ทดสอบส่งอีเมลไปยังแอดมินและลูกค้า

### ทดสอบ LINE:
- ใช้ LINE Messaging API
- ทดสอบส่งข้อความไปยังแอดมินและลูกค้า

## 6. การแก้ไขปัญหา

### Email ไม่ส่ง:
- ตรวจสอบ RESEND_API_KEY ว่าถูกต้อง
- ตรวจสอบ RESEND_FROM_EMAIL ว่าใช้ domain ที่ verify แล้ว
- ตรวจสอบ Resend Dashboard สำหรับ error logs
- ตรวจสอบ domain verification status

### LINE ไม่ส่ง:
- ตรวจสอบ Channel Access Token
- ตรวจสอบ User ID
- ตรวจสอบ Messaging API settings
