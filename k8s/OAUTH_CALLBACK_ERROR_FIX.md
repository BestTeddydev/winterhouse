# 🔐 แก้ปัญหา OAuth Callback Error - invalid_client

## อาการ

```
error=OAuthCallback
Chrome Warning: Dangerous site
invalid_client (invalid client_secret)
```

## สาเหตุ

**จาก logs:**
```
[next-auth][error][OAUTH_CALLBACK_ERROR] invalid_client (invalid client_secret)
providerId: 'line'
```

**สาเหตุหลัก:**
1. ⚠️ **LINE Channel Secret ไม่ถูกต้อง** (invalid client_secret)
2. ⚠️ **LINE Channel ID ไม่ถูกต้อง**
3. ⚠️ **Credentials ไม่ match กับ LINE Developers Console**

## ✅ วิธีแก้ไข (Step by Step)

### Step 1: ตรวจสอบ LINE Credentials

```bash
# ดู credentials ใน cluster
kubectl get secret baanlomnow-secrets -n baanlomnow -o json | jq '{
  channel_id: .data.LINE_CHANNEL_ID | @base64d,
  channel_secret: .data.LINE_CHANNEL_SECRET | @base64d
}'
```

**Expected output:**
```json
{
  "channel_id": "2008285356",
  "channel_secret": "5256584c99ed6e1dc35341ec97c4f8f9"
}
```

### Step 2: ตรวจสอบ LINE Developers Console

1. **Login: https://developers.line.biz/console/**

2. **เลือก Channel ของคุณ**

3. **ไปที่ LINE Login tab**

4. **ตรวจสอบ Channel ID และ Channel Secret**

5. **Copy new credentials (ถ้าผิด)**

### Step 3: Update LINE Credentials

#### Option A: ใช้ LINE Channel Secret ที่ถูกต้อง

```bash
# 1. Get credentials จาก LINE Developers Console
# Channel ID: xxx
# Channel Secret: xxx

# 2. Encode to base64
echo -n "YOUR_CHANNEL_ID" | base64
echo -n "YOUR_CHANNEL_SECRET" | base64

# 3. Update secrets.yaml
```

**Edit `k8s/secrets.yaml`:**

```yaml
data:
  LINE_CHANNEL_ID: "BASE64_ENCODED_CHANNEL_ID"
  LINE_CHANNEL_SECRET: "BASE64_ENCODED_CHANNEL_SECRET"
  LINE_CHANNEL_ACCESS_TOKEN: "BASE64_ENCODED_ACCESS_TOKEN"
```

**Apply changes:**

```bash
kubectl delete secret baanlomnow-secrets -n baanlomnow
kubectl apply -f k8s/secrets.yaml
kubectl rollout restart deployment/baanlomnow-app -n baanlomnow
```

### Step 4: ตรวจสอบ Callback URL ใน LINE Channel

**Important:** Callback URL ต้องตรงกับ domain ที่ใช้งาน

**ตั้งค่าใน LINE Developers Console:**

1. ไปที่ LINE Login settings
2. **Callback URL:**
   ```
   https://baanlomnow.com/api/auth/callback/line
   ```
3. **สำหรับ development (ถ้าใช้ HTTP):**
   ```
   http://baanlomnow.com/api/auth/callback/line
   ```
4. **บันทึกการเปลี่ยนแปลง**

### Step 5: ตรวจสอบ NEXTAUTH_URL

```bash
# Check NEXTAUTH_URL
kubectl exec deployment/baanlomnow-app -n baanlomnow -- env | grep NEXTAUTH_URL
```

**Should be:**
```bash
NEXTAUTH_URL=https://baanlomnow.com
```

**Update ถ้าไม่ถูกต้อง:**

```yaml
# secrets.yaml
NEXTAUTH_URL: "https://baanlomnow.com"
NEXT_PUBLIC_APP_URL: "https://baanlomnow.com"
```

### Step 6: Restart และทดสอบ

```bash
# Restart deployment
kubectl rollout restart deployment/baanlomnow-app -n baanlomnow

# Wait for rollout
kubectl rollout status deployment/baanlomnow-app -n baanlomnow

# Check logs
kubectl logs -f deployment/baanlomnow-app -n baanlomnow
```

**ทดสอบ:**
```bash
# Test OAuth endpoint
curl https://baanlomnow.com/api/auth/providers

# Test callback
curl https://baanlomnow.com/api/auth/callback/line
```

