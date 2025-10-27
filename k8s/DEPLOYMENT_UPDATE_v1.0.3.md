# 🚀 Deployment Update v1.0.3

## 📅 Date
2025-10-27

## 🎯 Changes Made

### 1. Navbar Enhancement - "จองห้องพัก" Button
**File:** `src/components/Navbar.tsx`

**Changes:**
- Made "จองห้องพัก" button more prominent with:
  - Primary blue background (`bg-primary-600`)
  - White text (`text-white`)
  - Rounded corners (`rounded-lg`)
  - Shadow effect (`shadow-md hover:shadow-lg`)
  - Larger padding (`px-6 py-2`)
  - Font weight (`font-semibold`)
- Applied same styling for both desktop and mobile views

**Visual Impact:**
- The "จองห้องพัก" button now stands out prominently in the navigation bar
- Clear visual hierarchy guiding users to booking functionality

### 2. User Role Default Change
**File:** `src/lib/auth.ts`

**Change:**
- Changed default user role from `'ADMIN'` to `'CUSTOMER'` when users log in via LINE
- Line 90: `role: 'CUSTOMER'` - Default to CUSTOMER role for new users

**Impact:**
- New LINE login users will now have CUSTOMER role by default
- Only users manually promoted to ADMIN in the database will have admin access

### 3. JWT Token Role Fix
**File:** `src/lib/auth.ts`

**Problem:**
- In production, `/admin` page required re-login even when already authenticated
- Issue was that role field wasn't properly populated in JWT token

**Solution:**
- Added automatic role fetching from database if role is missing in JWT token
- Lines 69-81: Fetch fresh user data from database if `token.role` is missing
- This ensures users maintain their role across sessions

**Code Added:**
```typescript
// On subsequent requests, fetch fresh user data from DB if role is missing
if (token && token.id && !token.role && DATABASE_URL) {
  try {
    await connectDB()
    const { default: User } = await import('@/models/User')
    const userFromDb = await User.findById(token.id)
    if (userFromDb) {
      token.role = userFromDb.role || 'CUSTOMER'
    }
  } catch (error) {
    console.error('Error fetching user role:', error)
  }
}
```

## 🔨 Build & Deploy

### Build Script Update
**File:** `k8s/build-multi-arch.sh`

**Change:**
- Updated to accept version as command-line argument
- Line 10: `IMAGE_TAG="${1:-1.0.1}"` - Accepts version parameter with fallback

**Usage:**
```bash
bash k8s/build-multi-arch.sh 1.0.3
```

### Deployment Steps
1. **Build multi-architecture image:**
   ```bash
   bash k8s/build-multi-arch.sh 1.0.3
   ```

2. **Update deployment:**
   ```bash
   kubectl set image deployment/baanlomnow-app \
     baanlomnow-app=asia-southeast1-docker.pkg.dev/project-14a6d9ab-7aaf-49a0-92d/baanlomnow-repository/baanlomnow:1.0.3 \
     -n baanlomnow
   ```

3. **Monitor rollout:**
   ```bash
   kubectl rollout status deployment/baanlomnow-app -n baanlomnow
   ```

## ✅ Deployment Status

**Image:** `asia-southeast1-docker.pkg.dev/project-14a6d9ab-7aaf-49a0-92d/baanlomnow-repository/baanlomnow:1.0.3`

**Build Time:** ~83 seconds

**Architectures:**
- AMD64 (linux/amd64)
- ARM64 (linux/arm64)

**Pod Status:**
```bash
NAME                             READY   STATUS    RESTARTS   AGE
baanlomnow-app-7848dcc6b-fqzqf   1/1     Running   0          24s
mongodb-554bf454b7-74kw9         1/1     Running   0          91m
```

## 🎯 Verification

### 1. Navbar Visual Check
- Navigate to the home page
- Verify "จองห้องพัก" button has blue background and stands out
- Check mobile menu - button should also have blue background

### 2. Login Test
- Log in with LINE
- Verify role is CUSTOMER by default
- Check if non-admin users can access `/admin` (should redirect to home)

### 3. Admin Access Test
- For existing ADMIN users, log in
- Navigate to `/admin`
- Should NOT require re-login (session should persist properly)

### 4. Role Persistence Test
- Log in as ADMIN
- Refresh `/admin` page multiple times
- Should maintain ADMIN role without re-authentication

## 📊 Performance

**Build Output:**
- Multi-architecture manifest created successfully
- Both AMD64 and ARM64 architectures built and pushed
- Total build and push time: ~83 seconds

**Application Health:**
```
✅ MongoDB is ready!
✅ MongoDB connection successful
✅ Database setup complete!
🌐 Starting Next.js server...
✓ Ready in 687ms
```

## 🔍 Troubleshooting

### If role is still not working in production:

1. **Check JWT token:**
   ```typescript
   // In browser console
   console.log(session)
   // Should show role field
   ```

2. **Check database:**
   ```bash
   kubectl exec deployment/mongodb -n baanlomnow -- mongosh
   use baanlomnow
   db.users.find({ email: "user@example.com" })
   ```

3. **Clear session and re-login:**
   - User may need to sign out and sign in again to refresh JWT token with new role data

### If navbar button not visible:

1. Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)
2. Clear browser cache
3. Check if Tailwind classes are applying correctly

## 📝 Notes

- Default user role changed to CUSTOMER for better security
- JWT token now properly maintains role information across sessions
- Navbar booking button is now more visually prominent
- Multi-architecture support ensures compatibility across platforms

## 🎉 Success

All changes have been successfully built, deployed, and are running in production!

