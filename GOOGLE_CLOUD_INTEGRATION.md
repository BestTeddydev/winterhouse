# Google Cloud Storage Integration

ระบบอัปโหลดไฟล์ได้ถูกอัปเกรดให้ใช้ Google Cloud Storage แทนการเก็บไฟล์ในโฟลเดอร์ local

## ไฟล์ที่เปลี่ยนแปลง

### ใหม่
- `src/lib/gcs.ts` - Google Cloud Storage configuration และ helper functions
- `src/lib/fileUtils.ts` - Utility functions สำหรับจัดการไฟล์
- `src/app/api/upload/delete/route.ts` - API สำหรับลบไฟล์
- `scripts/migrate-to-gcs.js` - Script สำหรับย้ายไฟล์เก่าไป GCS
- `GOOGLE_CLOUD_SETUP.md` - คู่มือการตั้งค่า Google Cloud

### แก้ไข
- `src/app/api/upload/route.ts` - อัปเดตให้ใช้ Google Cloud Storage

## การตั้งค่า

1. **ติดตั้ง dependencies**
   ```bash
   npm install @google-cloud/storage
   ```

2. **ตั้งค่า Google Cloud Storage** (ดูรายละเอียดใน `GOOGLE_CLOUD_SETUP.md`)

3. **เพิ่ม environment variables** ใน `.env.local`:
   ```env
   GOOGLE_CLOUD_PROJECT_ID=your-project-id
   GOOGLE_CLOUD_BUCKET_NAME=winterhouse-uploads
   GOOGLE_CLOUD_KEY_FILE=path/to/service-account-key.json
   ```

## การใช้งาน

### อัปโหลดไฟล์
```javascript
const formData = new FormData()
formData.append('file', file)

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData
})

const result = await response.json()
// result.url จะเป็น Google Cloud Storage URL
```

### ลบไฟล์
```javascript
const response = await fetch('/api/upload/delete', {
  method: 'DELETE',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ filename: 'uploads/filename.jpg' })
})
```

## การย้ายไฟล์เก่า

รัน script เพื่อย้ายไฟล์เก่าจาก local storage ไป Google Cloud Storage:

```bash
node scripts/migrate-to-gcs.js
```

## ข้อดี

1. **Scalability** - รองรับไฟล์จำนวนมากและขนาดใหญ่
2. **Reliability** - Google Cloud Storage มีความน่าเชื่อถือสูง
3. **Performance** - CDN และ caching ที่ดี
4. **Cost-effective** - จ่ายตามการใช้งานจริง
5. **Security** - ระบบรักษาความปลอดภัยระดับ enterprise

## หมายเหตุ

- ไฟล์ใหม่จะถูกเก็บใน Google Cloud Storage
- URL ของไฟล์จะเป็น: `https://storage.googleapis.com/bucket-name/filename`
- สามารถลบไฟล์เก่าออกจาก `public/uploads/` ได้หลังจากย้ายเสร็จ
