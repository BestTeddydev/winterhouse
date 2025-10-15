# Tailwind CSS Fix

## ปัญหาที่แก้ไข
Tailwind CSS classes ไม่ทำงานใน components

## สาเหตุ
ใช้ syntax ของ Tailwind v4 (`@import "tailwindcss"`) ซึ่งไม่เข้ากันกับ config ปัจจุบัน

## การแก้ไข

### 1. เปลี่ยน globals.css

**Before:**
```css
@import "tailwindcss";
```

**After:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 2. ลบ .next cache
```bash
rm -rf .next
```

### 3. Restart dev server
```bash
npm run dev
```

## การตรวจสอบว่า Tailwind ทำงาน

### 1. ตรวจสอบ browser
- เปิด Developer Tools (F12)
- ดูที่ Elements tab
- ตรวจสอบว่า element มี CSS classes

### 2. ทดสอบ class พื้นฐาน
```html
<div className="bg-blue-500 text-white p-4">
  Test Tailwind
</div>
```

### 3. ตรวจสอบ build
```bash
npm run build
```

## Tailwind Configuration

### tailwind.config.ts
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          // ... more colors
        },
      },
    },
  },
  plugins: [],
}

export default config
```

### postcss.config.js
```javascript
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
```

### globals.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom styles */
:root {
  --foreground-rgb: 17, 24, 39;
}

@layer components {
  .card-title {
    color: #111827 !important;
    font-weight: 600;
  }
}
```

## Common Issues & Solutions

### ปัญหา: Classes ไม่ทำงาน
**Solution:**
1. ตรวจสอบ content paths ใน tailwind.config.ts
2. Clear .next cache: `rm -rf .next`
3. Restart dev server

### ปัญหา: Custom colors ไม่ทำงาน
**Solution:**
1. ตรวจสอบ theme.extend ใน config
2. ใช้ format: `bg-primary-600`
3. Restart dev server

### ปัญหา: @layer ไม่ทำงาน
**Solution:**
1. ใช้ @tailwind directives ก่อน
2. วาง @layer หลัง @tailwind
3. ตรวจสอบ syntax

### ปัญหา: Production build ไม่มี styles
**Solution:**
1. ตรวจสอบ content paths
2. Build ใหม่: `npm run build`
3. ตรวจสอบ output CSS file

## Best Practices

### 1. ใช้ Tailwind utilities
```tsx
// Good
<div className="flex items-center gap-2 p-4 bg-white rounded-lg">

// Avoid inline styles
<div style={{ display: 'flex', padding: '1rem' }}>
```

### 2. สร้าง custom components
```css
@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700;
  }
}
```

### 3. ใช้ responsive design
```tsx
<div className="w-full md:w-1/2 lg:w-1/3">
  Responsive width
</div>
```

### 4. ใช้ custom colors
```tsx
<div className="bg-primary-600 text-primary-50">
  Custom colors
</div>
```

## Debugging Tips

### 1. ตรวจสอบ generated CSS
```bash
# Build และดู output
npm run build

# ดู CSS file
cat .next/static/css/*.css | grep "bg-primary-600"
```

### 2. ใช้ Tailwind IntelliSense
Install extension:
- VS Code: "Tailwind CSS IntelliSense"
- Auto-completion และ preview colors

### 3. ตรวจสอบ console
```javascript
// เปิด console (F12)
// ดู warnings/errors
```

### 4. ทดสอบ class ง่ายๆ
```tsx
// ลองใช้ class พื้นฐาน
<div className="bg-red-500">Should be red</div>
```

## Performance Optimization

### 1. Purge unused CSS
Tailwind จะทำอัตโนมัติใน production:
```typescript
// tailwind.config.ts
content: [
  './app/**/*.{js,ts,jsx,tsx}',
  './components/**/*.{js,ts,jsx,tsx}',
]
```

### 2. ใช้ JIT mode (default ใน v3)
- Compile แค่ classes ที่ใช้
- Build เร็วขึ้น
- File size เล็กลง

### 3. Minify CSS
Next.js ทำอัตโนมัติใน production

## Migration Notes

### From Tailwind v4 to v3
```css
/* v4 */
@import "tailwindcss";

/* v3 */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Custom directives
```css
/* Old */
@import "tailwindcss/base";
@import "tailwindcss/components";
@import "tailwindcss/utilities";

/* New (v3) */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Resources

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Next.js + Tailwind](https://nextjs.org/docs/app/building-your-application/styling/tailwind-css)
- [Tailwind UI Components](https://tailwindui.com/)

## Checklist

เมื่อเจอปัญหา Tailwind:
- [ ] ตรวจสอบ @tailwind directives ใน globals.css
- [ ] ตรวจสอบ content paths ใน tailwind.config.ts
- [ ] Clear .next cache (`rm -rf .next`)
- [ ] Restart dev server
- [ ] ตรวจสอบ browser console
- [ ] ทดสอบ class พื้นฐาน (bg-red-500)
- [ ] ตรวจสอบ postcss.config.js
- [ ] Build และดู output
