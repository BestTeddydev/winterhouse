# ระบบแผนผังที่ดินและอาคาร (Site Map with Hotspots)

## ภาพรวม

ระบบแผนผังที่ดินและอาคารช่วยให้แอดมินสามารถ:
1. อัปโหลดรูปแผนผังที่ดิน/อาคาร
2. วาง hotspot บนรูปภาพเพื่อระบุตำแหน่งอาคาร
3. เชื่อมโยง hotspot กับข้อมูลห้องพักและอาคารต่างๆ
4. แสดงข้อมูลครบถ้วนของแต่ละอาคาร

## คุณสมบัติหลัก

### 1. **อัปโหลดและจัดการรูปแผนผัง**
- อัปโหลดรูปแผนผังที่ดิน/อาคาร
- รองรับไฟล์รูปภาพทุกประเภท
- แสดงผลแบบเต็มจอพร้อมควบคุมการซูม

### 2. **สร้างและจัดการ Hotspots**
- คลิกเพื่อเพิ่ม hotspot บนแผนผัง
- ลากเพื่อปรับตำแหน่ง
- แก้ไขข้อมูลแต่ละ hotspot
- ลบ hotspot ที่ไม่ต้องการ

### 3. **ข้อมูลอาคาร**
สำหรับแต่ละ hotspot สามารถกรอกข้อมูล:
- **ชื่ออาคาร**: เช่น "อาคาร A", "คาเฟ่ชั้น 1"
- **ประเภทอาคาร**: 
  - 🏠 ที่พัก
  - ☕ คาเฟ่
  - 🍽️ ร้านอาหาร
  - 🏢 สิ่งอำนวยความสะดวก
  - 🚗 ที่จอดรถ
  - 🌳 สวน
- **รายละเอียด**: อธิบายเกี่ยวกับอาคาร
- **ห้องพัก**: เชื่อมโยงกับห้องพักที่อยู่ในอาคาร

### 4. **Visual Indicators**
- Icon แสดงประเภทอาคาร
- สี highlight เมื่อเลือก hotspot
- Label แสดงชื่ออาคารและจำนวนห้อง
- Animation pulse เพื่อดึงดูดความสนใจ

### 5. **สถิติและสรุป**
แสดงสรุป:
- จำนวนอาคารทั้งหมด
- จำนวนที่พัก
- จำนวนคาเฟ่
- จำนวนห้องพักทั้งหมด

## โครงสร้างไฟล์

```
components/
├── SiteMapEditor.tsx       # Component หลักสำหรับแก้ไขแผนผัง
└── HotspotImage.tsx       # Component แสดงผล (สำหรับหน้า public)

app/
└── admin/
    └── site-map/
        └── page.tsx        # หน้าจัดการแผนผังในแอดมิน
```

## การใช้งาน

### สำหรับ Admin

1. **เข้าสู่หน้าจัดการแผนผัง**
   - เข้าสู่ระบบด้วย Admin
   - ไปที่ Admin Dashboard
   - คลิก "แผนผังที่ดินและอาคาร"

2. **อัปโหลดรูปแผนผัง**
   - คลิก "เปลี่ยนรูปแผนผัง"
   - เลือกไฟล์รูปภาพ
   - รอการอัปโหลดเสร็จสิ้น

3. **เพิ่มอาคาร/จุดสนใจ**
   - คลิก "เพิ่มอาคาร"
   - คลิกบนแผนผังที่ตำแหน่งที่ต้องการ
   - กรอกข้อมูล:
     - ชื่ออาคาร
     - ประเภทอาคาร
     - รายละเอียด
     - เชื่อมโยงกับห้องพัก (สำหรับที่พัก)

4. **แก้ไข Hotspot**
   - คลิกที่จุดบนแผนผัง
   - แก้ไขข้อมูลในแบบฟอร์ม
   - การเปลี่ยนแปลงจะบันทึกทันที

5. **ลบ Hotspot**
   - เลือก hotspot ที่ต้องการลบ
   - คลิกปุ่มลบ (🗑️)
   - ยืนยันการลบ

6. **บันทึกแผนผัง**
   - คลิก "บันทึกแผนผัง"
   - รอการบันทึกเสร็จสิ้น

## Data Structure