## 🔍 Common Issues

### Issue 1: Invalid Client Secret

**Error:**
```
invalid_client (invalid client_secret)
```

**Fix:**
1. ลบ Channel Secret เก่าใน LINE Developers Console
2. สร้าง Channel Secret ใหม่
3. Update secrets.yaml และ apply
4. Restart deployment

### Issue 2: Callback URL ไม่ตรงกัน

**Error:**
```
OAuthCallbackError
```

**Fix:**
1. ตรวจสอบ Callback URL ใน LINE Developers Console
2. ต้องเป็น: `https://baanlomnow.com/api/auth/callback/line`
3. Update และบันทึก

### Issue 3: SSL Certificate Warning

**Error:**
```
Chrome Warning: Dangerous site
```

**Fix:**
1. ตรวจสอบ SSL certificate active แล้ว
   ```bash
   kubectl get managedcertificate -n baanlomnow
   ```

2. Test SSL connection
   ```bash
   openssl s_client -connect baanlomnow.com:443
   ```

3. ตรวจสอบ certificate validity
   ```bash
   curl -v https://baanlomnow.com 2>&1 | grep -i "verify\|certificate"
   ```

## 🧪 Testing

### 1. Test OAuth Provider

```bash
# Check if LINE provider is configured
curl https://baanlomnow.com/api/auth/providers

# Should return:
# { "line": { "id": "line", "name": "LINE", ... } }
```

### 2. Test Sign In Endpoint

```bash
# Test sign in endpoint
curl https://baanlomnow.com/api/auth/signin

# Should redirect to LINE login
```

### 3. Test from Browser

1. ไปที่: `https://baanlomnow.com/auth/signin`
2. Click "Sign in with LINE"
3. ควร redirect ไป LINE Login
4. หลังจาก login จะ redirect กลับมา
5. ควรเห็น user info ใน application

## 📋 Checklist

### LINE Channel Configuration
- [ ] Channel ID: Correct
- [ ] Channel Secret: Correct
- [ ] Callback URL: `https://baanlomnow.com/api/auth/callback/line`
- [ ] LINE Login: Enabled
- [ ] Scopes: profile, openid, email

### Application Configuration
- [ ] NEXTAUTH_URL: `https://baanlomnow.com`
- [ ] NEXT_PUBLIC_APP_URL: `https://baanlomnow.com`
- [ ] LINE_CHANNEL_ID: Set correctly
- [ ] LINE_CHANNEL_SECRET: Set correctly
- [ ] NEXTAUTH_SECRET: Set correctly

### Deployment
- [ ] SSL Certificate: Active
- [ ] Application: Running
- [ ] Secrets: Applied
- [ ] Deployment: Restarted

## 🚀 Quick Fix Commands

```bash
# 1. Check current credentials
kubectl get secret baanlomnow-secrets -n baanlomnow -o yaml

# 2. Update secrets.yaml with correct LINE credentials
nano k8s/secrets.yaml

# 3. Apply changes
kubectl delete secret baanlomnow-secrets -n baanlomnow
kubectl apply -f k8s/secrets.yaml

# 4. Restart
kubectl rollout restart deployment/baanlomnow-app -n baanlomnow

# 5. Check logs
kubectl logs -f deployment/baanlomnow-app -n baanlomnow

# 6. Test
curl https://baanlomnow.com/api/auth/providers
```

## 📚 Related Documentation

- [LINE Login Documentation](https://developers.line.biz/en/docs/line-login/integrate-line-login/)
- [NextAuth LINE Provider](https://next-auth.js.org/providers/line)
- [LINE_OAUTH_FIX.md](./LINE_OAUTH_FIX.md)
- [MANAGED_CERTIFICATE_TROUBLESHOOTING.md](./MANAGED_CERTIFICATE_TROUBLESHOOTING.md)

## ⚠️ Security Note

**Important:**
- LINE Channel Secret ต้องเก็บเป็นความลับ
- อย่า commit credentials ลง git
- ใช้ Kubernetes secrets
- Rotate credentials เป็นประจำ

**Current secret (from logs):**
```
LINE_CHANNEL_SECRET: 5256584c99ed6e1dc35341ec97c4f8f9
```

**⚠️ ถ้า secret นี้ถูกใช้แล้ว:**
1. สร้าง secret ใหม่ใน LINE Developers Console
2. Update secrets.yaml
3. Apply และ restart

