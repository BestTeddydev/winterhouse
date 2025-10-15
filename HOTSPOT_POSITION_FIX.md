# Hotspot Position Fix

## ปัญหา
ตำแหน่ง hotspots บนรูปภาพไม่ตรงกับที่แอดมินตั้งไว้

## สาเหตุที่เป็นไปได้

### 1. **Object Fit Difference**
- **SiteMapEditor**: ใช้ `object-contain` หรือ `object-cover` ต่างกัน
- **HotspotImage**: ใช้ `object-cover` 
- **ผลลัพธ์**: รูปภาพถูกปรับขนาดต่างกัน ทำให้ตำแหน่งเลื่อน

### 2. **Container Size Difference**
- **SiteMapEditor**: Container ขนาด 600px height
- **HotspotImage**: Container ขนาด min-h-[400px]
- **ผลลัพธ์**: อัตราส่วนภาพต่างกัน

### 3. **CSS Transform/Scale**
- รูปภาพถูก scale หรือ transform ต่างกัน
- Hotspots ยังคงใช้ตำแหน่งเดิม

## การแก้ไขที่ทำ

### ✅ **1. ปรับ Image Container**
```tsx
// Before
<div className="relative w-full h-full min-h-[400px]">

// After  
<div className="relative w-full h-full min-h-[400px] bg-gray-100 rounded-lg overflow-hidden">
  <div className="relative w-full h-full">
    <Image className="object-cover" />
  </div>
</div>
```

### ✅ **2. ใช้ object-cover**
```tsx
// เปลี่ยนจาก object-contain เป็น object-cover
className="object-cover"
```

### ✅ **3. เพิ่ม Debug Indicators**
```tsx
// จุดแดงเล็กๆ เพื่อดูตำแหน่งจริง
<div
  className="absolute w-2 h-2 bg-red-500 opacity-50"
  style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
/>
```

### ✅ **4. เพิ่ม Debug Logs**
```tsx
console.log(`Hotspot ${index}: x=${hotspot.x}%, y=${hotspot.y}%, building=${hotspot.buildingName}`)
```

## การทดสอบ

### 1. **ตรวจสอบ Console**
```
เปิด F12 → Console tab
ดู logs:
- HotspotImage props: { imageUrl: "...", hotspots: [...] }
- Hotspot 0: x=25%, y=30%, building=อาคาร A
```

### 2. **ตรวจสอบตำแหน่ง**
- ดูจุดแดงเล็กๆ บนรูปภาพ
- เปรียบเทียบกับตำแหน่ง hotspot หลัก
- ถ้าตรงกัน = แก้ไขแล้ว ✅
- ถ้าไม่ตรง = ยังมีปัญหา ❌

### 3. **เปรียบเทียบกับ Admin**
- ไปที่ `/admin/site-map`
- ดูตำแหน่ง hotspots ที่แอดมินตั้ง
- ไปที่ `/rooms`
- เปรียบเทียบตำแหน่ง

## Alternative Solutions

### **Solution 1: ใช้ object-contain ทั้งคู่**
```tsx
// ใน SiteMapEditor และ HotspotImage
className="object-contain"
```

### **Solution 2: ใช้ fixed container size**
```tsx
// กำหนดขนาด container ให้เท่ากัน
<div className="relative w-full h-[600px]">
```

### **Solution 3: ใช้ background-image**
```tsx
// แทน Image component
<div 
  className="w-full h-full bg-cover bg-center"
  style={{ backgroundImage: `url(${imageUrl})` }}
/>
```

## การ Debug เพิ่มเติม

### **1. ตรวจสอบ Image Dimensions**
```javascript
// ใน console
const img = document.querySelector('img')
console.log('Image size:', img.offsetWidth, img.offsetHeight)
console.log('Container size:', img.parentElement.offsetWidth, img.parentElement.offsetHeight)
```

### **2. ตรวจสอบ Hotspot Position**
```javascript
// ใน console
const hotspot = document.querySelector('[title*="อาคาร A"]')
console.log('Hotspot position:', hotspot.offsetLeft, hotspot.offsetTop)
```

### **3. เปรียบเทียบกับ Admin**
```javascript
// ดูข้อมูลใน localStorage หรือ database
// เปรียบเทียบ coordinates
```

## Best Practices

### **1. ใช้ Container Size เดียวกัน**
```tsx
// ทั้งสอง component ใช้ขนาดเดียวกัน
const CONTAINER_HEIGHT = '600px'
```

### **2. ใช้ Object Fit เดียวกัน**
```tsx
// ทั้งสอง component ใช้ object-cover
className="object-cover"
```

### **3. Test กับรูปภาพจริง**
```tsx
// ทดสอบกับรูปภาพที่แอดมินอัปโหลดจริง
// ไม่ใช่แค่ placeholder
```

### **4. ใช้ Responsive Design**
```tsx
// รองรับทุกขนาดหน้าจอ
className="w-full h-full object-cover"
```

## Troubleshooting

### **ปัญหาที่พบบ่อย:**

1. **Hotspots เลื่อนไปทางขวา**
   - เปลี่ยนจาก `object-contain` เป็น `object-cover`

2. **Hotspots เลื่อนไปทางซ้าย**
   - ตรวจสอบ container width

3. **Hotspots เลื่อนขึ้น-ลง**
   - ตรวจสอบ container height

4. **Hotspots ไม่อยู่บนรูปเลย**
   - ตรวจสอบ z-index
   - ตรวจสอบ position: absolute

### **การแก้ไขด่วน:**
```tsx
// ใช้ inline styles เพื่อ bypass CSS
style={{
  left: `${hotspot.x}%`,
  top: `${hotspot.y}%`,
  position: 'absolute',
  zIndex: 10
}}
```

## การทดสอบ Final

### **Checklist:**
- [ ] Console logs แสดงตำแหน่งถูกต้อง
- [ ] จุดแดงอยู่ที่ตำแหน่งที่ถูกต้อง
- [ ] Hotspot หลักอยู่ที่ตำแหน่งที่ถูกต้อง
- [ ] คลิก hotspot แสดงข้อมูลถูกต้อง
- [ ] เปรียบเทียบกับ admin page ตรงกัน

### **Expected Result:**
- ✅ ตำแหน่ง hotspots ตรงกับที่แอดมินตั้งไว้
- ✅ ไม่มีตำแหน่งเลื่อน
- ✅ ใช้งานได้ทุกขนาดหน้าจอ
