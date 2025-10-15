# Tailwind CSS v4 Configuration

## ปัญหาและการแก้ไข

คุณใช้ **Tailwind CSS v4** ซึ่งมีวิธีการ config ที่แตกต่างจาก v3

## Configuration ที่ถูกต้องสำหรับ v4

### 1. globals.css (✅ ถูกต้องแล้ว)
```css
@import "tailwindcss";
```

### 2. tailwind.config.ts (✅ แก้ไขแล้ว)
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          // ... rest of colors
        },
      },
    },
  },
}

export default config
```

**สิ่งที่เปลี่ยนแปลง:**
- ❌ ลบ `content` (v4 auto-detect files)
- ❌ ลบ `plugins` (ถ้าไม่ใช้)
- ✅ เก็บแค่ `theme` configuration

### 3. postcss.config.js (✅ ถูกต้องแล้ว)
```javascript
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
```

## Tailwind v4 Features

### 1. Auto Content Detection
- ไม่ต้องระบุ `content` paths
- Auto-detect ไฟล์ `.js, .jsx, .ts, .tsx` ทั้งหมด
- Faster build times

### 2. Simplified Config
- Config สั้นลง
- ง่ายต่อการ maintain
- Better defaults

### 3. New Import Syntax
```css
/* v3 */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* v4 */
@import "tailwindcss";
```

## Custom Styles ใน v4

### Using @layer
```css
@import "tailwindcss";

@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-primary-600 text-white rounded-lg;
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}
```

### Custom Properties
```css
@theme {
  --color-primary-50: #f0f9ff;
  --color-primary-100: #e0f2fe;
  /* ... more colors */
}
```

## ขั้นตอนการแก้ไข

1. **แก้ไข tailwind.config.ts** ✅
   - ลบ `content`
   - ลบ `plugins` (ถ้าไม่ใช้)
   - เก็บแค่ `theme`

2. **ใช้ @import ใน globals.css** ✅
   ```css
   @import "tailwindcss";
   ```

3. **Clear cache**
   ```bash
   rm -rf .next node_modules/.cache
   ```

4. **Restart dev server**
   ```bash
   npm run dev
   ```

5. **Hard refresh browser**
   - Mac: `Cmd + Shift + R`
   - Windows: `Ctrl + Shift + R`

## Verification

### ทดสอบว่า Tailwind ทำงาน:

```tsx
// ลองใส่ใน component
<div className="bg-red-500 text-white p-4">
  Tailwind Working!
</div>

<div className="bg-primary-600 text-white p-4">
  Custom Color Working!
</div>
```

### ตรวจสอบใน DevTools:
1. เปิด F12
2. ดู Elements tab
3. เลือก element ที่มี Tailwind class
4. ดู Computed styles → ควรเห็น CSS properties

## Common Issues

### Issue: Classes ยังไม่ทำงาน
**Solutions:**
1. Clear browser cache หนักๆ:
   ```
   - Clear browsing data
   - Hard reload
   - ปิด/เปิด browser ใหม่
   ```

2. ตรวจสอบ dev server มี error หรือไม่:
   ```bash
   npm run dev
   # ดู console output
   ```

3. Rebuild:
   ```bash
   rm -rf .next node_modules/.cache
   npm run dev
   ```

### Issue: Custom colors ไม่ทำงาน
**Solution:**
```typescript
// ตรวจสอบ format ใน tailwind.config.ts
colors: {
  primary: {
    600: '#0369a1',  // ✅ ถูกต้อง
  }
}

// ใช้งาน
className="bg-primary-600"
```

### Issue: @layer ไม่ทำงาน
**Solution:**
```css
@import "tailwindcss";

/* ต้องอยู่หลัง @import */
@layer components {
  .custom-class {
    @apply ...;
  }
}
```

## Tailwind v4 vs v3

| Feature | v3 | v4 |
|---------|----|----|
| Import | `@tailwind base;` | `@import "tailwindcss";` |
| Content | Required | Auto-detect |
| Config | Verbose | Simplified |
| Build | Slower | Faster |
| File size | Larger | Smaller |

## Next Steps

หลังจากแก้ไขแล้ว:

1. **Stop dev server** (Ctrl+C)

2. **Clear all caches:**
   ```bash
   rm -rf .next
   rm -rf node_modules/.cache
   ```

3. **Start fresh:**
   ```bash
   npm run dev
   ```

4. **Open browser:**
   ```
   http://localhost:3000/admin/site-map
   ```

5. **Check console:**
   - ไม่ควรมี error
   - ควรเห็น styles ทำงาน

## Quick Test

สร้างไฟล์ test:
```tsx
// app/test-tailwind/page.tsx
export default function TestTailwind() {
  return (
    <div className="p-8 space-y-4">
      <div className="bg-red-500 text-white p-4 rounded">Red</div>
      <div className="bg-blue-500 text-white p-4 rounded">Blue</div>
      <div className="bg-primary-600 text-white p-4 rounded">Primary</div>
      <div className="bg-green-500 text-white p-4 rounded">Green</div>
    </div>
  )
}
```

เปิด: `http://localhost:3000/test-tailwind`

ถ้าเห็นสี = Tailwind ทำงาน ✅
ถ้าไม่เห็นสี = มีปัญหา ❌

## Support

หากยังไม่ทำงาน:
1. Screenshot หน้าจอและ console
2. Copy error messages
3. แจ้งปัญหาพร้อมรายละเอียด
