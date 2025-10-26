# 🎯 สรุปปัญหาและการแก้ไข FailedScheduling

## ✅ ปัญหาที่แก้ไขแล้ว

### 1. ✅ FailedScheduling - Insufficient CPU
**อาการ:** `0/2 nodes are available: 2 Insufficient cpu`

**แก้ไข:**
- ลด CPU requests จาก 250m → 100m
- ลด replicas จาก 3 → 1
- ตอนนี้ schedule ได้แล้ว ✅

### 2. ⚠️ ErrImagePull - Image Pull Authentication
**อาการ:** `Error: ImagePullBackOff` - 403 Forbidden

**สถานะ:** กำลังแก้ไข

**สาเหตุ:**
- GKE cluster nodes ไม่มีสิทธิ์ดึง image จาก Artifact Registry
- Image pull secret ต้อง refresh ทุกครั้งที่ access token หมดอายุ

**วิธีแก้ไขที่ใช้:**

#### Option A: ใช้ public image ชั่วคราว (แนะนำสำหรับทดสอบ)

```bash
# 1. Push ไป Docker Hub แทน (public)
docker tag baanlomnow:1.0 your-dockerhub-username/baanlomnow:1.0
docker push your-dockerhub-username/baanlomnow:1.0

# 2. แก้ไข deployment.prod.yaml
image: your-dockerhub-username/baanlomnow:1.0

# 3. ลบ imagePullSecrets
# imagePullSecrets:
#   - name: artifact-registry-json-key
```

#### Option B: ใช้ Artifact Registry (ต้องแก้ authentication)

```bash
# 1. Update secret (ต้องทำซ้ำทุกครั้งที่ token หมดอายุ)
./k8s/update-secret.sh

# 2. Restart pods
kubectl delete deployment baanlomnow-app -n baanlomnow
kubectl apply -f k8s/deployment.prod.yaml
```

#### Option C: ใช้ Workload Identity (แนะนำสำหรับ production)

```bash
# 1. Enable Workload Identity
gcloud container clusters update baanlomnow-cluster \
  --zone=asia-southeast1-a \
  --workload-pool=project-14a6d9ab-7aaf-49a0-92d.svc.id.goog

# 2. Bind service account
kubectl annotate serviceaccount default \
  --namespace=baanlomnow \
  iam.gke.io/gcp-service-account=baanlomnow@project-14a6d9ab-7aaf-49a0-92d.iam.gserviceaccount.com

# 3. ลบ imagePullSecrets ออกจาก deployment
# ไม่ต้องระบุ imagePullSecrets เพราะใช้ Workload Identity

# 4. Apply deployment
kubectl apply -f k8s/deployment.prod.yaml
```

## 📋 สิ่งที่ต้องทำต่อ

### 1. เลือกวิธี authentication
- [ ] Option A: ใช้ Docker Hub (ง่ายที่สุด)
- [ ] Option B: ใช้ Artifact Registry + manual secret (ดีกว่า)
- [ ] Option C: ใช้ Workload Identity (ดีที่สุดสำหรับ production)

### 2. Configure Secrets
- [ ] Update secrets.yaml with real values
- [ ] Create secrets in cluster
- [ ] Verify MongoDB connection

### 3. Deploy Application
- [ ] Push image to registry
- [ ] Apply deployment
- [ ] Verify pods running

## 🚀 Recommended Next Steps

### สำหรับการ deploy อันแรก (ทดสอบเร็วที่สุด)

```bash
# 1. ใช้ Docker Hub ชั่วคราว
docker tag baanlomnow:1.0 yourusername/baanlomnow:1.0
docker push yourusername/baanlomnow:1.0

# 2. แก้ไข k8s/deployment.prod.yaml
# Comment out imagePullSecrets และเปลี่ยน image เป็น Docker Hub

# 3. Deploy
kubectl delete deployment baanlomnow-app -n baanlomnow
kubectl apply -f k8s/deployment.prod.yaml

# 4. Check
kubectl get pods -n baanlomnow
```

### สำหรับ Production (ใช้ Workload Identity)

```bash
# 1. Enable Workload Identity
gcloud container clusters update baanlomnow-cluster \
  --zone=asia-southeast1-a \
  --workload-pool=project-14a6d9ab-7aaf-49a0-92d.svc.id.goog

# 2. Configure SA binding
kubectl annotate serviceaccount default \
  --namespace=baanlomnow \
  iam.gke.io/gcp-service-account=baanlomnow@project-14a6d9ab-7aaf-49a0-92d.iam.gserviceaccount.com

# 3. Remove imagePullSecrets from deployment.prod.yaml
# Comment out the imagePullSecrets section

# 4. Apply
kubectl apply -f k8s/deployment.prod.yaml
```

## 📚 Resources

- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - แก้ปัญหาต่างๆ
- [ARTIFACT_REGISTRY_SETUP.md](./ARTIFACT_REGISTRY_SETUP.md) - Setup Artifact Registry
- [GKE_QUICK_START.md](./GKE_QUICK_START.md) - คู่มือ deploy แบบละเอียด

## ✅ Checklist

- [x] ติดตั้ง gke-gcloud-auth-plugin
- [x] ลด resource requests (แก้ FailedScheduling)
- [x] Build และ push Docker image
- [x] สร้าง namespace และ secrets
- [x] Deploy MongoDB
- [ ] แก้ไข image pull authentication (เลือกวิธีที่เหมาะ)
- [ ] Deploy application สำเร็จ
- [ ] ทดสอบ application

