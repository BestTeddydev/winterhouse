# บ้านลมหนาว (Winterhouse) — ระบบจองห้องพัก / ลานกางเต็นท์

Next.js 14 (App Router) + Firestore + Firebase Storage, เข้าสู่ระบบด้วย LINE, ชำระเงินผ่าน Stripe

## โครงสร้าง

| ส่วน | ที่อยู่ |
|---|---|
| หน้าเว็บ (ลูกค้า / แอดมิน / เจ้าของ / พนักงาน) | `src/app/**/page.tsx` |
| API | `src/app/api/**/route.ts` |
| Model (schema, validation) | `src/models/*.ts` |
| Model layer บน Firestore (API แบบ Mongoose: `find`, `populate`, `save`, ...) | `src/lib/odm.ts` |
| Firebase Admin SDK (Firestore / Storage) | `src/lib/firebase.ts` |
| สิทธิ์ใน API (`requireSession`, `findSessionUser`, `apiErrorResponse`) | `src/lib/api-auth.ts` |
| สิทธิ์ของหน้าเว็บ | `src/middleware.ts` |
| LINE Login (NextAuth) | `src/lib/auth.ts` |
| อัปโหลดรูป | `src/lib/storage.ts`, `src/app/api/upload/route.ts` |
| Security rules / Firestore indexes | `firestore.rules`, `storage.rules`, `firestore.indexes.json` |

ข้อมูลอยู่ที่ Firestore database `baanlomnow-sg` (asia-southeast1, สิงคโปร์) และ Storage bucket `baanlomnow-3501a.firebasestorage.app` (asia-southeast1)

### Query และ index

`src/lib/odm.ts` ส่งเงื่อนไข `==`, `$in`, ช่วงวันที่ (`$gt/$gte/$lt/$lte`) และ array-contains ไปให้ Firestore กรอง แล้วตรวจเงื่อนไขทั้งหมดซ้ำในหน่วยความจำ
query ที่ใช้หลาย field ต้องมี composite index ใน `firestore.indexes.json` — ถ้าเพิ่ม query แบบใหม่แล้วไม่มี index แอปจะยังทำงาน (ถอยไปกรองเฉพาะ `==`) แต่จะ log `[odm] Missing Firestore index ...` พร้อมลิงก์สร้าง index ให้เพิ่มลงไฟล์แล้ว deploy

บทบาทผู้ใช้: `CUSTOMER` (ค่าเริ่มต้น), `EMPLOYEE`, `OWNER`, `ADMIN`

## รันบนเครื่อง

ต้องใช้ Node.js 22+

```bash
npm install
cp .env.example .env.local   # แล้วใส่ค่า
# วาง service account key ของ Firebase ไว้ที่ secrets/baanlomnow-firebase.json
npm run dev
```

ถ้าไม่อยากต่อ Firestore จริงระหว่างพัฒนา ใช้ Firestore emulator ได้:

```bash
docker run -d --rm -p 8089:8080 gcr.io/google.com/cloudsdktool/google-cloud-cli:emulators \
  gcloud emulators firestore start --host-port=0.0.0.0:8080
FIRESTORE_EMULATOR_HOST=localhost:8089 npm run dev
```

## Scripts

| คำสั่ง | ใช้ทำอะไร |
|---|---|
| `node scripts/create-admin-user.js --email a@b.com --name "Admin"` | สร้าง / เลื่อนผู้ใช้เป็น ADMIN |
| `node scripts/migrate-to-firebase.js [--dry-run]` | ย้ายข้อมูลจาก MongoDB + GCS เดิมมา Firestore / Firebase Storage (ใช้ตอน cutover) |

## Deploy

ดู [DEPLOY_DIGITALOCEAN.md](DEPLOY_DIGITALOCEAN.md) — Docker Compose (app + Caddy HTTPS) บน droplet

การตั้งค่า LINE Login: [LINE_SETUP_GUIDE.md](LINE_SETUP_GUIDE.md)
