# Middleware Token Fix

## ปัญหาที่แก้ไข
- `req.nextauth.token` เป็น `null` ทั้งที่ล็อกอินแล้ว
- Middleware ไม่สามารถเข้าถึง token ได้

## สาเหตุของปัญหา
1. **Session Strategy**: ใช้ `database` strategy แต่ middleware ต้องการ `jwt` strategy
2. **Token Access**: Middleware ไม่สามารถเข้าถึง database session ได้
3. **Missing Secret**: ไม่มี `NEXTAUTH_SECRET` ใน environment variables

## การแก้ไขที่ทำ

### 1. เปลี่ยน Session Strategy เป็น JWT
```typescript
session: {
  strategy: 'jwt', // เปลี่ยนจาก 'database' เป็น 'jwt'
  maxAge: 30 * 24 * 60 * 60, // 30 days
  updateAge: 24 * 60 * 60, // 24 hours
},
```

### 2. ปรับปรุง Session Callback
```typescript
async session({ session, token }) { // เปลี่ยนจาก user เป็น token
  if (session.user && token) {
    session.user.id = token.id as string
    session.user.role = token.role as string || 'CUSTOMER'
    session.user.lineUserId = token.lineUserId as string
  }
  return session
},
```

### 3. ปรับปรุง JWT Callback
```typescript
async jwt({ token, user, account }) {
  // Initial sign in
  if (account && user) {
    token.accessToken = account.access_token
    token.id = user.id
    token.role = (user as any).role || 'CUSTOMER'
    token.lineUserId = (user as any).lineUserId
    return token
  }
  return token
},
```

### 4. ปรับปรุง SignIn Callback
```typescript
async signIn({ user, account, profile }) {
  if (account?.provider === 'line') {
    // Find or create user in database
    const existingUser = await User.findOneAndUpdate(
      { email: user.email },
      { 
        name: user?.name || '', 
        image: user?.image || '', 
        email: user?.email || '', 
        role: 'ADMIN',
        lineUserId: (profile as any)?.sub || user.id
      },
      { new: true, upsert: true }
    )
    
    // Update user object with database data
    user.id = existingUser._id.toString()
    user.role = existingUser.role
    user.lineUserId = existingUser.lineUserId
  }
  return true
},
```

### 5. เพิ่ม NEXTAUTH_SECRET
```typescript
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET, // เพิ่ม secret
  // ... other options
}
```

### 6. ปรับปรุง Middleware
```typescript
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token // ตอนนี้จะได้ token แล้ว
    const isAuth = !!token
    
    console.log('Middleware - Token:', token) // Debug log
    
    // ... rest of middleware logic
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow all routes and let middleware handle redirects
        return true
      },
    },
  }
)
```

## Environment Variables ที่จำเป็น

```env
NEXTAUTH_SECRET=your-secret-key-here-make-it-long-and-random
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=mongodb://localhost:27017/winterhouse
LINE_CHANNEL_ID=your-line-channel-id
LINE_CHANNEL_SECRET=your-line-channel-secret
```

## การทดสอบ

1. ล็อกอินด้วย LINE
2. เปิด Developer Tools และดู Console
3. ตรวจสอบว่า middleware ได้รับ token แล้ว
4. Refresh หน้าและตรวจสอบว่า session ยังคงอยู่
5. ไปที่หน้าแอดมินและตรวจสอบว่าไม่ต้องล็อกอินใหม่

## หมายเหตุ

- JWT strategy จะเก็บข้อมูลใน cookie แทน database
- Token จะมีข้อมูล user ที่จำเป็นสำหรับ middleware
- Session จะ persist ได้ดีขึ้น
- Middleware จะสามารถเข้าถึง token ได้แล้ว
