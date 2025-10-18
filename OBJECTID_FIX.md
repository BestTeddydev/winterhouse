# 🔧 ObjectId Cast Error Fix

## 🐛 ปัญหา

```
CastError: Cast to ObjectId failed for value "building-1760535668314" (type string) at path "_id" for model "Building"
```

## 🔍 **สาเหตุ**

ปัญหาเกิดจากการใช้ **string ID ที่สร้างขึ้นเอง** แทนที่จะใช้ **ObjectId ของ Building จริง**:

```typescript
// ❌ ผิด - ใช้ string ID ที่สร้างขึ้นเอง
const newHotspot: BuildingHotspot = {
  id: `building-${Date.now()}`, // "building-1760535668314"
  // ...
}

// ✅ ถูก - ใช้ ObjectId ของ Building จริง
const newHotspot: BuildingHotspot = {
  id: newBuilding._id, // "507f1f77bcf86cd799439011"
  // ...
}
```

## 🔧 **การแก้ไข**

### **1. สร้าง Building จริงในฐานข้อมูล**

```typescript
const handleImageClick = async (e: React.MouseEvent<HTMLDivElement>) => {
  // ... existing code ...
  
  try {
    // สร้าง Building จริงในฐานข้อมูล
    const buildingResponse = await axios.post('/api/buildings', {
      name: 'อาคารใหม่',
      description: 'คลิกเพื่อแก้ไข',
      buildingType: 'accommodation',
      facilities: [],
      x,
      y,
    })

    const newBuilding = buildingResponse.data

    const newHotspot: BuildingHotspot = {
      id: newBuilding._id, // ใช้ ObjectId จริง
      x,
      y,
      buildingName: newBuilding.name,
      buildingType: newBuilding.buildingType,
      rooms: [],
      description: newBuilding.description,
      facilities: newBuilding.facilities,
    }

    onChange([...hotspots, newHotspot])
    // ...
  } catch (error) {
    // ... error handling ...
  }
}
```

### **2. อัปเดต Building ในฐานข้อมูล**

```typescript
const handleHotspotUpdate = async (index: number, updates: Partial<BuildingHotspot>) => {
  const hotspot = hotspots[index]
  const newHotspots = [...hotspots]
  newHotspots[index] = { ...hotspot, ...updates }
  onChange(newHotspots)

  // อัปเดต Building ในฐานข้อมูล
  try {
    await axios.put(`/api/buildings/${hotspot.id}`, {
      name: updates.buildingName || hotspot.buildingName,
      description: updates.description || hotspot.description,
      buildingType: updates.buildingType || hotspot.buildingType,
      facilities: updates.facilities || hotspot.facilities,
      x: updates.x !== undefined ? updates.x : hotspot.x,
      y: updates.y !== undefined ? updates.y : hotspot.y,
    })
  } catch (error) {
    // ... error handling ...
  }
}
```

### **3. ลบ Building จากฐานข้อมูล**

```typescript
const handleDeleteHotspot = async (index: number) => {
  if (!confirm('ต้องการลบจุดนี้ใช่หรือไม่?')) return
  
  const hotspot = hotspots[index]
  
  try {
    // ลบ Building ในฐานข้อมูล
    await axios.delete(`/api/buildings/${hotspot.id}`)
    
    // อัปเดต UI
    const newHotspots = hotspots.filter((_, i) => i !== index)
    onChange(newHotspots)
    setSelectedIndex(null)
    
    toast.success('ลบอาคารสำเร็จ')
  } catch (error) {
    // ... error handling ...
  }
}
```

## 🎯 **ผลลัพธ์**

### **✅ ก่อนแก้ไข**
- สร้าง hotspot ด้วย string ID (`building-${Date.now()}`)
- เมื่อผูกห้องพัก → CastError เพราะไม่ใช่ ObjectId
- ข้อมูลไม่ sync กับฐานข้อมูล

### **✅ หลังแก้ไข**
- สร้าง Building จริงในฐานข้อมูลก่อน
- ใช้ ObjectId จริงของ Building
- ผูกห้องพักได้สำเร็จ
- ข้อมูล sync กับฐานข้อมูล

## 🔄 **Workflow ใหม่**

```
1. คลิกบนแผนผัง → สร้าง Building จริงในฐานข้อมูล
2. ใช้ ObjectId ของ Building จริงเป็น hotspot.id
3. แก้ไข hotspot → อัปเดต Building ในฐานข้อมูล
4. ลบ hotspot → ลบ Building จากฐานข้อมูล
5. ผูกห้องพัก → ใช้ ObjectId จริง → สำเร็จ
```

## 🚀 **ประโยชน์**

### **1. ข้อมูลถูกต้อง**
- Building มี ObjectId จริง
- สามารถผูกห้องพักได้
- ข้อมูล sync กับฐานข้อมูล

### **2. การจัดการที่ดี**
- สร้าง/แก้ไข/ลบ Building ได้จริง
- ไม่มีข้อมูลหลอกในระบบ
- สามารถ query ข้อมูลได้ถูกต้อง

### **3. User Experience**
- ไม่มี error เมื่อผูกห้องพัก
- ระบบทำงานได้ราบรื่น
- ข้อมูลถูกต้องและเชื่อถือได้

## 🔍 **การทดสอบ**

### **ทดสอบการสร้างอาคาร**
1. ไปที่ `/admin/site-map`
2. คลิกปุ่ม "เพิ่มจุด"
3. คลิกบนแผนผัง
4. ✅ ควรสร้าง Building จริงในฐานข้อมูล

### **ทดสอบการผูกห้องพัก**
1. เลือกอาคารที่สร้างแล้ว
2. เลือกห้องพักในรายการ
3. บันทึก
4. ✅ ควรผูกห้องพักกับอาคารสำเร็จ (ไม่มี CastError)

## 📝 **หมายเหตุ**

- **Backward Compatibility**: ข้อมูลเก่าจะยังคงทำงานได้
- **Performance**: ไม่มีผลกระทบต่อประสิทธิภาพ
- **Data Integrity**: ข้อมูลถูกต้องและเชื่อถือได้มากขึ้น
