# 🔒 แก้ปัญหา Managed Certificate: FailedNotVisible

## อาการ

```
Status: FailedNotVisible
Domain Status:
  Domain: baanlomnow.com
  Status: FailedNotVisible
```

## สาเหตุ

Managed Certificate จะมี status `FailedNotVisible` เมื่อ:
1. **DNS ไม่ชี้ไปที่ Ingress IP**: Domain ยังไม่ resolve ไปที่ IP ที่ถูกต้อง
2. **Nameservers ไม่ได้ update**: Domain registrar ยังไม่ได้เปลี่ยน nameservers
3. **DNS ยัง propagate**: ต้องรอให้ DNS propagate เสร็จก่อน
4. **HTTP Challenge ไม่ผ่าน**: Certificate manager ไม่สามารถเข้าถึง domain ได้

## 🔍 ตรวจสอบปัญหาทีละขั้นตอน

### Step 1: ตรวจสอบ DNS Resolution

```bash
# ตรวจสอบจากเครื่อง local
dig baanlomnow.com A

# ตรวจสอบจากหลาย DNS servers
dig @8.8.8.8 baanlomnow.com A
dig @1.1.1.1 baanlomnow.com A
```

**Expected result:**
```
baanlomnow.com.    300    IN    A    34.117.127.211
```

**Problem:** ถ้าไม่มี output หรือไม่ใช่ IP ที่ถูกต้อง แสดงว่า DNS ยังไม่ resolve

### Step 2: ตรวจสอบ Nameservers

```bash
# ตรวจสอบ nameservers ที่ใช้อยู่
dig NS baanlomnow.com

# หรือ
nslookup -type=NS baanlomnow.com
```

**Expected result:** ควรเป็น Google Cloud DNS nameservers:
```
ns-cloud-d1.googledomains.com
ns-cloud-d2.googledomains.com
ns-cloud-d3.googledomains.com
ns-cloud-d4.googledomains.com
```

**Problem:** ถ้า nameservers ไม่ถูกต้อง แสดงว่ายังไม่ได้ update ใน registrar

### Step 3: ตรวจสอบ DNS Propagation

```bash
# ใช้ online tools
# https://www.whatsmydns.net/#A/baanlomnow.com
# https://dnschecker.org/#A/baanlomnow.com

# หรือใช้ dig จากหลาย DNS servers
for ns in 8.8.8.8 1.1.1.1 208.67.222.222; do
  echo "Testing with $ns:"
  dig @$ns baanlomnow.com A +short
done
```

## ✅ วิธีแก้ไข

### Fix 1: Update Nameservers in Registrar (สำคัญที่สุด!)

**ขั้นตอน:**

1. **Login เข้า domain registrar**
   - Namecheap, GoDaddy, Cloudflare, ฯลฯ

2. **ไปที่ DNS/Nameserver settings**

3. **เปลี่ยน nameservers เป็น:**
   ```
   ns-cloud-d1.googledomains.com
   ns-cloud-d2.googledomains.com
   ns-cloud-d3.googledomains.com
   ns-cloud-d4.googledomains.com
   ```

4. **บันทึกการเปลี่ยนแปลง**

5. **รอ DNS propagation (5-60 นาที)**

6. **ตรวจสอบว่า nameservers ถูกเปลี่ยนแล้ว:**
   ```bash
   dig NS baanlomnow.com
   ```

### Fix 2: ตรวจสอบ DNS Records

```bash
# ตรวจสอบว่า A record ถูกต้อง
gcloud dns record-sets list --zone=baanlomnow-zone

# ควรเห็น:
# baanlomnow.com. A 34.117.127.211
```

### Fix 3: Force Certificate Refresh

```bash
# ลบ certificate เก่า
kubectl delete managedcertificate baanlomnow-ssl-cert -n baanlomnow

# รอสักครู่
sleep 10

# สร้างใหม่
kubectl apply -f k8s/managed-certificate.yaml

# ตรวจสอบ status
kubectl get managedcertificate -n baanlomnow -w
```

### Fix 4: ตรวจสอบว่า Application เข้าถึงได้

```bash
# ทดสอบว่า domain works
curl -H "Host: baanlomnow.com" http://34.117.127.211/api/health

# หรือให้ผู้ใช้เข้าถึงผ่าน domain จริง
curl http://baanlomnow.com/api/health
```

## 🎯 Checklist สำหรับ Certificate Provisioning

### Pre-Certificate Setup
- [ ] DNS records ถูกต้อง (A record ชี้ไป 34.117.127.211)
- [ ] Nameservers ถูกเปลี่ยนแปลงใน registrar
- [ ] DNS propagation เรียบร้อย (ตรวจสอบด้วย dig)
- [ ] Application เข้าถึงได้ผ่าน domain

### Certificate Provisioning
- [ ] Managed certificate มี status "Provisioning"
- [ ] ไม่มี status "FailedNotVisible" หรือ "Failed"
- [ ] รอ certificate provisioning (10-60 นาที)
- [ ] Certificate status เป็น "Active"

