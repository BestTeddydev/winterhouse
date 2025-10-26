# 🚀 คู่มือ Deploy บน Google Kubernetes Engine (GKE) - แบบง่าย

คู่มือนี้จะสอนให้คุณ deploy แอป Baanlomnow บน GKE แบบ step-by-step จาก 0

## 📋 สิ่งที่ต้องเตรียม

1. **Google Cloud Account** (มี billing enabled)
2. **Terminal** (Command Line)
3. **Docker** (ถ้ายังไม่มี)

## 🎯 ขั้นตอนการ Deploy (แบบละเอียด)

### Step 1: ติดตั้ง Tools ที่จำเป็น

#### 1.1 ติดตั้ง Google Cloud SDK

**สำหรับ Mac:**
```bash
# ติดตั้ง Homebrew (ถ้ายังไม่มี)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# ติดตั้ง Google Cloud SDK
brew install --cask google-cloud-sdk

# Restart terminal
```

**สำหรับ Linux:**
```bash
# ดาวน์โหลดและติดตั้ง
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

#### 1.2 Login เข้า Google Cloud

```bash
# Login
gcloud auth login

# เลือก browser และล็อกอิน
```

#### 1.3 ตั้งค่า Project

```bash
# ตั้งค่า project ID ของคุณ
gcloud config set project project-14a6d9ab-7aaf-49a0-92d

# เปิดใช้งาน APIs ที่จำเป็น
gcloud services enable container.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable compute.googleapis.com
```

### Step 2: สร้าง GKE Cluster

```bash
# สร้าง cluster พื้นฐาน (เหมาะสำหรับเริ่มต้น)
gcloud container clusters create baanlomnow-cluster \
  --zone=asia-southeast1-a \
  --num-nodes=2 \
  --machine-type=e2-medium \
  --disk-size=20GB

# รอประมาณ 5-10 นาที
```

**อธิบายคำสั่ง:**
- `baanlomnow-cluster` = ชื่อ cluster
- `asia-southeast1-a` = location (Singapore)
- `--num-nodes=2` = จำนวน node (2 nodes)
- `--machine-type=e2-medium` = ขนาดเครื่อง

#### เชื่อมต่อ kubectl กับ cluster

```bash
# ดึง credentials
gcloud container clusters get-credentials baanlomnow-cluster --zone=asia-southeast1-a

# ตรวจสอบว่าพร้อม
kubectl get nodes
```

### Step 3: สร้าง Artifact Registry Repository

```bash
# สร้าง repository สำหรับเก็บ Docker image
gcloud artifacts repositories create baanlomnow-repository \
  --repository-format=docker \
  --location=asia-southeast1 \
  --description="Docker repository for Baanlomnow app"

# แสดงผล (จด URL ไว้)
gcloud artifacts repositories describe baanlomnow-repository \
  --location=asia-southeast1
```

### Step 4: Build และ Push Docker Image

```bash
# Authenticate Docker กับ Artifact Registry
gcloud auth configure-docker asia-southeast1-docker.pkg.dev

# สร้าง namespace ใน Kubernetes
kubectl create namespace baanlomnow

# Build Docker image
docker build -t baanlomnow:1.0 .

# Tag image สำหรับ Artifact Registry
docker tag baanlomnow:1.0 asia-southeast1-docker.pkg.dev/project-14a6d9ab-7aaf-49a0-92d/baanlomnow-repository/baanlomnow:1.0

# Push ไปยัง Artifact Registry
docker push asia-southeast1-docker.pkg.dev/project-14a6d9ab-7aaf-49a0-92d/baanlomnow-repository/baanlomnow:1.0
```

### Step 5: สร้าง Kubernetes Secrets

```bash
# เข้าไปในโฟลเดอร์ k8s
cd k8s

# Copy template
cp secrets.yaml.template secrets.yaml

# แก้ไข secrets.yaml ด้วยข้อมูลจริงของคุณ
# ใช้ nano, vim, หรือ text editor อื่นๆ
nano secrets.yaml

# เมื่อแก้เสร็จแล้ว apply
kubectl apply -f secrets.yaml
```

**ตัวอย่าง `secrets.yaml` ที่ต้องแก้ไข:**
```yaml
stringData:
  # MongoDB - ใส่ค่า MongoDB connection string จริง
  MONGODB_URI: "your-mongodb-uri"
  DATABASE_URL: "your-database-url"
  MONGODB_ROOT_PASSWORD: "secure-password"
  
  # Stripe - ใส่ Stripe keys จริงจาก Stripe Dashboard
  STRIPE_SECRET_KEY: "sk_live_YOUR_REAL_KEY"
  STRIPE_PUBLIC_KEY: "pk_live_YOUR_REAL_KEY"
  STRIPE_WEBHOOK_SECRET: "whsec_YOUR_REAL_SECRET"
  
  # Resend - ใส่ API key จริงจาก Resend
  RESEND_API_KEY: "re_YOUR_REAL_KEY"
  
  # LINE - ใส่ LINE credentials จริง
  LINE_CHANNEL_ID: "YOUR_LINE_CHANNEL_ID"
  LINE_CHANNEL_SECRET: "YOUR_LINE_SECRET"
  LINE_CHANNEL_ACCESS_TOKEN: "YOUR_ACCESS_TOKEN"
  
  # อื่นๆ ตามที่ต้องการ
```

### Step 6: Deploy MongoDB

```bash
# Deploy MongoDB (แบบไม่มี persistent storage สำหรับเริ่มต้น)
kubectl apply -f mongodb-simple.yaml

# รอให้ MongoDB พร้อม
kubectl wait --for=condition=ready pod -l app=mongodb -n baanlomnow --timeout=120s

