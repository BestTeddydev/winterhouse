# Deploy บน DigitalOcean Droplet

แอปรันเป็น Docker Compose บน droplet เครื่องเดียว มี 2 container:

- `app` — Next.js (อ่าน/เขียนข้อมูลที่ Firestore และไฟล์ที่ Firebase Storage)
- `caddy` — reverse proxy + HTTPS อัตโนมัติ (Let's Encrypt) สำหรับ `baanlomnow.com`

ไม่มี database บนเครื่อง ข้อมูลทั้งหมดอยู่ที่ Firebase project `baanlomnow-3501a`

## 1. สร้าง droplet

- Ubuntu 24.04 LTS, region **Singapore (SGP1)**
- RAM อย่างน้อย **2 GB** (ตอน `next build` ใช้ RAM เยอะ ถ้าใช้ 1 GB ให้เพิ่ม swap ตามข้อ 2)
- ใส่ SSH key ตอนสร้าง

## 2. เตรียมเครื่อง

```bash
ssh root@<DROPLET_IP>

# Docker + compose plugin
curl -fsSL https://get.docker.com | sh

# Firewall: เปิดแค่ SSH / HTTP / HTTPS
ufw allow OpenSSH && ufw allow 80 && ufw allow 443/tcp && ufw allow 443/udp && ufw --force enable

# (ถ้า RAM 1 GB) เพิ่ม swap 2 GB
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

## 3. เอาโค้ดและ secrets ขึ้นเครื่อง

```bash
git clone <repo-url> /opt/baanlomnow && cd /opt/baanlomnow
git checkout dev   # branch ที่ใช้ Firebase
```

จากเครื่องตัวเอง copy ไฟล์ที่ไม่อยู่ใน git:

```bash
scp .env root@<DROPLET_IP>:/opt/baanlomnow/.env
ssh root@<DROPLET_IP> mkdir -p /opt/baanlomnow/secrets
scp secrets/baanlomnow-firebase.json root@<DROPLET_IP>:/opt/baanlomnow/secrets/
```

บน droplet ให้ container (user uid 1001) อ่าน key ได้ แต่คนอื่นอ่านไม่ได้:

```bash
chown 1001 /opt/baanlomnow/secrets/baanlomnow-firebase.json
chmod 400 /opt/baanlomnow/secrets/baanlomnow-firebase.json
```

`.env` ต้องมีอย่างน้อย:

```
NEXTAUTH_URL=https://baanlomnow.com
NEXT_PUBLIC_APP_URL=https://baanlomnow.com
NEXTAUTH_SECRET=...
LINE_CHANNEL_ID=...            LINE_CHANNEL_SECRET=...
LINE_CHANNEL_ACCESS_TOKEN=...  LINE_ADMIN_USER_ID=...
STRIPE_PUBLIC_KEY=...          STRIPE_SECRET_KEY=...     STRIPE_WEBHOOK_SECRET=...
RESEND_API_KEY=...             RESEND_FROM_EMAIL=...     ADMIN_EMAIL=...   ADMIN_PHONE=...
```

`MONGODB_URI`, `DATABASE_URL`, `GOOGLE_CLOUD_*` ไม่ต้องใช้แล้ว

## 4. ทดสอบก่อนย้าย DNS (ไม่กระทบเว็บจริง)

ใช้ชื่อ `<ip>.sslip.io` ซึ่งชี้มาที่ IP ของ droplet เอง Caddy จะออก certificate จริงให้ชื่อนี้ได้เลย:

```bash
DOMAIN=<ip-แบบขีด เช่น 159-89-1-2>.sslip.io docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml logs -f
```

เปิด `https://159-89-1-2.sslip.io` แล้วดูหน้าแรก ห้องพัก รูป แผนผัง
(LINE login และ Stripe จะยังใช้ไม่ได้ในโหมดนี้ เพราะ callback ผูกกับ `baanlomnow.com`)

## 5. ย้ายระบบจริง (cutover)

1. หยุดรับการจองบนระบบเดิม (GKE) ชั่วคราว
2. sync ข้อมูลรอบสุดท้ายจาก MongoDB → Firestore (รันจากเครื่องที่ต่อ GKE ได้):
   ```bash
   kubectl port-forward -n baanlomnow svc/mongodb-service 27019:27017
   MONGODB_URI="mongodb://admin:<password>@localhost:27019/baanlomnow?authSource=admin" \
   SOURCE_ACCESS_TOKEN="$(gcloud auth print-access-token)" \
   GOOGLE_CLOUD_PROJECT_ID=project-14a6d9ab-7aaf-49a0-92d \
     node scripts/migrate-to-firebase.js
   ```
3. เปลี่ยน DNS: A record ของ `baanlomnow.com` และ `www` → IP ของ droplet
4. บน droplet รันด้วยโดเมนจริง:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```
   Caddy จะขอ certificate เองเมื่อ DNS ชี้มาถึง (ดู log ได้ที่ `docker compose -f docker-compose.prod.yml logs caddy`)
5. ทดสอบ LINE login, จองห้อง, ชำระเงิน Stripe (URL webhook `https://baanlomnow.com/api/payments/webhook` ไม่เปลี่ยน)
6. เมื่อทุกอย่างปกติแล้ว ค่อยปิด GKE cluster / MongoDB เพื่อหยุดค่าใช้จ่าย
   (เก็บ backup MongoDB ไว้ก่อนอย่างน้อยสักระยะ)

## อัปเดตเวอร์ชัน

```bash
cd /opt/baanlomnow && git pull
docker compose -f docker-compose.prod.yml up -d --build
docker image prune -f
```

## Firebase rules

ต้อง deploy ครั้งเดียว (และทุกครั้งที่แก้ `firestore.rules` / `storage.rules`) จากเครื่องที่ login Firebase CLI แล้ว:

```bash
npx firebase-tools deploy --only firestore:rules,storage --project baanlomnow-3501a
```

ถ้าไม่ deploy `storage.rules` รูป/วิดีโอในโฟลเดอร์ `public/` ที่หน้าแรกใช้จะโหลดไม่ขึ้น
