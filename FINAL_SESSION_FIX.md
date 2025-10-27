# 🔧 Final Session Fix - Critical Issues

## 🐛 ปัญหาที่พบ

Production logs แสดง: **"Has Token: false"**

## 🔍 สาเหตุหลัก

### 1. ❌ HTTPOnly Cookie ถูก Comment
**Critical Issue:**
```typescript
// httpOnly: true,  // ❌ WRONG! Commented out
```

**ทำไมถึงไม่ได้:**
- NextAuth ต้องการ `httpOnly: true` เพื่อความปลอดภัย
- Cookie จะไม่ถูก save เมื่อไม่มี `httpOnly: true`
- Browser จะไม่ส่ง cookie กลับมาให้ server

### 2. ❌ MongoDB Adapter Conflict
**Current State:**
```typescript
// adapter: clientPromise ? MongoDBAdapter(...) : undefined,
```

**ทำไมถึง conflict:**
- ใช้ JWT strategy แล้ว
- JWT strategy ไม่ใช้ adapter
- Adapter กับ JWT ขัดแย้งกัน

### 3. ⏰ Token Expiry Missing
**Issue:**
- Token ไม่มี expiry ตอนสร้างครั้งแรก
- Token หมดอายุทันที
- ต้องล็อกอินใหม่อยู่เรื่อย

## ✅ การแก้ไขสุดท้าย

### ไฟล์: `src/lib/auth.ts`

#### 1. ปิด MongoDB Adapter (Lines 32-33)
```typescript
// Disable adapter for JWT strategy - they conflict
// adapter: clientPromise ? MongoDBAdapter(clientPromise) : undefined,
```
✅ ปิด adapter เพื่อใช้ JWT บริสุทธิ์

#### 2. ตั้งค่า Cookie ให้ถูกต้อง (Lines 142-163)
```typescript
cookies: {
  sessionToken: {
    name: `next-auth.session-token`,
    options: {
      httpOnly: true,  // ✅ MUST BE TRUE
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',  // ✅ TRUE in prod
      maxAge: 30 * 24 * 60 * 60, // 30 days
    },
  },
  callbackUrl: {
    name: `next-auth.callback-url`,
    options: {
      httpOnly: true,  // ✅ MUST BE TRUE
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',  // ✅ TRUE in prod
      maxAge: 30 * 24 * 60 * 60, // 30 days
    },
  },
}
```

**จุดสำคัญ:**
- `httpOnly: true` - Cookie จะถูกเซ็ตได้
- `secure: true` (ใน production) - HTTPS only
- ต้องมี callbackUrl cookie ด้วย

#### 3. เพิ่ม Token Expiry (Lines 67, 86-88)
```typescript
// Initial sign in
token.accessTokenExpires = Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days

// Set expiry if missing (for existing tokens)
if (token && !token.accessTokenExpires) {
  token.accessTokenExpires = Date.now() + 30 * 24 * 60 * 60 * 1000
}
```

**เหตุผล:**
- Token จะมีอายุ 30 วัน
- ป้องกัน token หมดอายุเร็ว

#### 4. ปรับปรุง Token Handling (Lines 85-92)
```typescript
// Set expiry if missing
if (token && !token.accessTokenExpires) {
  token.accessTokenExpires = Date.now() + 30 * 24 * 60 * 60 * 1000
}

// Check expiry before return
if (token.accessTokenExpires && Date.now() < (token.accessTokenExpires as number)) {
  return token
}
```

**เหตุผล:**
- Handle token ที่มีอยู่แล้วแต่ไม่มี expiry
- Return token ถ้ายังไม่หมดอายุ

## 📋 Config ที่ต้องตรวจสอบ

### Environment Variables (Production)

1. **NEXTAUTH_SECRET** ✅ ต้องมีและต้อง secure
   ```bash
   kubectl get secret baanlomnow-secrets -n baanlomnow -o jsonpath='{.data.NEXTAUTH_SECRET}' | base64 -d
   ```

2. **NEXTAUTH_URL** ✅ ต้องชี้ไปที่ domain จริง
   - Production: `https://baanlomnow.com`
   - ตรวจใน configmap: `kubectl get configmap baanlomnow-config -n baanlomnow`

