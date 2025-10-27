# 🔐 แก้ปัญหา LINE OAuth Phishing Warning

## อาการ

```
Chrome Warning: Attackers on the site you tried visiting might trick you...
LINE Login callback error
```

## สาเหตุ

1. **HTTPS Certificate ยังไม่พร้อม**: LINE OAuth ต้องใช้ HTTPS แต่ certificate ยัง provisioning
2. **NEXTAUTH_URL ชี้ไป HTTPS**: แต่ยังไม่มี valid SSL certificate
3. **LINE Channel Configuration**: Callback URL ใน LINE channel ยังไม่ตรงกัน

## ✅ วิธีแก้ไข (Step by Step)

### Fix 1: ใช้ HTTP ชั่วคราว (สำหรับ Development)

**แก้ไข secrets.yaml:**

```yaml
NEXTAUTH_URL: "http://baanlomnow.com"
NEXT_PUBLIC_APP_URL: "http://baanlomnow.com"
```

**Apply changes:**

```bash
kubectl delete secret baanlomnow-secrets -n baanlomnow
kubectl apply -f k8s/secrets.yaml
kubectl rollout restart deployment/baanlomnow-app -n baanlomnow
```

**⚠️ ข้อควรระวัง:**
- HTTP ไม่ secure
- เฉพาะสำหรับ development/testing
- ไม่เหมาะสำหรับ production

### Fix 2: รอให้ SSL Certificate Provisioning เสร็จ (แนะนำสำหรับ Production)

**ตรวจสอบ Certificate Status:**

```bash
kubectl get managedcertificate -n baanlomnow
```

**Status ควรเป็น:**
- ✅ `Active` = พร้อมใช้งาน
- ⏳ `Provisioning` = กำลัง provisioning (รอต่อ)
- ❌ `FailedNotVisible` = DNS ยังไม่ resolve

**เมื่อ Certificate Active แล้ว:**

```bash
# ตรวจสอบว่า HTTPS ใช้งานได้
curl https://baanlomnow.com/api/health

# ตรวจสอบ SSL certificate
openssl s_client -connect baanlomnow.com:443 -servername baanlomnow.com
```

### Fix 3: ตั้งค่า LINE Channel Callback URL

**ไปที่ LINE Developers Console:**
1. Login: https://developers.line.biz/
2. เลือก Channel ของคุณ
3. ไปที่ LINE Login settings
4. เพิ่ม Callback URLs:
   ```
   https://baanlomnow.com/api/auth/callback/line
   ```
   
   **หรือสำหรับ development:**
   ```
   http://baanlomnow.com/api/auth/callback/line
   ```

**⚠️ สำคัญ:**
- Callback URL ต้องตรงกับ domain ที่ใช้งานจริง
- ถ้าใช้ HTTPS ต้องมี SSL certificate
- ถ้าใช้ HTTP จะมี Chrome warning

### Fix 4: ตรวจสอบ Environment Variables

**ตรวจสอบใน Kubernetes:**

```bash
kubectl exec deployment/baanlomnow-app -n baanlomnow -- env | grep NEXT
```

**ตรวจสอบ Secrets:**

```bash
kubectl get secret baanlomnow-secrets -n baanlomnow -o yaml
```

**Update secrets ถ้าจำเป็น:**

```bash
# Update secrets.yaml
nano k8s/secrets.yaml

# Apply
kubectl apply -f k8s/secrets.yaml

# Restart deployment
kubectl rollout restart deployment/baanlomnow-app -n baanlomnow
```

## 🔧 Production Solution

### สำหรับ Production (แนะนำ)

**เมื่อ SSL Certificate Active แล้ว:**

1. **Update LINE Channel Callback URL:**
   ```
   https://baanlomnow.com/api/auth/callback/line
   ```

2. **Update Secrets (ใช้ HTTPS):**
   ```yaml
   NEXTAUTH_URL: "https://baanlomnow.com"
   NEXT_PUBLIC_APP_URL: "https://baanlomnow.com"
   ```

3. **Apply และ Restart:**
   ```bash
   kubectl delete secret baanlomnow-secrets -n baanlomnow
   kubectl apply -f k8s/secrets.yaml
   kubectl rollout restart deployment/baanlomnow-app -n baanlomnow
   ```

4. **Verify:**
   ```bash
   # Test OAuth callback
   curl https://baanlomnow.com/api/auth/providers
   
   # Check that Chrome doesn't show warning
   ```

