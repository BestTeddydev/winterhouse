# 🔧 Ingress Troubleshooting Guide

## ปัญหา: SSL Certificate Provisioning

### อาการ
```
error running load balancer syncing routine: loadbalancer ... does not exist: 
invalid configuration: both HTTP and HTTPS are disabled
```

### สาเหตุ
- Managed Certificate ยังอยู่ในสถานะ "Provisioning"
- Ingress ตั้งค่าให้ใช้ HTTPS แต่ certificate ยังไม่พร้อม
- `kubernetes.io/ingress.allow-http: "false"` บวกกับไม่มี TLS config ที่ valid

### วิธีแก้ไข

#### ✅ วิธีที่ 1: Allow HTTP ชั่วคราว (แนะนำ)

```yaml
# k8s/ingress.yaml
annotations:
  kubernetes.io/ingress.allow-http: "true"  # เปลี่ยนจาก false
```

**ข้อดี:**
- ทดสอบได้ทันทีผ่าน HTTP
- Certificate จะ provisioning พอพร้อมก็จะ auto-upgrade เป็น HTTPS

**ข้อเสีย:**
- ต้อง redirect HTTP → HTTPS ด้วยตนเอง (หรือใช้ cloudflare/etc)

#### วิธีที่ 2: รอ Certificate พร้อม

```bash
# ตรวจสอบสถานะ certificate
kubectl get managedcertificate -n baanlomnow

# ดูรายละเอียด
kubectl describe managedcertificate baanlomnow-ssl-cert -n baanlomnow

# รอจน Status เป็น "Active"
```

#### วิธีที่ 3: ใช้ Temporary SSL Certificate

```yaml
# สร้าง self-signed cert ชั่วคราว
apiVersion: v1
kind: Secret
metadata:
  name: temp-tls
  namespace: baanlomnow
type: kubernetes.io/tls
stringData:
  tls.crt: |
    # ต้องสร้างจริง
  tls.key: |
    # ต้องสร้างจริง
---
# ใช้ใน ingress
spec:
  tls:
  - hosts:
    - baanlomnow.com
    secretName: temp-tls
```

---

## 🔍 Checklist สำหรับ Managed Certificate

### Pre-deployment

- [ ] Domain name ชี้ไปยัง IP ที่ถูกต้อง
  ```bash
  # ตรวจสอบ
  nslookup baanlomnow.com
  dig baanlomnow.com
  ```
  
- [ ] DNS A record ชี้ไป GKE ingress IP
  ```bash
  # ค้นหา ingress IP
  kubectl get ingress -n baanlomnow
  ```

- [ ] Domain ownership verified
  - ต้องมีสิทธิ์จัดการ domain
  - DNS records ชี้ไปยัง Google Cloud IP

### Deployment

- [ ] สร้าง Managed Certificate ก่อน Ingress
  ```bash
  kubectl apply -f k8s/managed-certificate.yaml
  ```

- [ ] รอให้ Certificate status เป็น "Active"
  ```bash
  kubectl wait --for=condition=ready managedcertificate baanlomnow-ssl-cert -n baanlomnow
  ```

- [ ] Deploy Ingress พร้อม certificate
  ```bash
  kubectl apply -f k8s/ingress.yaml
  ```

### Post-deployment

- [ ] ตรวจสอบ Ingress
  ```bash
  kubectl get ingress -n baanlomnow
  kubectl describe ingress baanlomnow-ingress -n baanlomnow
  ```

- [ ] ตรวจสอบ Certificate
  ```bash
  kubectl get managedcertificate -n baanlomnow
  kubectl describe managedcertificate baanlomnow-ssl-cert -n baanlomnow
  ```

- [ ] ทดสอบ HTTPS
  ```bash
  curl -I https://baanlomnow.com
  curl -I http://baanlomnow.com  # ควร redirect to HTTPS
  ```

---

## 📊 Certificate Status

### Status Types

- **Provisioning**: Certificate กำลังถูกสร้าง (อาจใช้เวลา 10-60 นาที)
- **Active**: Certificate พร้อมใช้งานแล้ว
- **Failed**: Certificate สร้างไม่สำเร็จ (ตรวจสอบ DNS และ domain ownership)

### ตรวจสอบ Certificate

```bash
# ดู status
kubectl get managedcertificate -n baanlomnow

# ดูรายละเอียด
kubectl describe managedcertificate baanlomnow-ssl-cert -n baanlomnow

# ดู events
kubectl get events -n baanlomnow --field-selector involvedObject.name=baanlomnow-ssl-cert
```

---

## 🚨 Common Issues

### 1. Certificate Provisioning นาน

**สาเหตุ:**
- DNS records ยังไม่ propagate
- Domain ownership ไม่ถูกต้อง
- GKE managed certificate controller มีปัญหา

**แก้ไข:**
```bash
# ตรวจสอบ DNS
dig baanlomnow.com
nslookup baanlomnow.com

# ตรวจสอบ certificate status
kubectl describe managedcertificate baanlomnow-ssl-cert -n baanlomnow

# ลบและสร้างใหม่
kubectl delete managedcertificate baanlomnow-ssl-cert -n baanlomnow
kubectl apply -f k8s/managed-certificate.yaml
```

### 2. Ingress ไม่ได้ใช้ Certificate

**ตรวจสอบ:**
```bash
kubectl get ingress baanlomnow-ingress -n baanlomnow -o yaml | grep ssl-cert
```

**แก้ไข:**
- ตรวจสอบ annotation `networking.gke.io/managed-certificates`
- ตรวจสอบว่า certificate name ตรงกัน

### 3. Mixed Content Issues

**อาการ:** Chrome/Safari แสดง "Not Secure" หรือ warning

**แก้ไข:**
- ใช้ HTTPS ทุกที่ (backend, assets, API calls)
- ตั้งค่า `NEXT_PUBLIC_APP_URL=https://baanlomnow.com`

---

## 🔒 Security Best Practices

### 1. Enforce HTTPS

```yaml
annotations:
  ingress.kubernetes.io/force-ssl-redirect: "true"
  kubernetes.io/ingress.allow-http: "false"  # เมื่อ certificate active แล้ว
```

### 2. Use HSTS Headers

```yaml
annotations:
  ingress.kubernetes.io/ssl-redirect: "true"
```

### 3. Security Headers

เพิ่มใน nginx หรือ application:
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
```

---

## 🌐 DNS Configuration

### ตรวจสอบ DNS Records

```bash
# A record
dig baanlomnow.com A

# CNAME สำหรับ www
dig www.baanlomnow.com CNAME

# ตรวจสอบ propagation
dig @8.8.8.8 baanlomnow.com
```

### Setup DNS Records

**1. A Record**
```
Name: @ หรือ baanlomnow.com
Type: A
Value: 34.117.127.211 (GKE ingress IP)
TTL: 3600
```

**2. CNAME (ถ้าต้องการ www)**
```
Name: www
Type: CNAME
Value: baanlomnow.com
TTL: 3600
```

---

## 🔗 Related Files

- `k8s/ingress.yaml` - Ingress configuration
- `k8s/managed-certificate.yaml` - Managed certificate configuration
- `k8s/GKE_DEPLOYMENT_GUIDE.md` - Full deployment guide

---

## 📚 References

- [GKE Ingress Documentation](https://cloud.google.com/kubernetes-engine/docs/how-to/load-balance-ingress)
- [Managed Certificates](https://cloud.google.com/kubernetes-engine/docs/how-to/managed-certs)
- [DNS Configuration](https://cloud.google.com/dns/docs)

