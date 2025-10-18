# 🏗️ Schema Migration Guide

## 📋 ภาพรวมการเปลี่ยนแปลง

เราได้ปรับปรุง database schema เพื่อรองรับความสัมพันธ์ที่ถูกต้องระหว่าง **SiteMap**, **Building**, และ **Room**

### 🔄 ความสัมพันธ์ใหม่

```
SiteMap (1) ──→ (0..n) Building (1) ──→ (0..n) Room
```

- **1 SiteMap** มี **หลาย Building**
- **1 Building** มี **หลาย Room**

## 🗂️ Schema ใหม่

### 1. **Building Model** (ใหม่)
```typescript
interface IBuilding {
  _id: ObjectId
  name: string                    // ชื่ออาคาร
  description: string            // คำอธิบายอาคาร
  buildingType: string           // ประเภทอาคาร
  facilities: string[]           // สิ่งอำนวยความสะดวก
  x: number                      // ตำแหน่ง X บนแผนผัง (0-100%)
  y: number                      // ตำแหน่ง Y บนแผนผัง (0-100%)
  isActive: boolean              // สถานะการใช้งาน
  createdAt: Date
  updatedAt: Date
}
```

### 2. **Room Model** (ปรับปรุง)
```typescript
interface IRoom {
  _id: ObjectId
  name: string                   // ชื่อห้องพัก
  description: string           // คำอธิบายห้องพัก
  imageUrl: string              // รูปภาพห้องพัก
  price: number                 // ราคา
  capacity: number              // ความจุ
  amenities: string[]           // สิ่งอำนวยความสะดวก
  buildingId: ObjectId          // 🔗 Reference ไปยัง Building
  isActive: boolean             // สถานะการใช้งาน
  createdAt: Date
  updatedAt: Date
}
```

### 3. **SiteMap Model** (ปรับปรุง)
```typescript
interface ISiteMap {
  _id: ObjectId
  name: string                   // ชื่อแผนผัง
  description: string           // คำอธิบายแผนผัง
  imageUrl: string              // รูปภาพแผนผัง
  isActive: boolean             // สถานะการใช้งาน
  createdAt: Date
  updatedAt: Date
}
```

## 🔗 API Endpoints ใหม่

### Building Management
- `GET /api/buildings` - ดึงข้อมูลอาคารทั้งหมด
- `POST /api/buildings` - สร้างอาคารใหม่
- `GET /api/buildings/[id]` - ดึงข้อมูลอาคารและห้องพักในอาคารนั้น
- `PUT /api/buildings/[id]` - อัปเดตอาคาร
- `DELETE /api/buildings/[id]` - ลบอาคาร (soft delete)

### Room Management (ปรับปรุง)
- `GET /api/rooms` - ดึงข้อมูลห้องพักพร้อมข้อมูลอาคาร
- `POST /api/rooms` - สร้างห้องพักใหม่ (ต้องระบุ buildingId)

### SiteMap Management (ปรับปรุง)
- `GET /api/site-map` - ดึงข้อมูลแผนผังพร้อมอาคารและห้องพัก
- `POST /api/site-map` - บันทึกข้อมูลแผนผัง
- `DELETE /api/site-map` - ลบแผนผัง (soft delete)

## 🚀 การ Migration

### วิธีที่ 1: ใช้ Migration Script
```bash
# เรียกใช้ migration script
node src/scripts/migrate-to-building-schema.js
```

### วิธีที่ 2: Manual Migration
1. **สร้าง Building จาก hotspots เก่า**
2. **อัปเดต Room documents ให้มี buildingId**
3. **สร้าง SiteMap ใหม่**

## 📊 ข้อมูลตัวอย่าง

### สร้าง Building ใหม่
```javascript
POST /api/buildings
{
  "name": "อาคาร A",
  "description": "อาคารพักหลัก",
  "buildingType": "accommodation",
  "facilities": ["WiFi", "Air Conditioning", "Parking"],
  "x": 25,
  "y": 30
}
```

### สร้าง Room ใหม่
```javascript
POST /api/rooms
{
  "name": "ห้อง 101",
  "description": "ห้องพักขนาดใหญ่",
  "imageUrl": "/images/room-101.jpg",
  "price": 2500,
  "capacity": 4,
  "amenities": ["WiFi", "TV", "Minibar"],
  "buildingId": "building_object_id_here"
}
```

## 🔍 การ Query ข้อมูล

### ดึงห้องพักพร้อมข้อมูลอาคาร
```javascript
GET /api/rooms
// Response จะมี buildingId populate ข้อมูลอาคาร
```

### ดึงแผนผังพร้อมอาคารและห้องพัก
```javascript
GET /api/site-map
// Response จะมี hotspots ที่สร้างจาก Building collection
```

### ดึงห้องพักในอาคารเฉพาะ
```javascript
GET /api/buildings/building_id
// Response จะมีข้อมูลอาคารและห้องพักทั้งหมดในอาคารนั้น
```

## ⚠️ หมายเหตุสำคัญ

1. **การย้อนกลับ**: Schema เก่าจะถูกลบหลังจาก migration เสร็จสิ้น
2. **การทดสอบ**: ควรทดสอบใน development environment ก่อน
3. **การสำรองข้อมูล**: สำรองข้อมูลก่อนทำ migration
4. **การตรวจสอบ**: ตรวจสอบข้อมูลหลัง migration เสร็จสิ้น

## 🎯 ประโยชน์ของ Schema ใหม่

1. **ความยืดหยุ่น**: สามารถเพิ่มอาคารและห้องพักได้ง่าย
2. **การจัดการที่ดี**: แยกข้อมูลอาคารและห้องพักอย่างชัดเจน
3. **การ Query ที่มีประสิทธิภาพ**: ใช้ MongoDB populate และ indexing
4. **การขยายระบบ**: รองรับการเพิ่มฟีเจอร์ในอนาคต
5. **ข้อมูลที่ถูกต้อง**: ความสัมพันธ์ระหว่างข้อมูลถูกต้องตามหลักการ

## 🛠️ การพัฒนาต่อ

- เพิ่มระบบการจัดการอาคารใน Admin Panel
- เพิ่มการกรองห้องพักตามอาคาร
- เพิ่มระบบการจัดการสิ่งอำนวยความสะดวก
- เพิ่มระบบการรายงานสถิติ
