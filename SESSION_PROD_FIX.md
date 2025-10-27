# 🔧 Session Production Fix

## 🐛 ปัญหาบน Production

**อาการ:**
- ทำงานปกติบน local
- บน production ไม่สามารถเข้า /admin หรือ /bookings ได้
- โดนเด้งให้ล็อกอินใหม่ ทั้งที่ล็อกอินแล้ว

## 🔍 สาเหตุ

### 1. **MongoDB Adapter Conflict**
- ใช้ JWT strategy แต่ยังมี MongoDB adapter เปิดอยู่
- Adapter กับ JWT strategy ขัดแย้งกัน
- ทำให้ session บน production ไม่ทำงาน

### 2. **Token Expiry Missing**
- ไม่ได้ set `accessTokenExpires` ตอนสร้าง token
- Token หมดอายุทันที
- ทำให้ต้องล็อกอินใหม่อยู่เรื่อยๆ

### 3. **No Debug Logging**
- ไม่มี logging ชัดเจน
- ไม่สามารถ debug หาสาเหตุได้

## ✅ การแก้ไข

### 1. ปิด MongoDB Adapter

**ไฟล์:** `src/lib/auth.ts`

```typescript
// Before:
adapter: clientPromise ? MongoDBAdapter(clientPromise) : undefined,

// After:
// Note: Using JWT strategy, so we don't need the MongoDB adapter
// The adapter conflicts with JWT session strategy
// adapter: clientPromise ? MongoDBAdapter(clientPromise) : undefined,
```

**เหตุผล:**
- ใช้ JWT strategy แล้วไม่ต้องมี MongoDB adapter
- ป้องกัน conflict ระหว่าง adapter กับ JWT

### 2. เพิ่ม Token Expiry

**ไฟล์:** `src/lib/auth.ts` (Lines 69, 94-96)

```typescript
// Initial sign in - Set expiry
token.accessTokenExpires = Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days

// On subsequent requests - Set if missing
if (!token.accessTokenExpires) {
  token.accessTokenExpires = Date.now() + 30 * 24 * 60 * 60 * 1000
}
```

**เหตุผล:**
- Token จะมีอายุ 30 วัน
- ป้องกัน token หมดอายุก่อนเวลาอันควร

### 3. เพิ่ม Debug Logging

**ไฟล์:** `src/lib/auth.ts`

**JWT Callback:**
```typescript
console.log('🔐 JWT Callback - Token:', token?.id ? 'exists' : 'empty')
console.log('✅ Initial sign in - Setting token data')
console.log('📝 Token set:', { id: token.id, role: token.role, expires: ... })
console.log('🔑 Using existing token:', { id: token.id, role: token.role })
console.log('🔄 Fetched role from DB:', token.role)
console.log('⚠️ No valid token found')
```

**Session Callback:**
```typescript
console.log('🔐 Session Callback - Token exists:', !!token, 'Token ID:', token?.id)
console.log('✅ Session set:', { id: session.user.id, role: session.user.role, email: ... })
console.log('⚠️ Session callback - Missing session.user or token')
console.error('❌ Error in session callback:', error)
```

**เหตุผล:**
- ดูได้ว่าอะไรเกิดขึ้นใน auth flow
- Debug ง่ายขึ้น
- หาสาเหตุปัญหาได้เร็วขึ้น

### 4. ปรับปรุง Token Handling

**File:** `src/lib/auth.ts` (Lines 74-98)

**Key Changes:**
- Return existing token if it has `id`
- Fetch role from DB if missing
- Set expiry if missing
- Better error handling

## 📊 เปรียบเทียบ

### Before:
```typescript
// JWT Callback
async jwt({ token, user, account }) {
  if (account && user) {
    token.accessToken = account.access_token
    token.id = user.id
    // Missing: accessTokenExpires
    return token
  }
  
  // Check if expired
  if (Date.now() < (token.accessTokenExpires as number)) {
    return token
  }
  // Problem: accessTokenExpires might not exist
  return await refreshAccessToken(token)
}
```

### After:
```typescript
// JWT Callback
async jwt({ token, user, account }) {
  console.log('🔐 JWT Callback - Token:', token?.id ? 'exists' : 'empty')
  
  if (account && user) {
    // Set expiry
    token.accessTokenExpires = Date.now() + 30 * 24 * 60 * 60 * 1000
    console.log('📝 Token set')
    return token
  }
  
  // Return existing token
  if (token && token.id) {
    // Set expiry if missing
    if (!token.accessTokenExpires) {
      token.accessTokenExpires = Date.now() + 30 * 24 * 60 * 60 * 1000
    }
    return token
  }
  
  return token
}
```

## 🧪 Testing Checklist

### On Local:
1. ✅ Login with LINE
2. ✅ Visit /bookings - should work
3. ✅ Refresh page - session persists
4. ✅ Visit /admin - redirect to home (not admin role)

### On Production (After Deploy):
1. ⏳ Login with LINE
2. ⏳ Check browser console logs
3. ⏳ Check pod logs for debug output
4. ⏳ Visit /bookings - should work
5. ⏳ Refresh page - session persists
6. ⏳ Visit /admin - should require admin role

## 📝 Files Changed

1. **src/lib/auth.ts**
   - Commented out MongoDB adapter
   - Added token expiry
   - Added debug logging
   - Improved token handling

## 🚀 Deployment

**Next Steps:**
1. Build: `bash k8s/build-multi-arch.sh 1.0.5`
2. Deploy: `kubectl set image deployment/baanlomnow-app baanlomnow-app=...:1.0.5 -n baanlomnow`
3. Monitor logs: `kubectl logs -f deployment/baanlomnow-app -n baanlomnow`
4. Test login and check logs

## 🎯 Expected Behavior

After fixing:
- ✅ Login works on production
- ✅ Session persists across pages
- ✅ /bookings accessible after login
- ✅ /admin requires admin role
- ✅ Debug logs show auth flow clearly

## 💡 Key Takeaways

1. **Use JWT OR MongoDB adapter, not both**
2. **Always set token expiry** when creating tokens
3. **Debug logging is essential** for production issues
4. **Local vs Production** - always test in similar environments

