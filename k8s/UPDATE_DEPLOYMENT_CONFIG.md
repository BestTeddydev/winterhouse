# 🔧 การอัปเดต Deployment Configuration บน Cloud

## 📋 สรุปการเปลี่ยนแปลง

### Resource Limits
- **Memory requests**: 128Mi → **256Mi**
- **Memory limits**: 384Mi → **768Mi** (เพิ่ม 2 เท่า)
- **CPU requests**: 50m → **100m**
- **CPU limits**: 200m → **500m**

### Health Check Probes

#### Liveness Probe
- **initialDelaySeconds**: 30 → **60** (ให้เวลา app start up)
- **periodSeconds**: 10 → **30** (ลดความถี่การตรวจ)
- **timeoutSeconds**: เพิ่ม **10**
- **failureThreshold**: เพิ่ม **3** (ต้อง fail 3 ครั้งก่อน restart)
- **successThreshold**: เพิ่ม **1**

#### Readiness Probe
- **initialDelaySeconds**: 5 → **30** (ให้เวลา app พร้อม)
- **periodSeconds**: 5 → **10** (ลดความถี่การตรวจ)
- **timeoutSeconds**: เพิ่ม **5**
- **failureThreshold**: เพิ่ม **3**
- **successThreshold**: เพิ่ม **1**

### Health Check Endpoint
- ปรับ `/api/health` ให้เร็วขึ้นโดยไม่เรียก DB ทุกครั้ง
- ใช้ `mongoose.connection.readyState` เพื่อตรวจสถานะ
- Quick ping พร้อม timeout 1 วินาที

## 🚀 วิธีอัปเดต

### วิธีที่ 1: ใช้สคริปต์ (แนะนำ)

```bash
cd k8s
./update-deployment-config.sh
```

### วิธีที่ 2: ใช้ kubectl โดยตรง

```bash
# Apply deployment configuration
kubectl apply -f k8s/deployment.prod.yaml

# ตรวจสอบ rollout status
kubectl rollout status deployment/baanlomnow-app -n baanlomnow

# ดู pod status
kubectl get pods -n baanlomnow -l app=baanlomnow,component=app
```

## 📊 ตรวจสอบผลลัพธ์

### ตรวจสอบ Deployment
```bash
kubectl get deployment baanlomnow-app -n baanlomnow
kubectl describe deployment baanlomnow-app -n baanlomnow
```

### ตรวจสอบ Pods
```bash
# ดู pod status
kubectl get pods -n baanlomnow -l app=baanlomnow,component=app

# ดู pod events
kubectl describe pod -n baanlomnow -l app=baanlomnow,component=app

# ดู logs
kubectl logs -n baanlomnow -l app=baanlomnow,component=app --tail=50 -f
```

### ตรวจสอบ Resource Usage
```bash
# ดู resource usage
kubectl top pods -n baanlomnow

# ดู resource configuration
kubectl describe deployment baanlomnow-app -n baanlomnow | grep -A 10 "Resources:"
```

## ✅ ผลลัพธ์ที่คาดหวัง

1. **Pods restart น้อยลง** - เนื่องจาก:
   - Resource limits เพิ่มขึ้น ลด OOM kills
   - Health checks ยืดหยุ่นขึ้น (ต้อง fail 3 ครั้งก่อน restart)
   - Health check endpoint เร็วขึ้น ลดโอกาส probe timeout

2. **Stability เพิ่มขึ้น** - เนื่องจาก:
   - Initial delay เพิ่มขึ้น ให้เวลา app start up
   - Period seconds เพิ่มขึ้น ลดความถี่การตรวจ
   - Failure threshold เพิ่มขึ้น ลด false positives

3. **Performance ดีขึ้น** - เนื่องจาก:
   - Memory limits เพิ่มขึ้น ลด memory pressure
   - CPU limits เพิ่มขึ้น ลด CPU throttling

## 🔍 Troubleshooting

### ถ้า Pods ยัง restart บ่อย

1. **ตรวจสอบ logs**:
   ```bash
   kubectl logs -n baanlomnow -l app=baanlomnow,component=app --tail=100
   ```

2. **ตรวจสอบ events**:
   ```bash
   kubectl get events -n baanlomnow --sort-by='.lastTimestamp' | tail -20
   ```

3. **ตรวจสอบ resource usage**:
   ```bash
   kubectl top pods -n baanlomnow
   ```

4. **ตรวจสอบ health check**:
   ```bash
   kubectl describe pod -n baanlomnow -l app=baanlomnow,component=app | grep -A 10 "Liveness\|Readiness"
   ```

### ถ้า Pods ไม่สามารถ start ได้

1. **ตรวจสอบ resource availability**:
   ```bash
   kubectl describe nodes | grep -A 5 "Allocated resources"
   ```

2. **ตรวจสอบ pod status**:
   ```bash
   kubectl get pods -n baanlomnow -o wide
   kubectl describe pod -n baanlomnow <pod-name>
   ```

## 📝 Notes

- การอัปเดตนี้จะทำให้ pods restart ใหม่ด้วย configuration ใหม่
- ควร monitor pods หลังอัปเดตเพื่อดูว่า stable หรือไม่
- ถ้ามีปัญหา สามารถ rollback ได้ด้วย:
  ```bash
  kubectl rollout undo deployment/baanlomnow-app -n baanlomnow
  ```

