# 🔧 แก้ปัญหา Ingress 404 - Backend Not Found

## อาการ
```
404 - Backend Not Found
service rules for the path non-existent
```

## สาเหตุ
- Request ไปที่ IP โดยตรง แต่ Ingress มี `host: baanlomnow.com` rule
- Ingress ไม่รู้จัก request ที่ไม่มี host header ตรงกับ rule
- DNS ยังไม่ชี้ไปที่ ingress IP

## ✅ วิธีทดสอบ

### 1. ทดสอบด้วย Host Header (แนะนำ)

```bash
# ทดสอบด้วย curl พร้อม host header
curl -H "Host: baanlomnow.com" http://34.117.127.211/api/health

# หรือทดสอบด้วย browser และแก้ไข /etc/hosts
sudo nano /etc/hosts
# เพิ่มบรรทัด:
34.117.127.211 baanlomnow.com
```

### 2. ตรวจสอบ Ingress Configuration

```bash
# ดู ingress
kubectl get ingress -n baanlomnow

# ดูรายละเอียด
kubectl describe ingress baanlomnow-ingress -n baanlomnow

# ดู YAML
kubectl get ingress baanlomnow-ingress -n baanlomnow -o yaml
```

### 3. ตรวจสอบ Service และ Pods

```bash
# ดู services
kubectl get svc -n baanlomnow

# ดู pods
kubectl get pods -n baanlomnow

# ดู endpoints
kubectl get endpoints -n baanlomnow

# ทดสอบจากภายใน cluster
kubectl run curl-test --image=curlimages/curl:latest --rm -it --restart=Never -n baanlomnow -- curl http://baanlomnow-service/api/health
```

### 4. ตรวจสอบ Backend Health

```bash
# ดู backend health status
gcloud compute backend-services list --filter="name~baanlomnow"

# ดู health details
gcloud compute backend-services get-health BACKEND_NAME --global
```

## 🔧 วิธีแก้ไข

### Option 1: ใช้ Default Backend (แนะนำสำหรับ development)

เพิ่ม default backend ให้รับ request ทุก host:

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: baanlomnow-ingress
  namespace: baanlomnow
  annotations:
    kubernetes.io/ingress.class: "gce"
    kubernetes.io/ingress.global-static-ip-name: "baanlomnow-ip"
    networking.gke.io/managed-certificates: "baanlomnow-ssl-cert"
    kubernetes.io/ingress.allow-http: "true"
spec:
  defaultBackend:
    service:
      name: baanlomnow-service
      port:
        number: 80
  rules:
  - host: baanlomnow.com
    http:
      paths:
      - path: /*
        pathType: ImplementationSpecific
        backend:
          service:
            name: baanlomnow-service
            port:
              number: 80
  - host: www.baanlomnow.com
    http:
      paths:
      - path: /*
        pathType: ImplementationSpecific
        backend:
          service:
            name: baanlomnow-service
            port:
              number: 80
```

**ข้อดี:**
- รับ request ทั้งจาก domain และ IP
- ทดสอบได้ทันทีโดยไม่ต้องแก้ DNS
- รองรับทั้ง IP และ domain access

### Option 2: Setup DNS Records

```bash
# 1. เพิ่ม DNS A record
Name: @ หรือ baanlomnow.com
Type: A
Value: 34.117.127.211
TTL: 3600

# 2. เพิ่ม CNAME สำหรับ www (optional)
Name: www
Type: CNAME
Value: baanlomnow.com
TTL: 3600

# 3. รอ DNS propagate (อาจใช้เวลา 5-60 นาที)
dig baanlomnow.com
nslookup baanlomnow.com

# 4. ทดสอบ
curl http://baanlomnow.com/api/health
```

### Option 3: ลบ Host Rule (สำหรับ temporary access)

```yaml
# k8s/ingress.yaml
spec:
  rules:
  - http:  # ลบ host: baanlomnow.com
      paths:
      - path: /*
        pathType: ImplementationSpecific
        backend:
          service:
            name: baanlomnow-service
            port:
              number: 80
```

**ข้อเสีย:**
- ไม่สามารถใช้ SSL certificate ได้
- ไม่เหมาะสำหรับ production

## 🧪 Testing Checklist

- [ ] ทดสอบด้วย host header: `curl -H "Host: baanlomnow.com" http://IP/api/health`
- [ ] ทดสอบด้วย IP + /etc/hosts
- [ ] ตรวจสอบ pods running: `kubectl get pods -n baanlomnow`
- [ ] ตรวจสอบ service endpoints: `kubectl get endpoints -n baanlomnow`
- [ ] ตรวจสอบ backend health: `gcloud compute backend-services get-health ...`
- [ ] ทดสอบจากภายใน cluster
- [ ] Setup DNS records (production)
- [ ] ทดสอบด้วย domain name (production)

## 📊 Current Status

```bash
# Ingress IP
34.117.127.211

# Service
baanlomnow-service:80 -> targetPort:3000

# Pods
baanlomnow-app-f6c9d455f-5gw46: Running

# Backend Health
HEALTHY

# Testing
✅ curl -H "Host: baanlomnow.com" http://34.117.127.211/api/health
✅ Service works from inside cluster
✅ Application is running
```

## 🚀 Recommended Next Steps

1. **สำหรับ Development/Testing:**
   ```bash
   # เพิ่ม defaultBackend
   kubectl apply -f k8s/ingress.yaml
   
   # ทดสอบ
   curl http://34.117.127.211/api/health
   ```

2. **สำหรับ Production:**
   ```bash
   # Setup DNS
   # A record: @ -> 34.117.127.211
   
   # รอ DNS propagate
   # ทดสอบ
   curl http://baanlomnow.com/api/health
   ```

## 📚 Related Files

- `k8s/ingress.yaml` - Ingress configuration
- `k8s/service.yaml` - Service configuration
- `k8s/deployment.prod.yaml` - Application deployment
- `k8s/INGRESS_TROUBLESHOOTING.md` - Ingress troubleshooting
- `k8s/TROUBLESHOOTING.md` - General troubleshooting

## 💡 Quick Test Commands

```bash
# 1. Test with host header (works!)
curl -H "Host: baanlomnow.com" http://34.117.127.211/api/health

# 2. Test from inside cluster
kubectl run curl-test --image=curlimages/curl:latest --rm -it --restart=Never -n baanlomnow -- curl http://baanlomnow-service/api/health

# 3. Test directly on pod
kubectl exec baanlomnow-app-f6c9d455f-5gw46 -n baanlomnow -- curl http://localhost:3000/api/health

# 4. Test service
kubectl port-forward svc/baanlomnow-service 8080:80 -n baanlomnow
curl http://localhost:8080/api/health
```