# ตรวจสอบ
kubectl get pods -n baanlomnow
```

### Step 7: Deploy Application

```bash
# Deploy application (ใช้ไฟล์ production)
kubectl apply -f deployment.prod.yaml
kubectl apply -f service.yaml

# ตรวจสอบสถานะ
kubectl get pods -n baanlomnow
kubectl rollout status deployment/baanlomnow-app -n baanlomnow
```

### Step 8: สร้าง Static IP และ Ingress

```bash
# สร้าง Static IP
gcloud compute addresses create baanlomnow-ip --global

# ดู IP ที่ได้
gcloud compute addresses describe baanlomnow-ip --global

# Deploy Ingress (แก้ไข domain ใน ingress.yaml ก่อน)
kubectl apply -f ingress.yaml

# ตรวจสอบ
kubectl get ingress -n baanlomnow
```

**แก้ไข `ingress.yaml` ก่อน:**
```yaml
spec:
  rules:
  - host: yourdomain.com  # เปลี่ยนเป็น domain ของคุณ
    http:
      paths:
      - path: /*
        pathType: ImplementationSpecific
```

## 📝 ทดสอบการ Deploy

### ดู Application Logs

```bash
# ดู logs ของ application
kubectl logs -f deployment/baanlomnow-app -n baanlomnow

# ดู logs ของ MongoDB
kubectl logs -f deployment/mongodb -n baanlomnow
```

### ดู Pods Status

```bash
# ดูสถานะ pods ทั้งหมด
kubectl get pods -n baanlomnow

# ดูรายละเอียดของ pod
kubectl describe pod <pod-name> -n baanlomnow
```

### ตรวจสอบ Services

```bash
# ดู services
kubectl get services -n baanlomnow

# ดู ingress
kubectl get ingress -n baanlomnow
```

## 🔧 แก้ปัญหาเบื้องต้น (Troubleshooting)

### ปัญหา: Pod สร้างไม่สำเร็จ

```bash
# ดูเหตุผล
kubectl describe pod <pod-name> -n baanlomnow

# ดู logs
kubectl logs <pod-name> -n baanlomnow
```

### ปัญหา: Image Pull Error

```bash
# ตรวจสอบว่า image push สำเร็จแล้ว
gcloud artifacts docker images list \
  asia-southeast1-docker.pkg.dev/project-14a6d9ab-7aaf-49a0-92d/baanlomnow-repository

# Authenticate ใหม่
gcloud auth configure-docker asia-southeast1-docker.pkg.dev
```

### ปัญหา: MongoDB ไม่เชื่อมต่อ

```bash
# ตรวจสอบ MongoDB pod
kubectl get pods -n baanlomnow -l app=mongodb

# ดู MongoDB logs
kubectl logs -f deployment/mongodb -n baanlomnow
```

### ปัญหา: Secrets ไม่ถูกต้อง

```bash
# ลบ secrets เก่า
kubectl delete secret baanlomnow-secrets -n baanlomnow

# สร้างใหม่
kubectl apply -f secrets.yaml

# Restart pods
kubectl rollout restart deployment/baanlomnow-app -n baanlomnow
```

## 💰 ตรวจสอบค่าใช้จ่าย

```bash
# ดูรายการ resources ที่สร้าง
gcloud container clusters describe baanlomnow-cluster --zone=asia-southeast1-a

# ดู pricing
gcloud pricing calculator
```

## 🎯 ขั้นตอนถัดไป

### 1. ตั้งค่า Auto-scaling

```bash
# ตั้งค่า Horizontal Pod Autoscaler
kubectl autoscale deployment baanlomnow-app \
  --cpu-percent=70 \
  --min=2 \
  --max=10 \
  -n baanlomnow
```

### 2. ตั้งค่า Monitoring

```bash
# ติดตั้ง Monitoring
gcloud services enable monitoring.googleapis.com
gcloud services enable logging.googleapis.com
```

### 3. ตั้งค่า Backup

```bash
# ใช้ Cloud SQL หรือ setup MongoDB backup
```

## 📚 คำสั่งที่มีประโยชน์

```bash
# ดูทุกอย่างใน namespace
kubectl get all -n baanlomnow

# ดู config
kubectl get configmap -n baanlomnow
kubectl get secrets -n baanlomnow

# Scale pods
kubectl scale deployment baanlomnow-app --replicas=3 -n baanlomnow

# Update image
kubectl set image deployment/baanlomnow-app \
  baanlomnow-app=asia-southeast1-docker.pkg.dev/project-14a6d9ab-7aaf-49a0-92d/baanlomnow-repository/baanlomnow:2.0 \
  -n baanlomnow

# Restart deployment
kubectl rollout restart deployment/baanlomnow-app -n baanlomnow
```

## 🆘 หากต้องการความช่วยเหลือ

1. **Debug Pod:**
```bash
kubectl describe pod <pod-name> -n baanlomnow
kubectl logs <pod-name> -n baanlomnow
```

2. **เข้าถึง Shell ใน Pod:**
```bash
kubectl exec -it <pod-name> -n baanlomnow -- /bin/sh
```

3. **ดู Events:**
```bash
kubectl get events -n baanlomnow --sort-by='.lastTimestamp'
```

## ✅ Checklist

- [ ] ติดตั้ง gcloud และ kubectl
- [ ] สร้าง GKE cluster
- [ ] สร้าง Artifact Registry repository
- [ ] Build และ push Docker image
- [ ] สร้างและ apply secrets.yaml
- [ ] Deploy MongoDB
- [ ] Deploy Application
- [ ] สร้าง Static IP และ Ingress
- [ ] ทดสอบ access จาก browser
- [ ] ติดตั้ง monitoring
- [ ] Setup backup