## 🧪 ทดสอบ LINE OAuth

### 1. ตรวจสอบ OAuth Provider Configuration

```bash
# Test API endpoint
curl https://baanlomnow.com/api/auth/providers

# Should return LINE provider configuration
```

### 2. ทดสอบ Callback URL

1. ไปที่: `https://baanlomnow.com/auth/signin`
2. Click "Sign in with LINE"
3. ควร redirect ไป LINE Login
4. หลังจาก login จะ redirect กลับมา

### 3. ตรวจสอบ LINE Channel Configuration

```bash
# ตรวจสอบ LINE credentials
kubectl get secret baanlomnow-secrets -n baanlomnow -o jsonpath='{.data.LINE_CHANNEL_ID}' | base64 -d
```

## 📋 Checklist

### Pre-LINE OAuth
- [ ] SSL Certificate: Active
- [ ] NEXTAUTH_URL: https://baanlomnow.com
- [ ] NEXT_PUBLIC_APP_URL: https://baanlomnow.com
- [ ] LINE Channel ID: configured
- [ ] LINE Channel Secret: configured

### LINE Channel Configuration
- [ ] Callback URL: https://baanlomnow.com/api/auth/callback/line
- [ ] LINE Login enabled
- [ ] Scopes: profile, openid, email
- [ ] Channel verified

### Application Configuration
- [ ] NextAuth configuration: correct
- [ ] Environment variables: set correctly
- [ ] Database connection: working
- [ ] Application running: healthy

## 🆘 Troubleshooting

### Chrome ยังแสดง Warning

**สาเหตุ:** ยังไม่มี SSL certificate

**แก้ไข:**
```bash
# 1. ใช้ HTTP ชั่วคราว
# Update secrets.yaml to use HTTP

# 2. ตั้งค่า LINE channel callback เป็น HTTP
# (เฉพาะสำหรับ testing)

# 3. รอ SSL certificate active
# แล้วเปลี่ยนกลับเป็น HTTPS
```

### LINE OAuth Callback Error

**ตรวจสอบ:**
```bash
# 1. ดู logs
kubectl logs -f deployment/baanlomnow-app -n baanlomnow

# 2. ตรวจสอบ callback URL ใน LINE channel
# ต้องตรงกับ: https://baanlomnow.com/api/auth/callback/line

# 3. ตรวจสอบ environment variables
kubectl exec deployment/baanlomnow-app -n baanlomnow -- env | grep LINE
```

### Invalid Credentials Error

```bash
# ตรวจสอบ credentials
kubectl get secret baanlomnow-secrets -n baanlomnow -o json | jq '.data.LINE_CHANNEL_ID' | base64 -d
kubectl get secret baanlomnow-secrets -n baanlomnow -o json | jq '.data.LINE_CHANNEL_SECRET' | base64 -d

# ตรวจสอบว่า credentials ถูกต้องใน LINE Developers Console
```

## 📚 Related Documentation

- [LINE Login Documentation](https://developers.line.biz/en/docs/line-login/integrate-line-login/)
- [NextAuth LINE Provider](https://next-auth.js.org/providers/line)
- [INGRESS_TROUBLESHOOTING.md](./INGRESS_TROUBLESHOOTING.md)
- [MANAGED_CERTIFICATE_TROUBLESHOOTING.md](./MANAGED_CERTIFICATE_TROUBLESHOOTING.md)

## ⏱️ Timeline

- **SSL Certificate Provisioning**: 10-60 นาที
- **LINE Channel Setup**: 5-10 นาที
- **Application Restart**: 2-5 นาที
- **Total**: ~15-75 นาที

## 💡 Quick Fix for Development

```bash
# 1. เปลี่ยน secrets เป็น HTTP
# Edit k8s/secrets.yaml
NEXTAUTH_URL: "http://baanlomnow.com"  # หรือ use HTTP
NEXT_PUBLIC_APP_URL: "http://baanlomnow.com"

# 2. Apply
kubectl delete secret baanlomnow-secrets -n baanlomnow
kubectl apply -f k8s/secrets.yaml

# 3. Restart
kubectl rollout restart deployment/baanlomnow-app -n baanlomnow

# 4. Update LINE channel callback
# Set to: http://baanlomnow.com/api/auth/callback/line
```

**⚠️ สำหรับ Production:** รอ SSL certificate active แล้วใช้ HTTPS

