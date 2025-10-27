# 🌐 คู่มือ Setup DNS สำหรับ GKE Ingress

คู่มือการตั้งค่า DNS records สำหรับ GKE Ingress

## 📋 ข้อมูลที่จำเป็น

```
Ingress IP: 34.117.127.211
Domain: baanlomnow.com
```

## 🚀 วิธีตั้งค่าด้วย Google Cloud DNS

### Step 1: สร้าง DNS Zone (ถ้ายังไม่มี)

```bash
# สร้าง DNS Zone
gcloud dns managed-zones create baanlomnow-zone \
  --dns-name=baanlomnow.com \
  --description="DNS zone for baanlomnow.com" \
  --visibility=public

# ดู DNS nameservers
gcloud dns managed-zones describe baanlomnow-zone
```

### Step 2: Add A Record

```bash
# สร้าง transaction
gcloud dns record-sets transaction start --zone=baanlomnow-zone

# เพิ่ม A record สำหรับ root domain
gcloud dns record-sets transaction add 34.117.127.211 \
  --name=baanlomnow.com \
  --ttl=300 \
  --type=A \
  --zone=baanlomnow-zone

# เพิ่ม CNAME สำหรับ www
gcloud dns record-sets transaction add baanlomnow.com \
  --name=www.baanlomnow.com \
  --ttl=300 \
  --type=CNAME \
  --zone=baanlomnow-zone

# ส่ง transaction
gcloud dns record-sets transaction execute --zone=baanlomnow-zone
```

### Step 3: อัปเดต Nameservers ใน Registrar

```bash
# ดู nameservers
gcloud dns managed-zones describe baanlomnow-zone --format="value(nameServers)"

# Copy nameservers ทั้งหมด (NS records)
# แล้วไปตั้งค่าใน domain registrar ของคุณ
```

## 🔧 วิธีตั้งค่าด้วย Domain Registrar อื่น

### Option A: ใช้ Google Cloud DNS Nameservers

1. **ดู Google Cloud DNS Nameservers:**
   ```bash
   gcloud dns managed-zones describe baanlomnow-zone --format="value(nameServers)"
   ```

2. **ตั้งค่าใน Domain Registrar:**
   - Login เข้า registrar (Namecheap, GoDaddy, Cloudflare, etc.)
   - ไปที่ DNS Management / Nameservers
   - เปลี่ยน nameservers เป็น Google Cloud DNS:
     ```
     ns-cloud-a1.googledomains.com
     ns-cloud-a2.googledomains.com
     ns-cloud-a3.googledomains.com
     ns-cloud-a4.googledomains.com
     ```

### Option B: ใช้ Third-party Nameservers (เช่น Cloudflare)

1. **ตั้ง A Record:**
   ```
   Type: A
   Name: @ หรือ baanlomnow.com
   Content: 34.117.127.211
   TTL: Auto หรือ 3600
   Proxy: Disabled (สำหรับ SSL certificate provisioning)
   ```

2. **ตั้ง CNAME for www (optional):**
   ```
   Type: CNAME
   Name: www
   Content: baanlomnow.com
   TTL: Auto หรือ 3600
   Proxy: Disabled
   ```

## 📝 DNS Records ที่ต้องสร้าง

### สำหรับ baanlomnow.com

#### A Record (Required)
```
Type: A
Name: @ หรือ baanlomnow.com
Value: 34.117.127.211
TTL: 300
```

#### CNAME Record (Optional - สำหรับ www)
```
Type: CNAME
Name: www
Value: baanlomnow.com
TTL: 300
```

## 🔍 ตรวจสอบ DNS

### ตรวจสอบด้วย dig
```bash
# ตรวจสอบ A record
dig baanlomnow.com A

# ตรวจสอบ CNAME
dig www.baanlomnow.com CNAME

# ใช้ Google DNS
dig @8.8.8.8 baanlomnow.com A
```

### ตรวจสอบด้วย nslookup
```bash
nslookup baanlomnow.com
nslookup www.baanlomnow.com
```

### ตรวจสอบ DNS Propagation
```bash
# ตรวจสอบจากหลาย DNS servers
dig baanlomnow.com @8.8.8.8
dig baanlomnow.com @1.1.1.1
dig baanlomnow.com @208.67.222.222

# ใช้ online tool
# https://www.whatsmydns.net
# https://dnschecker.org
```

### ตรวจสอบจากภายใน Cluster
```bash
# ดู DNS record จาก pod
kubectl run dns-test --image=busybox:1.35 --rm -it --restart=Never -- nslookup baanlomnow.com
```

## ⏱️ DNS Propagation Timeline

