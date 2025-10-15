# Session Persistence Fix

## ปัญหาที่แก้ไข
- Session หายเมื่อ refresh หน้า
- ต้องล็อกอินใหม่ทุกครั้งที่ refresh

## การแก้ไขที่ทำ

### 1. ปรับปรุง NextAuth Configuration (`lib/auth.ts`)
- เพิ่ม session configuration ที่เหมาะสม
- เพิ่ม cookie settings สำหรับ session persistence
- เพิ่ม JWT callback สำหรับ token management

### 2. ปรับปรุง SessionProvider (`app/providers.tsx`)
- เพิ่ม refetchInterval เพื่อ refresh session อัตโนมัติ
- เพิ่ม refetchOnWindowFocus เพื่อ refresh เมื่อ focus หน้าต่าง

### 3. เพิ่ม Middleware (`middleware.ts`)
- จัดการ authentication และ authorization
- ป้องกันการเข้าถึงหน้าที่ไม่ได้รับอนุญาต
- Redirect ไปยังหน้าที่เหมาะสม

### 4. ปรับปรุงการจัดการ Session ใน Components
- เพิ่มการตรวจสอบ session loading state
- แสดง loading spinner ขณะรอ session
- ป้องกันการ redirect ก่อนที่ session จะโหลดเสร็จ

## Environment Variables ที่จำเป็น

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Database
DATABASE_URL=mongodb://localhost:27017/winterhouse

# LINE Login
LINE_CHANNEL_ID=your-line-channel-id
LINE_CHANNEL_SECRET=your-line-channel-secret
```

## การทดสอบ

1. ล็อกอินด้วย LINE
2. Refresh หน้า (F5 หรือ Ctrl+R)
3. ตรวจสอบว่า session ยังคงอยู่
4. เปิดแท็บใหม่และไปที่ URL เดียวกัน
5. ตรวจสอบว่าไม่ต้องล็อกอินใหม่

## หมายเหตุ

- Session จะ expire หลังจาก 30 วัน
- Session จะ refresh อัตโนมัติทุก 5 นาที
- ใช้ database strategy สำหรับ session storage
- Cookie จะ secure ใน production environment
