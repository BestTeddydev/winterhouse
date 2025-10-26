# 🔧 Kubernetes Troubleshooting Guide

## ปัญหา: FailedScheduling

### อาการ
```
Events:
  Warning  FailedScheduling   0/2 nodes are available: 2 Insufficient cpu
```

### สาเหตุ
- CPU หรือ Memory ไม่พอสำหรับ schedule pod ใหม่

### วิธีแก้ไข

**1. ลด Resource Requests**
```yaml
resources:
  requests:
    memory: "128Mi"  # ลดจาก 256Mi
    cpu: "50m"       # ลดจาก 250m หรือ 100m
  limits:
    memory: "256Mi"  # ลดจาก 512Mi
    cpu: "200m"      # ลดจาก 500m
```

**2. ลดจำนวน Replicas**
```yaml
replicas: 1  # ลดจาก 3
```

**3. เพิ่ม Node ใน Cluster**
```bash
gcloud container clusters resize baanlomnow-cluster \
  --zone=asia-southeast1-a \
  --num-nodes=3
```

---

## ปัญหา: ErrImagePull / ImagePullBackOff

### อาการ
```
Events:
  Warning  FailedToRetrieveImagePullSecret  Unable to retrieve image pull secrets
  Error: ImagePullBackOff
```

### สาเหตุ
- Image ไม่อยู่ใน registry
- Image pull secret ไม่ถูกต้อง
- Permission ไม่พอ

### วิธีแก้ไข

**1. ตรวจสอบว่า Image มีอยู่จริง**
```bash
gcloud artifacts docker images list \
  asia-southeast1-docker.pkg.dev/project-14a6d9ab-7aaf-49a0-92d/baanlomnow-repository
```

**2. Push Image ใหม่**
```bash
docker build -t baanlomnow:1.0 .
docker tag baanlomnow:1.0 asia-southeast1-docker.pkg.dev/project-14a6d9ab-7aaf-49a0-92d/baanlomnow-repository/baanlomnow:1.0
docker push asia-southeast1-docker.pkg.dev/project-14a6d9ab-7aaf-49a0-92d/baanlomnow-repository/baanlomnow:1.0
```

**3. สร้าง Image Pull Secret**
```bash
kubectl create secret docker-registry artifact-registry-json-key \
  --docker-server=asia-southeast1-docker.pkg.dev \
  --docker-username=oauth2accesstoken \
  --docker-password="$(gcloud auth print-access-token)" \
  --namespace=baanlomnow
```

**4. เพิ่ม Permission ให้ Compute Engine Service Account**
```bash
gcloud projects add-iam-policy-binding project-14a6d9ab-7aaf-49a0-92d \
  --member="serviceAccount:810649295983-compute@developer.gserviceaccount.com" \
  --role="roles/artifactregistry.reader"
```

**5. Restart Pods**
```bash
kubectl delete deployment baanlomnow-app -n baanlomnow
kubectl apply -f k8s/deployment.prod.yaml
```

---

## ปัญหา: ContainerCreating หรือ Pending นาน

### ตรวจสอบ

```bash
# ดูเหตุผล
kubectl describe pod <pod-name> -n baanlomnow

# ดู events
kubectl get events -n baanlomnow --sort-by='.lastTimestamp'
```

### สาเหตุที่เป็นไปได้

1. **Insufficient Resources**
   - แก้: ลด resource requests หรือเพิ่ม node

2. **PVC ไม่สามารถ bind ได้**
   - แก้: ตรวจสอบ storage class และ PVC status

3. **Image Pull ใช้เวลานาน**
   - แก้: ใช้ image ที่มีขนาดเล็กลง หรือ cache layer

---

## ปัญหา: Pod Crashing / Restart Loop

### ตรวจสอบ

```bash
# ดู logs
kubectl logs <pod-name> -n baanlomnow

# ดู previous crashed container
kubectl logs <pod-name> -n baanlomnow --previous
```

### สาเหตุที่เป็นไปได้

1. **Application Error**
   - ตรวจสอบ application logs
   - ตรวจสอบว่า MongoDB พร้อมแล้วหรือยัง

2. **Configuration Error**
   - ตรวจสอบ environment variables
   - ตรวจสอบ secrets มีครบหรือไม่

3. **Health Check Fails**
   - ตรวจสอบ health endpoint `/api/health`
   - เพิ่ม `initialDelaySeconds` ถ้าต้องใช้เวลาเริ่มต้นนาน

---

## คำสั่งที่มีประโยชน์

### ดู Pod Status
```bash
kubectl get pods -n baanlomnow
kubectl get pods -n baanlomnow -o wide
```

### ดู Logs
```bash
# Current logs
kubectl logs <pod-name> -n baanlomnow

# Previous crashed container
kubectl logs <pod-name> -n baanlomnow --previous

# Follow logs
kubectl logs -f <pod-name> -n baanlomnow

# All pods
kubectl logs -f deployment/baanlomnow-app -n baanlomnow
```

### ดู Events
```bash
kubectl get events -n baanlomnow --sort-by='.lastTimestamp'
```

### Describe Resources
```bash
kubectl describe pod <pod-name> -n baanlomnow
kubectl describe deployment baanlomnow-app -n baanlomnow
kubectl describe node
```

### Debug Pod
```bash
# Execute shell in pod
kubectl exec -it <pod-name> -n baanlomnow -- /bin/sh

# View pod files
kubectl exec <pod-name> -n baanlomnow -- ls -la
```

### Restart Deployment
```bash
kubectl rollout restart deployment/baanlomnow-app -n baanlomnow
kubectl rollout status deployment/baanlomnow-app -n baanlomnow
```

### Scale Deployment
```bash
kubectl scale deployment baanlomnow-app --replicas=1 -n baanlomnow
```

---

## Checklist สำหรับ Deploy บน GKE

### Pre-deployment

- [ ] ติดตั้ง gcloud และ kubectl
- [ ] Login: `gcloud auth login`
- [ ] ตั้งค่า project: `gcloud config set project`
- [ ] สร้าง cluster: `gcloud container clusters create`
- [ ] Get credentials: `gcloud container clusters get-credentials`
- [ ] สร้าง Artifact Registry repository
- [ ] Push Docker image ไปยัง Artifact Registry
- [ ] สร้าง namespace: `kubectl create namespace baanlomnow`
- [ ] สร้าง secrets: `kubectl apply -f k8s/secrets.yaml`
- [ ] สร้าง configmap: `kubectl apply -f k8s/configmap.yaml`

### Deployment

- [ ] Deploy MongoDB: `kubectl apply -f k8s/mongodb-simple.yaml`
- [ ] รอ MongoDB ready: `kubectl wait --for=condition=ready pod -l app=mongodb`
- [ ] Deploy application: `kubectl apply -f k8s/deployment.prod.yaml`
- [ ] ตรวจสอบ pods: `kubectl get pods -n baanlomnow`

### Post-deployment

- [ ] ตรวจสอบ pods running: `kubectl get pods -n baanlomnow`
- [ ] ดู logs: `kubectl logs -f deployment/baanlomnow-app -n baanlomnow`
- [ ] ทดสอบ health endpoint
- [ ] ตรวจสอบ ingress (ถ้ามี)
- [ ] ทดสอบเข้าถึง application

---

## 🔗 เอกสารเพิ่มเติม

- [GKE Official Documentation](https://cloud.google.com/kubernetes-engine/docs)
- [Kubernetes Troubleshooting](https://kubernetes.io/docs/tasks/debug/)
- [Artifact Registry Guide](./ARTIFACT_REGISTRY_SETUP.md)
- [GKE Quick Start](./GKE_QUICK_START.md)