3. **LINE Credentials** ✅ ต้องถูกต้อง
   - LINE_CHANNEL_ID
   - LINE_CHANNEL_SECRET

## 🧪 การทดสอบ

### On Local (After Fix):
1. ✅ Login with LINE
2. ✅ Check cookies in DevTools
3. ✅ Token exists in middleware logs
4. ✅ Visit /bookings - should work
5. ✅ Visit /admin - redirect if not admin

### On Production (After Fix):
1. ⏳ Clear browser cache
2. ⏳ Login with LINE
3. ⏳ Check cookies in DevTools (Application tab)
4. ⏳ Check pod logs: `kubectl logs -f deployment/baanlomnow-app -n baanlomnow`
5. ⏳ Should see: "Has Token: true"
6. ⏳ Visit /bookings - should work
7. ⏳ Refresh page - session persists

## 🔍 Debug Steps

### Check Cookies:
1. Open DevTools → Application → Cookies
2. Should see: `next-auth.session-token`
3. Should have: `HttpOnly: true`, `Secure: true`, `SameSite: Lax`

### Check Pod Logs:
```bash
kubectl logs -f deployment/baanlomnow-app -n baanlomnow
```

Look for:
- "🔐 Middleware - Has Token: true"
- "🔐 JWT Callback - Token: exists"
- "✅ Session set"

### Check Environment:
```bash
kubectl exec deployment/baanlomnow-app -n baanlomnow -- env | grep NEXTAUTH
```

Should show:
- `NEXTAUTH_URL=https://baanlomnow.com`
- `NEXTAUTH_SECRET=...` (exists)

## 🎯 Expected Behavior After Fix

### Cookies:
```
next-auth.session-token:
  - HttpOnly: ✓
  - Secure: ✓
  - SameSite: Lax
  - Expires: 30 days
  - Path: /
```

### Logs:
```
🛡️ Middleware - Path: /bookings
🛡️ Middleware - Is Auth: true
🛡️ Middleware - Role: CUSTOMER
✅ Middleware passed, allowing request
```

### Functionality:
- ✅ Login works
- ✅ Session persists 30 days
- ✅ Can access /bookings
- ✅ Admin-only pages redirect non-admins
- ✅ No re-login required

## 🚀 Deployment

**Version:** 1.0.7

**Changes:**
1. MongoDB adapter: Commented out ✅
2. Cookies: httpOnly + secure enabled ✅
3. Token expiry: Set to 30 days ✅
4. Callback URL: Added cookie config ✅

**Commands:**
```bash
# Build
bash k8s/build-multi-arch.sh 1.0.7

# Deploy
kubectl set image deployment/baanlomnow-app \
  baanlomnow-app=asia-southeast1-docker.pkg.dev/project-14a6d9ab-7aaf-49a0-92d/baanlomnow-repository/baanlomnow:1.0.7 \
  -n baanlomnow

# Monitor
kubectl logs -f deployment/baanlomnow-app -n baanlomnow

# Check rollout
kubectl rollout status deployment/baanlomnow-app -n baanlomnow
```

## ⚠️ Critical Notes

### DO NOT:
- ❌ Comment out `httpOnly: true` - Session จะไม่ทำงาน
- ❌ Comment out `secure: true` - Cookies จะไม่ถูกเซ็ตใน HTTPS
- ❌ Enable MongoDB adapter with JWT strategy - จะ conflict

### MUST:
- ✅ Keep `httpOnly: true` - Required by NextAuth
- ✅ Keep `secure: true` in production - For HTTPS
- ✅ Disable adapter when using JWT strategy
- ✅ Set token expiry - Prevent infinite sessions

## 📝 Checklist Before Deploy

- [ ] httpOnly: true (not commented)
- [ ] secure: true (not commented, production only)
- [ ] MongoDB adapter: Commented out
- [ ] Token expiry: Set on initial sign in
- [ ] Callback cookie: Configured
- [ ] NEXTAUTH_SECRET: Set in secrets
- [ ] NEXTAUTH_URL: Set in configmap
- [ ] Test locally first

