# Google Cloud Storage Setup Guide

## 1. สร้าง Google Cloud Project
1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. สร้าง project ใหม่หรือเลือก project ที่มีอยู่
3. เปิดใช้งาน Cloud Storage API

## 2. สร้าง Service Account
1. ไปที่ IAM & Admin > Service Accounts
2. คลิก "Create Service Account"
3. ตั้งชื่อ: `winterhouse-storage`
4. เลือก role: `Storage Admin`
5. สร้าง key file (JSON)

## 3. สร้าง Storage Bucket
1. ไปที่ Cloud Storage > Buckets
2. คลิก "Create Bucket"
3. ตั้งชื่อ: `winterhouse-uploads` (หรือชื่ออื่น)
4. เลือก region: `asia-southeast1` (Singapore)
5. เลือก storage class: `Standard`
6. เลือก access control: `Uniform`

## 4. ตั้งค่า Environment Variables
เพิ่มในไฟล์ `.env.local`:

```env
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_BUCKET_NAME=winterhouse-uploads
GOOGLE_CLOUD_KEY_FILE=path/to/service-account-key.json
```

## 5. ตั้งค่า CORS (ถ้าจำเป็น)
หากมีปัญหา CORS ให้ตั้งค่าใน Google Cloud Console:
1. ไปที่ Cloud Storage > Buckets
2. เลือก bucket ของคุณ
3. คลิก "Permissions" tab
4. คลิก "Add CORS policy"
5. เพิ่ม policy:

```json
[
  {
    "origin": ["*"],
    "method": ["GET", "POST", "PUT", "DELETE"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
```

## 6. ทดสอบการทำงาน
1. รัน development server: `npm run dev`
2. ลองอัปโหลดไฟล์ผ่านหน้าเว็บ
3. ตรวจสอบว่าไฟล์ปรากฏใน Google Cloud Storage

## หมายเหตุ
- ไฟล์จะถูกเก็บใน Google Cloud Storage แทนโฟลเดอร์ local
- URL ของไฟล์จะเป็น: `https://storage.googleapis.com/bucket-name/filename`
- สามารถลบไฟล์เก่าออกจาก local storage ได้
