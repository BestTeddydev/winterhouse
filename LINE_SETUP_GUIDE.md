# 📱 LINE Login Setup Guide

คู่มือการตั้งค่า LINE Login สำหรับ Winterhouse

## 🚨 ปัญหาที่พบ: 503 Service Unavailable

Error นี้เกิดจาก LINE OAuth callback ไม่สามารถเชื่อมต่อกับ LINE servers ได้

## 🔧 วิธีแก้ไข

### 1. ตรวจสอบ LINE Channel Settings

#### ขั้นตอนที่ 1: เข้าสู่ LINE Developers Console
1. ไปที่ https://developers.line.biz/console/
2. Login ด้วยบัญชี LINE

#### ขั้นตอนที่ 2: ตรวจสอบ Channel
1. เลือก Provider ของคุณ
2. เลือก LINE Login Channel
3. ไปที่แท็บ **"LINE Login"**

#### ขั้นตอนที่ 3: ตั้งค่า Callback URL
**สำคัญมาก!** ต้องตั้งค่า Callback URL ให้ถูกต้อง:

```
http://localhost:3000/api/auth/callback/line
```

**สำหรับ Production:**
```
https://your-domain.com/api/auth/callback/line
```

#### ขั้นตอนที่ 4: เปิดใช้งาน Channel
1. ไปที่แท็บ **"Basic settings"**
2. ตรวจสอบว่า Channel status เป็น **"Published"**
3. ถ้าเป็น "Draft" ให้กด **"Publish"**

### 2. ตรวจสอบ Channel Credentials

#### ไปที่แท็บ "Basic settings":
- **Channel ID**: ควรเป็นตัวเลข (เช่น 2008285356)
- **Channel secret**: ควรเป็น string ยาวๆ

#### อัพเดท .env:
```env
LINE_CHANNEL_ID="2008285356"
LINE_CHANNEL_SECRET="b794253e01ee9be3281599ca5c09511d"
```

### 3. ทดสอบการเชื่อมต่อ

#### ตรวจสอบ LINE OAuth endpoint:
```bash
curl -I https://access.line.me/oauth2/v2.1/authorize
```

ควรได้ response:
```
HTTP/2 200
```

#### ตรวจสอบ OpenID Configuration:
```bash
curl https://access.line.me/.well-known/openid-configuration
```

### 4. ตรวจสอบ Network

#### ถ้าใช้ Corporate Network:
- อาจมี Firewall block LINE APIs
- ลองใช้ Mobile Hotspot หรือ VPN

#### ถ้าใช้ Docker:
- ตรวจสอบว่า container สามารถ access internet ได้
```bash
docker-compose exec app ping google.com
```

## 🛠️ Troubleshooting

### ปัญหา: Channel not published
**แก้ไข:**
1. ไปที่ LINE Developers Console
2. เลือก Channel
3. ไปที่ Basic settings
4. กด "Publish" ถ้า Channel ยังเป็น Draft

### ปัญหา: Wrong Callback URL
**แก้ไข:**
1. ไปที่ LINE Login settings
2. ตั้งค่า Callback URL: `http://localhost:3000/api/auth/callback/line`
3. กด "Update"

### ปัญหา: Invalid credentials
**แก้ไข:**
1. ตรวจสอบ Channel ID และ Secret ใน .env
2. ต้องตรงกับใน LINE Console
3. Restart app หลังจากแก้ไข .env

### ปัญหา: Network issues
**แก้ไข:**
```bash
# ตรวจสอบ internet connection
docker-compose exec app curl -I https://access.line.me

# ถ้าไม่ได้ ลองใช้ host network
# ใน docker-compose.yml เพิ่ม:
# network_mode: "host"
```

## 📋 Checklist

ก่อนทดสอบ LINE Login:

- [ ] LINE Channel เป็น "Published" status
- [ ] Callback URL ตั้งค่าถูกต้อง: `http://localhost:3000/api/auth/callback/line`
- [ ] Channel ID และ Secret ใน .env ถูกต้อง
- [ ] App restart หลังจากแก้ไข .env
- [ ] Network สามารถ access LINE APIs ได้
- [ ] ไม่มี Firewall block

## 🧪 ทดสอบ

### 1. ตรวจสอบ LINE OAuth URL
เปิด URL นี้ในเบราว์เซอร์:
```
https://access.line.me/oauth2/v2.1/authorize?client_id=YOUR_CHANNEL_ID&scope=profile%20openid%20email&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fcallback%2Fline&state=test
```

ควรเห็น LINE Login page

### 2. ทดสอบใน App
1. เปิด http://localhost:3000
2. คลิก "เข้าสู่ระบบ"
3. ควร redirect ไป LINE Login
4. Login สำเร็จควรกลับมาหน้าแรก

## 🔍 Debug Mode

เปิด debug mode ใน development:

```env
# ใน .env
NODE_ENV=development
```

จะเห็น detailed logs ใน console

## 📞 Support

ถ้ายังไม่ได้:

1. **ตรวจสอบ LINE Developers Console** - ดู Channel status
2. **ตรวจสอบ Network** - ลองใช้ mobile hotspot
3. **ตรวจสอบ .env** - ต้องตรงกับ LINE Console
4. **Restart App** - หลังจากแก้ไข .env

## 🌐 Production Setup

สำหรับ production:

1. **เปลี่ยน Callback URL** เป็น domain จริง
2. **ใช้ HTTPS** - LINE ต้องการ HTTPS สำหรับ production
3. **ตั้งค่า Domain verification** ใน LINE Console
4. **ใช้ Production Channel** - สร้าง Channel ใหม่สำหรับ production

---

**LINE Login ควรทำงานได้หลังจากแก้ไขแล้ว! 📱**