- **Google Cloud DNS**: 1-2 นาที
- **Third-party DNS**: 5-60 นาที
- **Global propagation**: 1-24 ชั่วโมง

### รอและตรวจสอบ
```bash
# ตรวจสอบซ้ำๆ จนกว่าจะ resolve ได้
while true; do
  dig baanlomnow.com +short
  sleep 30
done
```

## 🧪 ทดสอบ Application

### ทดสอบด้วย Domain

```bash
# ทดสอบ health endpoint
curl http://baanlomnow.com/api/health

# ทดสอบ www subdomain
curl http://www.baanlomnow.com/api/health

# ทดสอบ root path
curl http://baanlomnow.com/

# ดู headers
curl -I http://baanlomnow.com
```

### ทดสอบใน Browser

1. เปิด browser
2. ไปที่ `http://baanlomnow.com`
3. ควรเห็น application ทันที

## 🔒 SSL Certificate

### ตรวจสอบ Certificate Status

```bash
# ดู status
kubectl get managedcertificate -n baanlomnow

# ดูรายละเอียด
kubectl describe managedcertificate baanlomnow-ssl-cert -n baanlomnow
```

### รอ Certificate Provisioning

Certificate จะ provisioning อัตโนมัติเมื่อ:
- ✅ DNS records ถูกต้อง
- ✅ Domain ชี้ไปที่ Ingress IP
- ✅ Ingress configuration ถูกต้อง
- ⏱️ ใช้เวลา 10-60 นาที

### Force Certificate Provision

```bash
# Restart ingress
kubectl delete ingress baanlomnow-ingress -n baanlomnow
kubectl apply -f k8s/ingress.yaml

# หรือ restart managed certificate
kubectl delete managedcertificate baanlomnow-ssl-cert -n baanlomnow
kubectl apply -f k8s/managed-certificate.yaml
```

## 🌐 ทดสอบ HTTPS

```bash
# ทดสอบ HTTPS (เมื่อ certificate ready แล้ว)
curl https://baanlomnow.com/api/health

# ทดสอบ SSL certificate
openssl s_client -connect baanlomnow.com:443 -servername baanlomnow.com

# ตรวจสอบ certificate expiration
echo | openssl s_client -servername baanlomnow.com -connect baanlomnow.com:443 2>/dev/null | openssl x509 -noout -dates
```

## 🔧 Troubleshooting

### DNS ไม่ resolve
```bash
# ตรวจสอบ nameservers
whois baanlomnow.com | grep "Name Server"

# ตรวจสอบ records
dig baanlomnow.com ANY

# ล้าง DNS cache
sudo dscacheutil -flushcache  # Mac
sudo systemd-resolve --flush-caches  # Linux
```

### Ingress ไม่ได้ routing
```bash
# ดู ingress status
kubectl get ingress -n baanlomnow

# ดู backend health
gcloud compute backend-services list --filter="name~baanlomnow"

# ดู logs
kubectl logs deployment/baanlomnow-app -n baanlomnow
```

### Certificate ไม่ provision
```bash
# ตรวจสอบ DNS
dig baanlomnow.com A

# ตรวจสอบ certificate status
kubectl describe managedcertificate baanlomnow-ssl-cert -n baanlomnow

# ลบและสร้างใหม่
kubectl delete managedcertificate baanlomnow-ssl-cert -n baanlomnow
kubectl apply -f k8s/managed-certificate.yaml
```

## 📚 Related Documentation

- [Google Cloud DNS Documentation](https://cloud.google.com/dns/docs)
- [GKE Ingress](https://cloud.google.com/kubernetes-engine/docs/how-to/load-balance-ingress)
- [Managed Certificates](https://cloud.google.com/kubernetes-engine/docs/how-to/managed-certs)

## ✅ Checklist

### Pre-DNS Setup
- [ ] Ingress IP: 34.117.127.211
- [ ] Ingress deployed และ running
- [ ] Backend health: HEALTHY
- [ ] Application running: ตรวจสอบ pods

### DNS Configuration
- [ ] สร้าง A record ชี้ไป 34.117.127.211
- [ ] สร้าง CNAME for www (optional)
- [ ] ตั้ง nameservers ให้ถูกต้อง

### Verification
- [ ] DNS resolves: `dig baanlomnow.com A`
- [ ] HTTP works: `curl http://baanlomnow.com/api/health`
- [ ] Application accessible: เปิด browser
- [ ] SSL certificate provisioning

### Post-DNS Setup
- [ ] Certificate status: Active
- [ ] HTTPS works: `curl https://baanlomnow.com/api/health`
- [ ] Browser shows secure connection
- [ ] www subdomain works (if configured)