### Post-Certificate
- [ ] Ingress ใช้ certificate ได้
- [ ] HTTPS works: `curl https://baanlomnow.com/api/health`
- [ ] Browser ไม่แสดง warning
- [ ] Certificate expiration ตอนไหน (check ด้วย openssl)

## 🔧 Temporary Solution: ใช้ HTTP ชั่วคราว

ถ้าไม่สามารถ provision certificate ได้ตอนนี้:

```bash
# 1. Allow HTTP ใน ingress
kubectl edit ingress baanlomnow-ingress -n baanlomnow
# เปลี่ยน kubernetes.io/ingress.allow-http: "true"

# 2. ลบ managed-certificate annotation
# และ comment out managed-certificate resource

# 3. Deploy
kubectl apply -f k8s/ingress.yaml
```

**⚠️ ข้อควรระวัง:**
- HTTP ไม่ secure
- เฉพาะสำหรับ development/testing
- ใช้ SSL certificate สำหรับ production

## 🧪 Test Commands

### ตรวจสอบ DNS

```bash
# Test DNS resolution
dig baanlomnow.com A
dig www.baanlomnow.com A

# Test จากหลายที่
dig @8.8.8.8 baanlomnow.com A
dig @1.1.1.1 baanlomnow.com A

# Test with Google DNS
nslookup baanlomnow.com 8.8.8.8
```

### ตรวจสอบ Certificate

```bash
# ดู certificate status
kubectl get managedcertificate -n baanlomnow
kubectl describe managedcertificate baanlomnow-ssl-cert -n baanlomnow

# ดู events
kubectl get events -n baanlomnow --sort-by='.lastTimestamp'
```

### ทดสอบ Application

```bash
# ทดสอบด้วย IP และ host header
curl -H "Host: baanlomnow.com" http://34.117.127.211/api/health

# ทดสอบด้วย domain (ถ้า DNS resolve แล้ว)
curl http://baanlomnow.com/api/health

# ทดสอบ HTTPS (เมื่อ certificate ready)
curl https://baanlomnow.com/api/health
```

## 📊 Current Status

```
Certificate Status: Provisioning
Domain Status: FailedNotVisible

DNS Zone: ✓ Created
DNS Records: ✓ Created
Nameservers: ⚠️  Need to update in registrar
DNS Propagation: ⏳ In progress
Application: ✓ Running
Ingress: ✓ Configured
```

## 🚀 Recommended Next Steps

1. **Update Nameservers (สำคัญที่สุด!)**
   - เปลี่ยน nameservers ใน registrar เป็น Google Cloud DNS
   
2. **Wait for DNS Propagation**
   ```bash
   # ตรวจสอบจนกว่า DNS จะ resolve
   watch -n 30 'dig baanlomnow.com A +short'
   ```

3. **Force Certificate Refresh**
   ```bash
   kubectl delete managedcertificate baanlomnow-ssl-cert -n baanlomnow
   kubectl apply -f k8s/managed-certificate.yaml
   ```

4. **Monitor Certificate Status**
   ```bash
   kubectl get managedcertificate -n baanlomnow -w
   # รอจน status เป็น "Active"
   ```

5. **Test HTTPS**
   ```bash
   curl https://baanlomnow.com/api/health
   ```

## 📚 Related Documentation

- [DNS_SETUP.md](./DNS_SETUP.md) - DNS setup guide
- [INGRESS_TROUBLESHOOTING.md](./INGRESS_TROUBLESHOOTING.md) - Ingress troubleshooting
- [Google Cloud Managed Certificates](https://cloud.google.com/kubernetes-engine/docs/how-to/managed-certs)

## ⏱️ Expected Timeline

- **DNS Propagation**: 5-60 นาที (หลังจาก update nameservers)
- **Certificate Provisioning**: 10-60 นาที (หลังจาก DNS resolve)
- **Total**: ~15-120 นาที

## 🆘 Still Failed?

### ตรวจสอบเพิ่มเติม

```bash
# 1. ตรวจสอบ DNS records
gcloud dns record-sets list --zone=baanlomnow-zone

# 2. ตรวจสอบ Ingress configuration
kubectl get ingress baanlomnow-ingress -n baanlomnow -o yaml

# 3. ตรวจสอบ pods
kubectl get pods -n baanlomnow

# 4. ตรวจสอบ service
kubectl get svc -n baanlomnow
kubectl get endpoints -n baanlomnow

# 5. ดู logs
kubectl logs -n baanlomnow deployment/baanlomnow-app
```

### ถ้ายังไม่ได้ try this:

```bash
# ลบทุกอย่างและสร้างใหม่
kubectl delete managedcertificate baanlomnow-ssl-cert -n baanlomnow
kubectl delete ingress baanlomnow-ingress -n baanlomnow

# รอ 5 นาที
sleep 300

# สร้างใหม่
kubectl apply -f k8s/managed-certificate.yaml
kubectl apply -f k8s/ingress.yaml
```

