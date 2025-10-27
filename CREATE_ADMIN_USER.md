# 🔧 การสร้าง Admin User

มีหลายวิธีในการสร้าง Admin User ให้เลือกวิธีที่เหมาะสมที่สุด

## วิธีที่ 1: ใช้ Script (แนะนำ) ✨

### ใช้งาน:

```bash
# รัน script และกรอกข้อมูล
node scripts/create-admin-user.js

# หรือระบุข้อมูลล่วงหน้า
node scripts/create-admin-user.js --email admin@example.com --name "Admin User"
```

### ตัวอย่างการใช้งาน:

```bash
$ node scripts/create-admin-user.js

🚀 Connecting to MongoDB...
✅ Connected to MongoDB successfully
📧 Enter email: admin@winterhouse.com
👤 Enter name: Admin User

📝 Creating new admin user...

✅ Admin user created successfully!
📋 User details:
  - ID: 67a1b2c3d4e5f6g7h8i9j0k1
  - Name: Admin User
  - Email: admin@winterhouse.com
  - Role: ADMIN

👥 All ADMIN users:

1. Admin User
   Email: admin@winterhouse.com
   ID: 67a1b2c3d4e5f6g7h8i9j0k1

✅ Done!
```

### ถ้า User มีอยู่แล้ว:

```bash
$ node scripts/create-admin-user.js

🚀 Connecting to MongoDB...
✅ Connected to MongoDB successfully
📧 Enter email: user@example.com

⚠️  User already exists!
📋 Current user info:
  - Name: User Name
  - Email: user@example.com
  - Role: CUSTOMER
  - LINE User ID: U1234567890abcdefghijklmnopqrstuvw

❓ Do you want to promote this user to ADMIN? (yes/no): yes

✅ User promoted to ADMIN successfully!
```

---

## วิธีที่ 2: ใช้ LINE Login แล้วอัพเกรดเป็น Admin

### ขั้นตอน:

1. **Login ด้วย LINE** ที่ http://localhost:3000 (หรือ production URL)
2. **Copy LINE User ID** จาก browser console หรือ database
3. **รัน script** เพื่ออัพเกรดเป็น admin:

```bash
node scripts/create-admin-user.js --email YOUR_EMAIL --name "Your Name"
# แล้วเลือก promote เป็น admin
```

หรือใช้ API:

```bash
# 1. ดึง user ที่ต้องการ
curl http://localhost:3000/api/admin/users | jq

# 2. อัพเกรดเป็น admin
curl -X PATCH http://localhost:3000/api/admin/users/USER_ID \
  -H "Content-Type: application/json" \
  -d '{"role":"ADMIN"}'
```

---

## วิธีที่ 3: ใช้ MongoDB Shell

### เข้า MongoDB Shell:

```bash
# Local Docker
docker-compose exec db mongosh mongodb://admin:admin123@localhost:27017/baanlomnow

# Production K8s
kubectl exec -it deployment/mongodb -n baanlomnow -- mongosh
```

### สร้าง Admin User:

```javascript
// เชื่อมต่อ database
use baanlomnow

// Insert admin user
db.users.insertOne({
  name: "Admin User",
  email: "admin@winterhouse.com",
  role: "ADMIN",
  createdAt: new Date(),
  updatedAt: new Date()
})

// หรืออัพเกรด user ที่มีอยู่
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { role: "ADMIN", updatedAt: new Date() } }
)

// ดู admin users ทั้งหมด
db.users.find({ role: "ADMIN" })
```

---

## วิธีที่ 4: ใช้ API Endpoints

### ดู Users ทั้งหมด:

```bash
curl http://localhost:3000/api/admin/users | jq
```

### สร้าง Admin User ใหม่:

```bash
curl -X POST http://localhost:3000/api/admin/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@winterhouse.com",
    "role": "ADMIN"
  }' | jq
```

### อัพเกรด User เป็น Admin:

```bash
curl -X PATCH http://localhost:3000/api/admin/users/USER_ID \
  -H "Content-Type: application/json" \
  -d '{"role":"ADMIN"}' | jq
```

---

## วิธีที่ 5: ใช้ Admin Panel

1. Login ด้วย LINE
2. อัพเกรดตัวเองเป็น admin ด้วยวิธีการข้างต้น
3. Login อีกครั้ง
4. เข้า `/admin` page
5. ไปที่ "จัดการ Users"
6. คลิก "Promote to Admin" สำหรับ user ที่ต้องการ

---

## ตรวจสอบว่าทำงานถูกต้อง

### 1. ตรวจสอบ Logs

```bash
# Local
curl http://localhost:3000/api/admin/users

# Production
kubectl logs -f deployment/baanlomnow-app -n baanlomnow | grep -A 5 "User"
```

### 2. Login และทดสอบ

1. Login ด้วย LINE
2. ควรเห็นเมนู "จัดการระบบ" ปรากฏขึ้น
3. เข้าได้ `/admin` page
4. เข้าได้ `/admin/rooms` page

### 3. ตรวจสอบ Role ใน Database

```bash
# ใช้ MongoDB Shell
db.users.find({ role: "ADMIN" }).pretty()
```

---

## การลบ Admin User

```bash
# ใช้ API
curl -X DELETE http://localhost:3000/api/admin/users/USER_ID | jq

# หรือใช้ MongoDB Shell
db.users.deleteOne({ _id: ObjectId("USER_ID") })
```

---

## ⚠️ ข้อควรระวัง

1. **ต้องมี NEXTAUTH_SECRET ที่ถูกต้อง** - ถ้าไม่มีจะ login ไม่ได้
2. **ต้องมี MongoDB connection ที่ถูกต้อง** - ตรวจสอบ environment variables
3. **Production vs Local** - ใช้ URL และ credentials ที่ถูกต้อง
4. **LINE User ID** - ถ้าใช้ LINE login จะต้องมี lineUserId
5. **Security** - อย่าให้ใครก็ได้สร้าง admin user ได้ (ควร protected API)

---

## บันทึกประจำ (Quick Reference)

```bash
# สร้าง admin user ใหม่
node scripts/create-admin-user.js

# อัพเกรด user ที่มีอยู่เป็น admin
node scripts/create-admin-user.js --email existing@user.com --name "Name"

# ดู users ทั้งหมด
curl http://localhost:3000/api/admin/users | jq

# อัพเกรดเป็น admin
curl -X PATCH http://localhost:3000/api/admin/users/USER_ID \
  -H "Content-Type: application/json" \
  -d '{"role":"ADMIN"}' | jq
```

---

## Troubleshooting

### Problem: Cannot connect to MongoDB

```bash
# ตรวจสอบ MongoDB running
docker-compose ps db

# หรือ
kubectl get pods -n baanlomnow | grep mongodb
```

### Problem: User created but cannot login

- ตรวจสอบ NEXTAUTH_SECRET
- ตรวจสอบ NEXTAUTH_URL
- ตรวจสอบ cookies ใน browser

### Problem: API returns 404

- ตรวจสอบว่า route file อยู่ในที่ถูกต้อง
- ตรวจสอบ Next.js running
- ตรวจสอบ build

---

## 📝 Notes

- Script จะสร้าง user ใน database แต่ไม่ได้ login ให้ อ่านส้นต้อง login เองผ่าน LINE
- ถ้าใช้งาน LINE login จะต้องมี lineUserId (จะถูก auto-fill เมื่อ login ครั้งแรก)
- Admin users สามารถ access `/admin` pages ได้ทั้งหมด
- Production: ใช้ credentials ที่ถูกต้องและ secure

