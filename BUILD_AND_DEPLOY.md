# 🚀 Build & Deploy Guide

คู่มือสั้นๆ สำหรับ build และ deploy แอป Baanlomnow

## 📋 Quick Start

### Option 1: ใช้ Script (แนะนำ)

```bash
# ไปที่โฟลเดอร์ k8s
cd k8s

# รัน deploy script
./deploy.sh

# เลือก target:
# 1) Local (Docker Desktop)
# 2) GKE (Artifact Registry)
```

### Option 2: Manual Commands

#### สำหรับ Local Development

```bash
# 1. Build image
docker build -t baanlomnow:1.0 .

# 2. Deploy to local Kubernetes
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

# 3. Check status
kubectl get pods -n baanlomnow

# 4. Access via port-forward
kubectl port-forward service/baanlomnow-service 3000:80 -n baanlomnow
# แล้วเข้า http://localhost:3000
```

#### สำหรับ Production (GKE)

```bash
# 1. Build image
docker build -t baanlomnow:1.0 .

# 2. Tag for Artifact Registry
docker tag baanlomnow:1.0 asia-southeast1-docker.pkg.dev/project-14a6d9ab-7aaf-49a0-92d/baanlomnow-repository/baanlomnow:1.0

# 3. Authenticate
gcloud auth configure-docker asia-southeast1-docker.pkg.dev --quiet

# 4. Push to Artifact Registry
docker push asia-southeast1-docker.pkg.dev/project-14a6d9ab-7aaf-49a0-92d/baanlomnow-repository/baanlomnow:1.0

# 5. Deploy to GKE
kubectl apply -f k8s/deployment.prod.yaml
kubectl rollout status deployment/baanlomnow-app -n baanlomnow
```

## 🔧 Docker Build Process

### What the Dockerfile does:

1. **Dependencies Stage**: ติดตั้ง npm packages ทั้งหมด
2. **Builder Stage**: Build Next.js application
3. **Runner Stage**: สร้าง final image ที่เล็กที่สุด

### Build Steps:

```
┌─────────────────┐
│  Dependencies   │  ← npm ci (install packages)
└────────┬────────┘
         │
┌────────▼────────┐
│    Builder      │  ← npm run build (build Next.js)
└────────┬────────┘
         │
┌────────▼────────┐
│     Runner      │  ← Copy only necessary files
└─────────────────┘
```

## 📝 Pre-requisites

### สำหรับ Local Development:
- [x] Docker Desktop installed
- [x] kubectl configured for local cluster
- [x] MongoDB deployed in Kubernetes

### สำหรับ Production (GKE):
- [x] Google Cloud account with billing
- [x] gcloud CLI installed
- [x] kubectl configured for GKE cluster
- [x] Artifact Registry repository created
- [x] Secrets configured in Kubernetes

## 🎯 Deployment Checklists

### Pre-deployment

- [ ] ตรวจสอบว่ามี MongoDB ใน cluster
- [ ] ตรวจสอบว่า secrets.yaml ถูกต้อง
- [ ] ตรวจสอบว่า Docker image build สำเร็จ

### Post-deployment

- [ ] ตรวจสอบ pod status: `kubectl get pods -n baanlomnow`
- [ ] ตรวจสอบ logs: `kubectl logs -f deployment/baanlomnow-app -n baanlomnow`
- [ ] ทดสอบ health endpoint: `kubectl port-forward service/baanlomnow-service 3000:80 -n baanlomnow`
- [ ] ทดสอบเข้า application: `curl http://localhost:3000`

## 🔍 Troubleshooting

### Docker Build Fails

```bash
# Clear build cache
docker builder prune

# Build without cache
docker build --no-cache -t baanlomnow:1.0 .
```

### Image Push Fails

```bash
# Authenticate again
gcloud auth configure-docker asia-southeast1-docker.pkg.dev --quiet

# Check permissions
gcloud auth list
```

### Pod Not Starting

```bash
# Check pod events
kubectl describe pod <pod-name> -n baanlomnow

# Check logs
kubectl logs <pod-name> -n baanlomnow

# Check if MongoDB is ready
kubectl get pods -n baanlomnow -l app=mongodb
```

## 📚 Related Documentation

- [k8s/README.md](./k8s/README.md) - Kubernetes deployment guide
- [k8s/GKE_QUICK_START.md](./k8s/GKE_QUICK_START.md) - GKE deployment guide
- [k8s/ARTIFACT_REGISTRY_SETUP.md](./k8s/ARTIFACT_REGISTRY_SETUP.md) - Artifact Registry setup

## 🆘 Quick Help

```bash
# View all pods
kubectl get pods -n baanlomnow

# View all services
kubectl get svc -n baanlomnow

# View ingress
kubectl get ingress -n baanlomnow

# View logs
kubectl logs -f deployment/baanlomnow-app -n baanlomnow

# Restart deployment
kubectl rollout restart deployment/baanlomnow-app -n baanlomnow

# Delete and redeploy
kubectl delete deployment baanlomnow-app -n baanlomnow
kubectl apply -f k8s/deployment.yaml
```
