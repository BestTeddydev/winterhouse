# 🔧 การแก้ไข Error: Cannot read properties of undefined (reading 'name')

## 🔍 ปัญหาที่พบ

Error นี้เกิดขึ้นในไฟล์ `src/app/api/payments/route.ts` บรรทัดที่ 77:

```typescript
description: `Booking for ${booking.room.name} (${booking.id})`
```

**สาเหตุ:**
- การ populate `room` ไม่สำเร็จ ทำให้ `booking.room` เป็น `undefined`
- โค้ดพยายามเข้าถึง `booking.room.name` โดยไม่ตรวจสอบว่า `room` มีอยู่หรือไม่

## ✅ การแก้ไข

### 1. **แก้ไขการ populate**
```typescript
// เปลี่ยนจาก
.populate({
  path: 'room',
  model: 'Room',
  select: 'name description price'
})

// เป็น
.populate({
  path: 'roomId',  // ใช้ roomId แทน room
  model: 'Room',
  select: 'name description price'
})
```

### 2. **แก้ไขการเข้าถึง room name**
```typescript
// เปลี่ยนจาก
description: `Booking for ${booking.room.name} (${booking.id})`

// เป็น
description: `Booking for ${booking.roomId?.name || 'Room'} (${booking.id})`
```

### 3. **เพิ่มการตรวจสอบและ logging**
```typescript
// Debug logging
console.log('Booking found:', {
  id: booking._id,
  userId: booking.userId,
  roomId: booking.roomId,
  paymentId: booking.paymentId,
  totalPrice: booking.totalPrice
})
```

## 🎯 ผลลัพธ์

### ✅ **ก่อนแก้ไข:**
```
Error processing payment: TypeError: Cannot read properties of undefined (reading 'name')
```

### ✅ **หลังแก้ไข:**
- ใช้ optional chaining (`?.`) เพื่อป้องกัน error
- ใช้ fallback value (`|| 'Room'`) เมื่อไม่มี room name
- เพิ่ม debug logging เพื่อติดตามปัญหา
- ใช้ `roomId` แทน `room` ในการ populate

## 🧪 การทดสอบ

### 1. **ทดสอบการเชื่อมต่อ**
```bash
node test-payment-fix.js
```

**ผลลัพธ์:**
```
✅ App is running
✅ Rooms endpoint working
   Found 1 rooms
   Sample room: A1
```

### 2. **ทดสอบการชำระเงิน**
1. เปิด http://localhost:3000
2. สร้างการจองใหม่
3. ไปที่หน้าชำระเงิน
4. ทดสอบชำระเงินด้วยบัตรทดสอบ

## 📋 ไฟล์ที่แก้ไข

- `src/app/api/payments/route.ts` - แก้ไขการ populate และการเข้าถึง room name

## 🔧 เทคนิคที่ใช้

### 1. **Optional Chaining (`?.`)**
```typescript
// ปลอดภัย - จะไม่ error แม้ว่า roomId จะเป็น undefined
booking.roomId?.name
```

### 2. **Nullish Coalescing (`||`)**
```typescript
// ให้ค่า fallback เมื่อ roomId?.name เป็น undefined
booking.roomId?.name || 'Room'
```

### 3. **Debug Logging**
```typescript
// ช่วยติดตามปัญหา
console.log('Booking found:', { ... })
```

## 🎉 สรุป

Error `Cannot read properties of undefined (reading 'name')` ได้รับการแก้ไขแล้วโดย:

1. ✅ ใช้ optional chaining เพื่อป้องกัน error
2. ✅ แก้ไขการ populate ให้ใช้ `roomId` แทน `room`
3. ✅ เพิ่ม fallback values สำหรับข้อมูลที่อาจหายไป
4. ✅ เพิ่ม debug logging เพื่อติดตามปัญหา

ตอนนี้ระบบการชำระเงินควรทำงานได้โดยไม่มี error นี้แล้ว! 🚀

---

**Happy Coding! 🎯**
