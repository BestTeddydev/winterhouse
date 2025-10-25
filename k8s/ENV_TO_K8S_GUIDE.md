# 🔐 คู่มือการแปลง .env เป็น Kubernetes Secrets

## 📋 ขั้นตอนการใช้งาน

### 1. เตรียมไฟล์ .env

```bash
# คัดลอกไฟล์ template
cp k8s/env-template .env

# แก้ไขไฟล์ .env ด้วยข้อมูลจริง
nano .env
```

### 2. ตรวจสอบ .env file

```bash
# ตรวจสอบว่าตัวแปรที่จำเป็นครบถ้วน
./k8s/env-to-k8s.sh validate
```

### 3. สร้าง Kubernetes Secrets

```bash
# สร้าง secrets จาก .env file
./k8s/env-to-k8s.sh secrets

# หรือสร้างทั้งหมด (secrets + configmap + ingress)
./k8s/env-to-k8s.sh all
```

### 4. ตรวจสอบไฟล์ที่สร้างขึ้น

```bash
# ดู secrets.yaml
cat k8s/secrets.yaml

# ดู configmap.yaml
cat k8s/configmap.yaml

# ดู ingress.yaml
cat k8s/ingress.yaml
```

## 🔧 วิธีการใช้งาน Script

### สร้าง Secrets เท่านั้น
```bash
./k8s/env-to-k8s.sh secrets
```

### สร้าง ConfigMap เท่านั้น
```bash
./k8s/env-to-k8s.sh config
```

### อัปเดต Ingress เท่านั้น
```bash
./k8s/env-to-k8s.sh ingress
```

### สร้างทั้งหมด
```bash
./k8s/env-to-k8s.sh all
```

### ตรวจสอบ .env file
```bash
./k8s/env-to-k8s.sh validate
```

## 📝 Environment Variables ที่จำเป็น

### Required Variables:
- `NEXTAUTH_SECRET` - Secret key สำหรับ NextAuth
- `LINE_CHANNEL_ID` - LINE Channel ID
- `LINE_CHANNEL_SECRET` - LINE Channel Secret
- `LINE_CHANNEL_ACCESS_TOKEN` - LINE Channel Access Token

### Optional Variables:
- `MONGODB_URI` - MongoDB connection string
- `MONGODB_ROOT_PASSWORD` - MongoDB root password
- `GOOGLE_CLOUD_PROJECT_ID` - Google Cloud Project ID
- `GOOGLE_CLOUD_STORAGE_BUCKET` - Google Cloud Storage Bucket
- `STRIPE_PUBLIC_KEY` - Stripe public key
- `STRIPE_SECRET_KEY` - Stripe secret key
- `RESEND_API_KEY` - Resend API key
- `LINE_ADMIN_USER_ID` - LINE Admin User ID

## 🔍 การตรวจสอบ Base64 Encoding

### ตรวจสอบว่า value เป็น base64 ที่ถูกต้อง:
```bash
echo "your-base64-value" | base64 -d
```

### Encode value เป็น base64:
```bash
echo -n "your-secret-value" | base64
```

## 🚀 การ Deploy

หลังจากสร้าง secrets แล้ว:

```bash
# Apply secrets
kubectl apply -f k8s/secrets.yaml

# Apply configmap
kubectl apply -f k8s/configmap.yaml

# Apply ingress
kubectl apply -f k8s/ingress.yaml

# ตรวจสอบ
kubectl get secrets -n baanlomnow
kubectl get configmap -n baanlomnow
kubectl get ingress -n baanlomnow
```

## 🛠️ Troubleshooting

### ปัญหา: "illegal base64 data"
**สาเหตุ:** Value ใน secrets.yaml ไม่ได้ encode เป็น base64
**วิธีแก้:**
```bash
# ใช้ script สร้างใหม่
./k8s/env-to-k8s.sh secrets
```

### ปัญหา: "Secret not found"
**สาเหตุ:** ไฟล์ .env ไม่มีตัวแปรที่จำเป็น
**วิธีแก้:**
```bash
# ตรวจสอบ .env file
./k8s/env-to-k8s.sh validate
```

### ปัญหา: "Invalid domain"
**สาเหตุ:** NEXTAUTH_URL ไม่ถูกต้อง
**วิธีแก้:**
```bash
# แก้ไข NEXTAUTH_URL ใน .env
NEXTAUTH_URL=https://your-domain.com
```

## 📚 ตัวอย่างการใช้งาน

### 1. สร้าง .env file
```bash
# คัดลอก template
cp k8s/env-template .env

# แก้ไขข้อมูลจริง
nano .env
```

### 2. ใส่ข้อมูลจริงใน .env
```env
NEXTAUTH_SECRET=your-actual-secret-key
LINE_CHANNEL_ID=actual-channel-id
LINE_CHANNEL_SECRET=actual-channel-secret
LINE_CHANNEL_ACCESS_TOKEN=actual-access-token
```

### 3. สร้าง secrets
```bash
./k8s/env-to-k8s.sh all
```

### 4. Deploy
```bash
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/ingress.yaml
```

---

**🎉 ตอนนี้คุณสามารถแปลง .env เป็น Kubernetes Secrets ได้แล้ว!**
