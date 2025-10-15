# Complete Tailwind v4 Setup Guide

## ✅ การตั้งค่าที่ถูกต้อง

### 1. tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0369a1',
          700: '#075985',
          800: '#0c4a6e',
          900: '#082f49',
        },
      },
    },
  },
  plugins: [],
}
```

### 2. postcss.config.mjs
```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
export default config;
```

### 3. app/globals.css
```css
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  
  /* Primary colors - กำหนดที่นี่ด้วยเพื่อความแน่ใจ */
  --color-primary-50: #f0f9ff;
  --color-primary-100: #e0f2fe;
  --color-primary-200: #bae6fd;
  --color-primary-300: #7dd3fc;
  --color-primary-400: #38bdf8;
  --color-primary-500: #0ea5e9;
  --color-primary-600: #0369a1;
  --color-primary-700: #075985;
  --color-primary-800: #0c4a6e;
  --color-primary-900: #082f49;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

body {
  background: var(--background);
  color: var(--foreground);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}

@layer components {
  h1, h2, h3, h4, h5, h6 {
    color: #111827;
    font-weight: 700;
  }
  
  p {
    color: #1f2937;
    line-height: 1.7;
  }
  
  button, .btn {
    font-weight: 600;
  }
}
```

## 🔥 ขั้นตอนแก้ไข (ทำตามลำดับ)

### Step 1: Stop Dev Server
```bash
# กด Ctrl+C ใน terminal ที่รัน npm run dev
```

### Step 2: Clear All Caches
```bash
rm -rf .next
rm -rf node_modules/.cache
```

### Step 3: Verify Config Files
ตรวจสอบว่าไฟล์ด้านบนถูกต้อง:
- ✅ tailwind.config.js - มี content และ colors
- ✅ postcss.config.mjs - มี @tailwindcss/postcss
- ✅ globals.css - มี @theme inline และ primary colors

### Step 4: Start Dev Server
```bash
npm run dev
```

### Step 5: Test
เปิด: `http://localhost:3000/test-tailwind`

ควรเห็น:
- ✅ พื้นหลังสีต่างๆ
- ✅ ปุ่มสีน้ำเงิน (primary)
- ✅ Grid layout
- ✅ Shadows และ rounded corners

### Step 6: Hard Refresh Browser
- Mac: `Cmd + Shift + R`
- Windows: `Ctrl + Shift + R`

## 🐛 Debug Steps

### ถ้ายังไม่ทำงาน:

1. **ตรวจสอบ console errors:**
```
เปิด DevTools (F12) → Console tab
ดู error messages
```

2. **ตรวจสอบว่า CSS ถูก generate:**
```
DevTools → Elements tab → เลือก element
ดู Computed styles
```

3. **ตรวจสอบ dev server output:**
```bash
# ดูใน terminal ว่ามี error หรือไม่
npm run dev
```

4. **ลอง build:**
```bash
npm run build
# ดู error messages
```

## 💡 Alternative: ใช้ Inline Styles ชั่วคราว

ถ้า Tailwind ยังไม่ทำงาน ใช้วิธีนี้ชั่วคราว:

```tsx
// ใน SiteMapEditor.tsx
<button
  type="button"
  onClick={() => setIsAddingHotspot(!isAddingHotspot)}
  className="px-4 py-2 rounded-lg flex items-center gap-2 font-semibold transition-colors"
  style={{
    backgroundColor: isAddingHotspot ? '#ef4444' : '#0369a1',
    color: 'white',
  }}
>
  {isAddingHotspot ? 'ยกเลิก' : 'เพิ่มอาคาร'}
</button>
```

## 🎨 Color Reference

### Primary Colors (ตอนนี้ควรใช้ได้)
```tsx
bg-primary-50   → #f0f9ff (อ่อนสุด)
bg-primary-100  → #e0f2fe
bg-primary-200  → #bae6fd
bg-primary-300  → #7dd3fc
bg-primary-400  → #38bdf8
bg-primary-500  → #0ea5e9
bg-primary-600  → #0369a1 (ใช้บ่อย - ปุ่มหลัก)
bg-primary-700  → #075985 (hover)
bg-primary-800  → #0c4a6e
bg-primary-900  → #082f49 (เข้มสุด)
```

### Usage Examples
```tsx
// ปุ่มหลัก
<button className="bg-primary-600 hover:bg-primary-700 text-white">

// Background อ่อน
<div className="bg-primary-50 text-primary-900">

// Border
<div className="border-2 border-primary-600">

// Text
<p className="text-primary-600">

// Gradient
<div className="bg-gradient-to-r from-primary-600 to-primary-700">
```

## 📦 Package Versions

ตรวจสอบว่ามี packages ที่ถูกต้อง:
```json
{
  "devDependencies": {
    "@tailwindcss/postcss": "^4.1.14",
    "tailwindcss": "^4.1.14",
    "postcss": "^8.5.6"
  }
}
```

## 🚀 Quick Commands

```bash
# 1. Stop server
Ctrl+C

# 2. Clean
rm -rf .next node_modules/.cache

# 3. Start
npm run dev

# 4. Test
open http://localhost:3000/test-tailwind
```

## ✅ Expected Results

หลัง restart คุณควรเห็น:

### ใน /test-tailwind:
- ✅ กล่องสีแดง
- ✅ กล่องสีน้ำเงิน
- ✅ กล่องสี primary (น้ำเงินเข้ม)
- ✅ ปุ่มสวยๆ
- ✅ Grid 3 คอลัมน์

### ใน /admin/site-map:
- ✅ ปุ่ม "เพิ่มอาคาร" สีน้ำเงิน
- ✅ ปุ่ม "เปลี่ยนรูปแผนผัง" สีเทา
- ✅ Cards และ layouts สวยงาม
- ✅ Hover effects

## 📞 Need Help?

หากยังมีปัญหา:
1. Screenshot หน้าจอ
2. Copy console errors
3. แจ้งว่าใช้งานหน้าไหน
4. บอกว่า restart server แล้วหรือยัง
