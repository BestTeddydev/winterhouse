# บ้านลมหนาว (Winterhouse) — ระบบจองห้องพัก / ลานกางเต็นท์

Next.js 14 (App Router) + Firestore + Firebase Storage, เข้าสู่ระบบด้วย LINE, ชำระเงินผ่าน Stripe

## โครงสร้าง

```
src/
  app/                 หน้าเว็บ (App Router) และ API routes (src/app/api/**/route.ts)
  server/              โค้ดฝั่ง server ทั้งหมดของ API
    http.ts            apiRoute(): สิทธิ์ + ตรวจ input ด้วย zod + error response แบบเดียวกันทุก route
    auth.ts            session, บทบาท (STAFF_ROLES), ตรวจความเป็นเจ้าของข้อมูล
    errors.ts          ApiError (badRequest/notFound/conflict/…) และการแปลง error เป็น response
    schemas/           zod schema ของ request แต่ละแบบ
    services/          business logic: bookings, payments, availability, locks, attendance, siteMap, …
  models/              schema ของข้อมูล (Firestore ผ่าน src/lib/odm.ts)
  lib/                 โค้ดที่ใช้ได้ทั้ง client/server: ราคา (pricing, bookingPrice), วันที่ (dates, calendar), Firebase, LINE, email, Stripe
  components/          React components
tests/
  integration/         เรียก route handler จริงกับ Firestore emulator
  support/             emulator, mock (session, Stripe, LINE, email), factory ข้อมูลทดสอบ
```

- route ทำแค่ `apiRoute({ access, body, query }, handler)` แล้วเรียก service — ไม่มี logic ธุรกิจใน route
- ราคา/ยอดชำระคำนวณที่ server เสมอ (`src/lib/bookingPrice.ts`) ลูกค้าส่งราคา/ส่วนลด/สถานะมาเองไม่ได้
- กันจองซ้อน: `src/server/services/availability.ts` (รวมการ hold ห้อง 30 นาทีระหว่างจ่ายเงิน)
- วันที่ทางธุรกิจเป็นเวลาไทยเสมอ (`src/lib/dates.ts`) ไม่ขึ้นกับ time zone ของ server

ข้อมูลอยู่ที่ Firestore database `baanlomnow-sg` (asia-southeast1, สิงคโปร์) และ Storage bucket `baanlomnow-3501a.firebasestorage.app` (asia-southeast1)

### Query และ index

`src/lib/odm.ts` ส่งเงื่อนไข `==`, `$in`, ช่วงวันที่ (`$gt/$gte/$lt/$lte`) และ array-contains ไปให้ Firestore กรอง แล้วตรวจเงื่อนไขทั้งหมดซ้ำในหน่วยความจำ
query ที่ใช้หลาย field ต้องมี composite index ใน `firestore.indexes.json` — ถ้าเพิ่ม query แบบใหม่แล้วไม่มี index แอปจะยังทำงาน (ถอยไปกรองเฉพาะ `==`) แต่จะ log `[odm] Missing Firestore index ...` พร้อมลิงก์สร้าง index ให้เพิ่มลงไฟล์แล้ว deploy

บทบาทผู้ใช้: `CUSTOMER` (ค่าเริ่มต้น), `EMPLOYEE`, `OWNER`, `ADMIN`

## ทดสอบ

```bash
npm run typecheck
npm run lint
npm test                  # unit + integration (เปิด Firestore emulator ใน Docker ให้เอง)
npm run test:unit         # เฉพาะ unit (ไม่ต้องใช้ Docker)
npm run test:integration
```

integration test ใช้ project `demo-winterhouse` บน emulator เท่านั้น ไม่แตะข้อมูลจริง และ mock Stripe / LINE / email
GitHub Actions (`.github/workflows/ci.yml`) รัน typecheck, lint, test และ build ทุก push/PR

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