### BuildingHotspot Interface
```typescript
interface BuildingHotspot {
  id: string              // Unique ID
  x: number              // Position X (percentage)
  y: number              // Position Y (percentage)
  buildingName: string   // ชื่ออาคาร
  buildingType: string   // ประเภท: accommodation, cafe, etc.
  rooms: string[]        // Array of room IDs
  description: string    // รายละเอียด
  facilities: string[]   // สิ่งอำนวยความสะดวก
}
```

### SiteMapData Interface
```typescript
interface SiteMapData {
  imageUrl: string           // URL รูปแผนผัง
  hotspots: BuildingHotspot[] // Array of hotspots
}
```

## API Endpoints ที่ต้องสร้าง

### 1. GET `/api/site-map`
ดึงข้อมูลแผนผัง
```typescript
Response: SiteMapData
```

### 2. POST `/api/site-map`
บันทึกข้อมูลแผนผัง
```typescript
Body: SiteMapData
Response: { success: boolean }
```

### 3. POST `/api/upload`
อัปโหลดรูปภาพ
```typescript
Body: FormData with file
Response: { url: string }
```

## ตัวอย่างการใช้งาน

### 1. สร้างแผนผังโรงแรม
```
1. อัปโหลดรูป overview ของโรงแรม
2. เพิ่ม hotspot สำหรับ:
   - อาคารที่พัก A (เชื่อมกับห้อง 101-110)
   - อาคารที่พัก B (เชื่อมกับห้อง 201-210)
   - คาเฟ่
   - ที่จอดรถ
```

### 2. สร้างแผนผังรีสอร์ท
```
1. อัปโหลดแผนผังรีสอร์ท
2. เพิ่ม hotspot สำหรับ:
   - วิลล่าแต่ละหลัง
   - ร้านอาหาร
   - สระว่ายน้ำ
   - สนามเด็กเล่น
```

## ประโยชน์

### สำหรับ Admin:
- ✅ จัดการข้อมูลสถานที่ได้ง่าย
- ✅ เชื่อมโยงห้องพักกับอาคารได้ชัดเจน
- ✅ อัปเดตข้อมูลได้สะดวกและรวดเร็ว

### สำหรับลูกค้า (Future):
- ✅ มองเห็นภาพรวมของสถานที่
- ✅ ค้นหาห้องพักได้ง่ายจากแผนผัง
- ✅ เข้าใจตำแหน่งอาคารต่างๆ

## การพัฒนาต่อ

### Phase 1 (ปัจจุบัน):
- ✅ SiteMapEditor component
- ✅ Admin page for site map management
- ✅ Hotspot CRUD operations
- ✅ Room linking

### Phase 2 (อนาคต):
- 🔲 Public view with HotspotImage
- 🔲 Interactive map on homepage
- 🔲 Search rooms by building
- 🔲 3D floor plans
- 🔲 Virtual tours

### Phase 3 (อนาคต):
- 🔲 Multiple floor plans
- 🔲 Indoor navigation
- 🔲 Real-time room availability on map
- 🔲 Mobile app integration

## Tips & Best Practices

1. **รูปแผนผัง:**
   - ใช้รูปความละเอียดสูง (min 1920x1080)
   - ใช้มุมมองแบบ top-down
   - ให้แผนผังมีความชัดเจน

2. **การตั้งชื่อ:**
   - ใช้ชื่อที่เข้าใจง่าย
   - มี naming convention ที่สม่ำเสมอ
   - เพิ่มข้อมูลที่เป็นประโยชน์

3. **การเชื่อมโยงห้องพัก:**
   - เชื่อมโยงห้องกับอาคารที่ถูกต้อง
   - อัปเดตเมื่อมีห้องพักใหม่
   - ตรวจสอบความถูกต้องเป็นระยะ

4. **Performance:**
   - Optimize รูปภาพก่อนอัปโหลด
   - ใช้ WebP format สำหรับขนาดไฟล์เล็กลง
   - Lazy load images

## Troubleshooting

### ปัญหา: รูปแผนผังไม่แสดง
**Solution:** ตรวจสอบ URL และ permissions ของรูปภาพ

### ปัญหา: Hotspot ไม่แม่นยำ
**Solution:** ใช้รูปความละเอียดสูงและ zoom ให้ดี

### ปัญหา: ไม่สามารถบันทึกได้
**Solution:** ตรวจสอบ API endpoint และ authentication

## Support

หากมีปัญหาหรือข้อสงสัย:
1. ดู documentation
2. ตรวจสอบ console logs
3. ติดต่อทีมพัฒนา
