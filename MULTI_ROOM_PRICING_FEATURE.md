# 🏠 Multi-Room Booking & Dynamic Pricing Feature

## ภาพรวมฟีเจอร์

ระบบรองรับ:
1. **ราคาหลายแบบ** - ราคาวันธรรมดา, เสาร์-อาทิตย์, และวันหยุดนักขัตฤกษ์
2. **จองหลายห้องพร้อมกัน** - สามารถจองได้หลายห้องในครั้งเดียว
3. **คำนวณราคาอัตโนมัติ** - ราคาจะคำนวณอัตโนมัติตามวันที่ที่เลือก

---

## เปลี่ยนแปลง

### 1. Models

#### Room Model (`src/models/Room.ts`)
```typescript
interface IRoom {
  name: string
  description: string
  price: number // Base price (for backward compatibility)
  pricing: {
    weekday: number   // Monday-Thursday
    weekend: number   // Friday-Sunday  
    holiday: number   // Holiday rates
  }
  // ... other fields
}
```

#### Booking Model (`src/models/Booking.ts`)
```typescript
interface IBooking {
  roomId: ObjectId              // Primary room (backward compatibility)
  roomIds?: ObjectId[]          // Multiple rooms
  rooms?: Array<{
    roomId: ObjectId
    price: number               // Price for each room
  }>
  // ... other fields
}
```

### 2. Pricing Utility (`src/lib/pricing.ts`)

ฟังก์ชันที่สำคัญ:
- `getRoomPriceForDate(room, date)` - ราคาในวันนั้นๆ
- `calculateRoomPriceRange(room, checkIn, checkOut)` - ราคารวมในช่วงวันที่
- `calculateMultipleRoomsPrice(rooms)` - ราคารวมสำหรับหลายห้อง
- `getPriceBreakdown(room, checkIn, checkOut)` - รายละเอียดราคาแต่ละวัน

### 3. API Endpoints

#### ใหม่: `/api/rooms/pricing`
คำนวณราคาสำหรับห้องในช่วงวันที่

**POST /api/rooms/pricing**
```json
{
  "roomId": "room_id",
  "checkIn": "2024-03-01",
  "checkOut": "2024-03-03"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "roomId": "room_id",
    "roomName": "Deluxe Room",
    "checkIn": "2024-03-01",
    "checkOut": "2024-03-03",
    "totalPrice": 2500,
    "breakdown": [
      {
        "date": "2024-03-01",
        "dayType": "weekend",
        "price": 1200,
        "formattedDate": "ศ. 1 มี.ค. 2024"
      },
      {
        "date": "2024-03-02",
        "dayType": "weekday",
        "price": 1000,
        "formattedDate": "ส. 2 มี.ค. 2024"
      }
    ]
  }
}
```

#### อัพเดท: `/api/bookings` (POST)
รองรับจองหลายห้อง:
```json
{
  "roomId": "room1_id",        // สำหรับ backward compatibility
  "roomIds": ["room1_id", "room2_id"], // หลายห้อง
  "checkIn": "2024-03-01",
  "checkOut": "2024-03-03",
  "guestName": "John Doe",
  "guestEmail": "john@example.com",
  "guestPhone": "0812345678"
}
```

---

## การใช้งาน

### 1. Migration

อัพเดทข้อมูล rooms ที่มีอยู่ให้รองรับ pricing:

```bash
node scripts/migrate-room-pricing.js
```

สคริปต์จะ:
- อ่าน rooms ทั้งหมด
- สร้าง pricing object จาก price เดิม
- ตั้งค่า:
  - `weekday` = base price
  - `weekend` = base price × 1.2
  - `holiday` = base price × 1.5

### 2. สร้าง/แก้ไขห้องพัก

#### ผ่าน Admin Panel
1. ไปที่ `/admin/rooms`
2. คลิก "เพิ่มห้องพักใหม่"
3. กรอก:
   - **ราคา (Base)**: 1000
   - **ราคาวันธรรมดา**: 1000
   - **ราคาเสาร์-อาทิตย์**: 1200
   - **ราคาวันหยุด**: 1500

#### ผ่าน API
```bash
POST /api/rooms
{
  "name": "Deluxe Room",
  "price": 1000,
  "pricing": {
    "weekday": 1000,
    "weekend": 1200,
    "holiday": 1500
  }
}
```

### 3. คำนวณราคา

#### ตัวอย่าง: คำนวณราคาสำหรับ 3 วัน (Fri-Sat-Sun)
```javascript
const room = {
  price: 1000,
  pricing: {
    weekday: 1000,
    weekend: 1200,
    holiday: 1500
  }
}

// Friday (weekend) -> 1200
// Saturday (weekend) -> 1200  
// Sunday (weekday) -> 1000
// Total: 3400 THB
```

#### ตัวอย่าง: วันหยุดนักขัตฤกษ์
```javascript
// Monday (holiday) -> 1500
// Tuesday (weekday) -> 1000
// Total: 2500 THB
```

---

## การสอบถามราคา

### API Examples

**คำนวณราคาห้องเดียว:**
```bash
curl -X POST http://localhost:3000/api/rooms/pricing \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": "room_id",
    "checkIn": "2024-03-01",
    "checkOut": "2024-03-05"
  }'
```

**คำนวณราคาหลายห้อง:**
```javascript
// Frontend logic
const selectedRooms = [
  { room, checkIn, checkOut },
  { room, checkIn, checkOut },
  // ...
]

const prices = await Promise.all(
  selectedRooms.map(({ room, checkIn, checkOut }) =>
    fetch('/api/rooms/pricing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: room._id, checkIn, checkOut })
    }).then(r => r.json())
  )
)

const totalPrice = prices.reduce((sum, p) => sum + p.data.totalPrice, 0)
```

