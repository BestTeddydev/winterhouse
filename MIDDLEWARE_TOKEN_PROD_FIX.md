# 🐛 แก้ไขปัญหา Middleware ไม่มี Token ใน Production

## ปัญหาที่พบ
- บน local: Middleware ทำงานปกติ มี token
- บน production: Middleware ไม่มี token

## สาเหตุ
1. **NEXTAUTH_SECRET ไม่ตรงกัน**: อาจใช้ secret ต่างกันระหว่าง sign-in และ getToken
2. **Cookie settings**: Cookie name และ settings ไม่ตรงกัน
3. **Environment variables**: NEXTAUTH_SECRET อาจยังเป็น placeholder

## การแก้ไขที่ทำไปแล้ว

### 1. แก้ไข Middleware (`src/middleware.ts`)
- ✅ เปลี่ยนจาก `withAuth` เป็น `getToken` จาก `next-auth/jwt`
- ✅ เพิ่ม error handling และ logging
- ✅ เพิ่ม logging ของ cookies ทั้งหมด
- ✅ ระบุ cookieName อย่างชัดเจน: `next-auth.session-token`

### 2. แก้ไข Auth Config (`src/lib/auth.ts`)
- ✅ ใช้ cookie name เดียวกัน: `next-auth.session-token`
- ✅ ตั้ง `secure: true` สำหรับ production
- ✅ ตั้ง `sameSite: 'lax'`

### 3. แก้ไข ConfigMap (`k8s/configmap.yaml`)
- ✅ ลบ `NEXTAUTH_SECRET` ออกจาก ConfigMap (ควรอยู่ใน Secret เท่านั้น)

## สิ่งที่ต้องทำใน Production

### 1. ตรวจสอบ NEXTAUTH_SECRET

```bash
# ดูค่าปัจจุบัน
kubectl get secret baanlomnow-secrets -n baanlomnow -o jsonpath='{.data.NEXTAUTH_SECRET}' | base64 -d

# ควรได้ค่าที่ไม่ใช่ "CHANGE_ME_TO_SECURE_SECRET"
```

### 2. สร้าง NEXTAUTH_SECRET ที่ถูกต้อง

ใช้คำสั่งนี้เพื่อสร้าง secret:

```bash
# สร้าง random secret (32 characters)
openssl rand -base64 32

# หรือ
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3. อัพเดท Secret ใน Kubernetes

```bash
# แก้ไข secret
kubectl edit secret baanlomnow-secrets -n baanlomnow

# หรือใช้คำสั่งนี้ (แทน YOUR_SECRET ด้วยค่าจริง)
kubectl create secret generic baanlomnow-secrets \
  --from-literal=NEXTAUTH_SECRET=YOUR_SECRET \
  --from-literal=MONGODB_URI=YOUR_MONGODB_URI \
  --from-literal=LINE_CHANNEL_ID=YOUR_LINE_CHANNEL_ID \
  --from-literal=LINE_CHANNEL_SECRET=YOUR_LINE_CHANNEL_SECRET \
  --dry-run=client -o yaml | kubectl apply -f - -n baanlomnow
```

### 4. Restart Pods

```bash
# Restart deployment
kubectl rollout restart deployment baanlomnow-app -n baanlomnow

# ตรวจสอบ status
kubectl get pods -n baanlomnow
```

### 5. ตรวจสอบ Logs

```bash
# ดู logs ของ middleware
kubectl logs -f deployment/baanlomnow-app -n baanlomnow | grep "Middleware"

# ควรเห็น logs แบบนี้:
# 🔍 Middleware Debug Info:
#   - NEXTAUTH_SECRET exists: true
#   - NEXTAUTH_SECRET length: 32 (หรือค่าที่ถูกต้อง)
# 🍪 Request cookies: [...]
# ✅ Token fetched successfully
```

## ตรวจสอบว่าทำงานถูกต้อง

1. **ล็อกอินผ่าน LINE**
2. **ตรวจสอบ logs ว่าเห็น token**
3. **ลองเข้า /admin page ควรเข้าถึงได้ถ้า role เป็น ADMIN**
4. **ลองเข้า /bookings page ควรเข้าถึงได้**

## Debugging Steps

ถ้ายังมีปัญหา ให้:

1. **ตรวจสอบ cookie มีหรือไม่**
   ```bash
   kubectl logs -f deployment/baanlomnow-app -n baanlomnow | grep "🍪"
   ```

2. **ตรวจสอบ NEXTAUTH_SECRET**
   ```bash
   kubectl logs -f deployment/baanlomnow-app -n baanlomnow | grep "NEXTAUTH_SECRET"
   ```

3. **ตรวจสอบ environment variables ทั้งหมด**
   ```bash
   kubectl exec -it deployment/baanlomnow-app -n baanlomnow -- env | grep NEXTAUTH
   ```

## Checklist

- [ ] NEXTAUTH_SECRET ใน Kubernetes Secret ไม่ใช่ "CHANGE_ME_TO_SECURE_SECRET"
- [ ] NEXTAUTH_SECRET มีความยาวอย่างน้อย 32 characters
- [ ] NEXTAUTH_SECRET เดียวกันกับ local (แต่ใช้คนละ secret เป็น OK ถ้า local กับ prod แยกกัน)
- [ ] NEXTAUTH_URL ถูกต้อง: `https://baanlomnow.com`
- [ ] Pods restarted แล้ว
- [ ] Logs แสดง token มีอยู่

## สำคัญ!

⚠️ **NEXTAUTH_SECRET ใน production ต้องเหมือนกับเวลาที่ user sign-in** ถ้าเปลี่ยน NEXTAUTH_SECRET ทุกคนจะต้อง sign-in ใหม่

## Files Changed

- `src/middleware.ts` - เปลี่ยนใช้ getToken และเพิ่ม logging
- `src/lib/auth.ts` - แก้ไข cookie settings
- `k8s/configmap.yaml` - ลบ NEXTAUTH_SECRET ออก

