# API Documentation

## API Endpoints ที่สร้างเสร็จแล้ว

### 1. Upload API - `/api/upload`

**Method:** POST  
**Purpose:** อัปโหลดรูปภาพ

**Request:**
```typescript
Content-Type: multipart/form-data

Body:
- file: File (image file)
```

**Response:**
```typescript
{
  url: string,          // /uploads/filename.jpg
  filename: string,     // timestamp-originalname.jpg
  size: number,         // file size in bytes
  type: string          // MIME type
}
```

**Validation:**
- ประเภทไฟล์: JPEG, JPG, PNG, GIF, WebP
- ขนาดสูงสุด: 10MB
- จัดเก็บ: `public/uploads/`

**Error Responses:**
- 400: ไม่พบไฟล์ / ประเภทไฟล์ไม่ถูกต้อง / ไฟล์ใหญ่เกินไป
- 500: เกิดข้อผิดพลาดในการอัปโหลด

---

### 2. Site Map API - `/api/site-map`

#### GET - ดึงข้อมูลแผนผัง

**Method:** GET  
**Authentication:** ไม่ต้อง (public)

**Response:**
```typescript
{
  imageUrl: string,
  hotspots: BuildingHotspot[]
}
```

**BuildingHotspot Interface:**
```typescript
{
  id: string,
  x: number,                    // Position X (percentage 0-100)
  y: number,                    // Position Y (percentage 0-100)
  buildingName: string,         // ชื่ออาคาร
  buildingType: string,         // accommodation | cafe | restaurant | facility | parking | garden
  rooms: string[],              // Array of room IDs
  description: string,          // รายละเอียด
  facilities: string[]          // สิ่งอำนวยความสะดวก
}
```

**Notes:**
- ถ้าไม่มีข้อมูล จะสร้างค่า default อัตโนมัติ
- Return แผนผังล่าสุด (sorted by updatedAt)

---

#### POST - บันทึกแผนผัง

**Method:** POST  
**Authentication:** Required (ADMIN only)

**Request:**
```typescript
{
  imageUrl: string,
  hotspots: BuildingHotspot[]
}
```

**Response:**
```typescript
{
  success: boolean,
  message: string,
  data: {
    imageUrl: string,
    hotspots: BuildingHotspot[]
  }
}
```

**Error Responses:**
- 403: ไม่มีสิทธิ์เข้าถึง (ไม่ใช่ ADMIN)
- 400: กรุณาระบุรูปภาพแผนผัง
- 500: ไม่สามารถบันทึกแผนผังได้

**Behavior:**
- ถ้ามีแผนผังอยู่แล้ว → Update
- ถ้าไม่มี → Create new

---

#### DELETE - ลบแผนผัง

**Method:** DELETE  
**Authentication:** Required (ADMIN only)

**Response:**
```typescript
{
  success: boolean,
  message: string
}
```

**Error Responses:**
- 403: ไม่มีสิทธิ์เข้าถึง
- 500: ไม่สามารถลบแผนผังได้

---

## Database Models

### SiteMap Model

**Collection:** `sitemaps`

**Schema:**
```typescript
{
  imageUrl: {
    type: String,
    required: true
  },
  hotspots: [{
    id: String (required),
    x: Number (required),
    y: Number (required),
    buildingName: String (required),
    buildingType: String (enum),
    rooms: [String],
    description: String,
    facilities: [String]
  }],
  createdAt: Date,
  updatedAt: Date
}
```

**Building Types:**
- `accommodation` - ที่พัก
- `cafe` - คาเฟ่
- `restaurant` - ร้านอาหาร
- `facility` - สิ่งอำนวยความสะดวก
- `parking` - ที่จอดรถ
- `garden` - สวน

---

## การใช้งาน API

### Example: อัปโหลดรูปภาพ

```typescript
const handleImageUpload = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })

  const data = await response.json()
  console.log('Image URL:', data.url)
}
```

### Example: ดึงข้อมูลแผนผัง

```typescript
const fetchSiteMap = async () => {
  const response = await fetch('/api/site-map')
  const data = await response.json()
  
  console.log('Image URL:', data.imageUrl)
  console.log('Hotspots:', data.hotspots)
}
```

### Example: บันทึกแผนผัง

```typescript
const saveSiteMap = async (siteMapData) => {
  const response = await fetch('/api/site-map', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(siteMapData),
  })

  const result = await response.json()
  console.log('Saved:', result.success)
}
```

---

## Troubleshooting

### ปัญหา: ปุ่ม "เพิ่มอาคาร" ไม่แสดง

**Solution:**
1. ตรวจสอบว่า component `SiteMapEditor` ถูก import
2. ตรวจสอบ console errors
3. Clear browser cache
4. Restart dev server

### ปัญหา: อัปโหลดรูปไม่ได้

**Solution:**
1. ตรวจสอบว่าโฟลเดอร์ `public/uploads` มีอยู่
2. ตรวจสอบ file permissions
3. ตรวจสอบขนาดไฟล์ (max 10MB)
4. ตรวจสอบประเภทไฟล์

### ปัญหา: บันทึกไม่ได้

**Solution:**
1. ตรวจสอบว่าเข้าสู่ระบบด้วย ADMIN account
2. ตรวจสอบ MongoDB connection
3. ตรวจสอบ console errors
4. ตรวจสอบ network tab

---

## Security

### Authentication
- Upload API: ไม่ต้อง auth (แต่ควรเพิ่มในอนาคต)
- GET Site Map: Public access
- POST/DELETE Site Map: ADMIN only

### File Upload Security
- Validate file type
- Validate file size
- Generate unique filename
- Store in safe directory

### Best Practices
1. เพิ่ม rate limiting สำหรับ upload
2. Scan uploaded files for malware
3. Use CDN สำหรับ production
4. Implement image optimization
5. Add CORS headers if needed

---

## Performance Optimization

### Image Optimization
```bash
# Install sharp for image optimization
npm install sharp

# Use in upload API
import sharp from 'sharp'

const optimizedBuffer = await sharp(buffer)
  .resize(1920, 1080, { fit: 'inside' })
  .webp({ quality: 80 })
  .toBuffer()
```

### Database Indexing
```javascript
// Add index for faster queries
SiteMapSchema.index({ updatedAt: -1 })
```

### Caching
```typescript
// Cache site map in memory or Redis
const cachedSiteMap = await redis.get('site-map')
if (cachedSiteMap) {
  return JSON.parse(cachedSiteMap)
}
```

---

## Future Enhancements

### Phase 1 (ปัจจุบัน)
- ✅ Upload API
- ✅ Site Map CRUD
- ✅ Admin UI

### Phase 2
- 🔲 Public site map view
- 🔲 Image optimization
- 🔲 Multiple site maps
- 🔲 Version control

### Phase 3
- 🔲 3D site maps
- 🔲 Virtual tours
- 🔲 Real-time updates
- 🔲 Mobile app API

---

## Testing

### Test Upload API
```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@/path/to/image.jpg"
```

### Test Get Site Map
```bash
curl http://localhost:3000/api/site-map
```

### Test Save Site Map
```bash
curl -X POST http://localhost:3000/api/site-map \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "/uploads/test.jpg",
    "hotspots": []
  }'
```

---

## Support

หากพบปัญหาหรือต้องการความช่วยเหลือ:
1. ตรวจสอบ console logs
2. ตรวจสอบ network requests
3. ดูเอกสารนี้
4. ติดต่อทีมพัฒนา