---

## จองห้อง

### จองห้องเดียว (backward compatible)
```javascript
fetch('/api/bookings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    roomId: 'room_id',
    checkIn: '2024-03-01',
    checkOut: '2024-03-03',
    guestName: 'John Doe',
    guestEmail: 'john@example.com',
    guestPhone: '0812345678'
  })
})
```

### จองหลายห้อง
```javascript
fetch('/api/bookings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    roomId: 'room1_id', // backward compatibility
    roomIds: ['room1_id', 'room2_id', 'room3_id'],
    checkIn: '2024-03-01',
    checkOut: '2024-03-05',
    guestName: 'John Doe',
    guestEmail: 'john@example.com',
    guestPhone: '0812345678'
  })
})
```

---

## วันหยุดนักขัตฤกษ์

เวลาที่ระบบถือเป็น "วันหยุด" (กำหนดใน `src/lib/pricing.ts`):

```typescript
const THAI_HOLIDAYS_2024 = [
  '2024-01-01', // New Year
  '2024-01-02', // New Year (extended)
  '2024-02-10', // Chinese New Year
  '2024-04-13', // Songkran Day 1
  '2024-04-14', // Songkran Day 2
  '2024-04-15', // Songkran Day 3
  '2024-05-01', // Labor Day
  // ... more holidays
]
```

### เพิ่มวันหยุดใหม่

แก้ไข `src/lib/pricing.ts`:
```typescript
const THAI_HOLIDAYS_2024 = [
  // ... existing holidays
  '2024-12-25', // Add Christmas
]
```

---

## การทดสอบ

### 1. ทดสอบ Pricing
```bash
# Login แล้วเรียก API
curl http://localhost:3000/api/rooms/pricing?roomId=ROOM_ID&checkIn=2024-03-01&checkOut=2024-03-05
```

### 2. ทดสอบจองหลายห้อง
```bash
# สร้าง booking แบบหลายห้อง
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "roomIds": ["room1", "room2"],
    "checkIn": "2024-03-01",
    "checkOut": "2024-03-03"
  }'
```

### 3. ทดสอบ Migration
```bash
# รัน migration
node scripts/migrate-room-pricing.js

# ตรวจสอบผลลัพธ์
mongo
> use baanlomnow
> db.rooms.find({}, { name: 1, price: 1, pricing: 1 })
```

---

## UI Integration

### สำหรับ Admin

อัพเดท `/admin/rooms` เพื่อเพิ่ม input สำหรับ:
- ราคาวันธรรมดา
- ราคาเสาร์-อาทิตย์
- ราคาวันหยุด

### สำหรับลูกค้า

อัพเดท booking form เพื่อ:
1. แสดงราคาในแต่ละวัน
2. สร้างรายละเอียดราคา (breakdown)
3. รองรับเลือกหลายห้อง
4. คำนวณราคารวมทั้งหมด

**ตัวอย่าง UI:**
```
📅 วันที่: 1-3 มี.ค. 2024

🏠 ห้อง 1
- ศ. 1 มี.ค. (weekend): 1,200 บาท
- ส. 2 มี.ค. (weekend): 1,200 บาท  
- อา. 3 มี.ค. (weekday): 1,000 บาท
รวม: 3,400 บาท

🏠 ห้อง 2
- ศ. 1 มี.ค. (weekend): 1,200 บาท
- ส. 2 มี.ค. (weekend): 1,200 บาท
- อา. 3 มี.ค. (weekday): 1,000 บาท
รวม: 3,400 บาท

💰 รวมทั้งหมด: 6,800 บาท
```

---

## โครงสร้างไฟล์ที่สร้าง/แก้ไข

### ใหม่
- `src/lib/pricing.ts` - Pricing utility functions
- `src/app/api/rooms/pricing/route.ts` - API สำหรับคำนวณราคา
- `scripts/migrate-room-pricing.js` - Migration script

### แก้ไข
- `src/models/Room.ts` - เพิ่ม pricing field
- `src/models/Booking.ts` - เพิ่ม roomIds และ rooms fields
- `src/app/api/bookings/route.ts` - รองรับจองหลายห้อง

---

## Checklist สำหรับใช้ใน Production

- [ ] รัน migration script: `node scripts/migrate-room-pricing.js`
- [ ] อัพเดท room prices ใน admin panel
- [ ] ทดสอบ API pricing
- [ ] ทดสอบจองห้องเดียว
- [ ] ทดสอบจองหลายห้อง
- [ ] ตรวจสอบราคาเป็นไปถูกต้อง
- [ ] ตรวจสอบวันหยุดนักขัตฤกษ์
- [ ] อัพเดทวันหยุดถ้าจำเป็น
- [ ] Deploy to production

---

## Troubleshooting

### Problem: rooms ไม่มี pricing field

**Solution**: รัน migration script
```bash
node scripts/migrate-room-pricing.js
```

### Problem: ราคาไม่ถูกต้อง

**Check**:
1. ตรวจสอบ room pricing object
2. ตรวจสอบวันหยุดใน `pricing.ts`
3. ตรวจสอบ logic ใน `getDayType()`

### Problem: จองหลายห้องไม่สำเร็จ

**Check**:
1. ตรวจสอบ availability ของแต่ละห้อง
2. ตรวจสอบ roomIds array
3. ตรวจสอบ logs ของ API

---

## หมายเหตุ

- ระบบยังรองรับการจองห้องเดียว (backward compatible)
- `roomId` field ยังมีอยู่สำหรับ backward compatibility
- ราคาจะคำนวณอัตโนมัติตามวันที่เลือก
- Support multi-room booking ในครั้งเดียว
- Dynamic pricing ตามวันหยุด

