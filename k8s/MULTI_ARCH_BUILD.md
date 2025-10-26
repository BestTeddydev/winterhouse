# 🏗️ Multi-Architecture Docker Build Guide

คู่มือการสร้าง Docker image สำหรับหลาย architecture (AMD64 + ARM64)

## 📋 ทำไมต้องใช้ Multi-Arch?

- **AMD64** (x86_64): ใช้กับ server และ desktop ทั่วไป
- **ARM64**: ใช้กับ Mac M1/M2 และ ARM-based servers
- GKE support both architectures, ทำให้สามารถ deploy ได้บน node pool หลายแบบ

## 🚀 Quick Start

### Option 1: ใช้ Script (ง่ายที่สุด)

```bash
# ให้สิทธิ์ execute
chmod +x k8s/build-multi-arch.sh

# Build และ push
./k8s/build-multi-arch.sh
```

### Option 2: Manual Commands

```bash
# 1. Setup buildx
docker buildx create --name multiarch --use
docker buildx inspect --bootstrap

# 2. Authenticate
gcloud auth configure-docker asia-southeast1-docker.pkg.dev --quiet

# 3. Build and push
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --push \
  --tag asia-southeast1-docker.pkg.dev/project-14a6d9ab-7aaf-49a0-92d/baanlomnow-repository/baanlomnow:1.0 \
  --file Dockerfile \
  .
```

## 🔍 Verify Multi-Arch Build

```bash
# ดู image manifest
docker buildx imagetools inspect \
  asia-southeast1-docker.pkg.dev/project-14a6d9ab-7aaf-49a0-92d/baanlomnow-repository/baanlomnow:1.0

# หรือใช้ gcloud
gcloud artifacts docker images list \
  asia-southeast1-docker.pkg.dev/project-14a6d9ab-7aaf-49a0-92d/baanlomnow-repository/baanlomnow:1.0
```

## 📝 Prerequisites

### 1. ติดตั้ง Docker Buildx

**Mac (Docker Desktop):**
```bash
# Buildx มากับ Docker Desktop อยู่แล้ว
docker buildx version
```

**Linux:**
```bash
# ติดตั้ง buildx
mkdir -p ~/.docker/cli-plugins/
curl -Lo ~/.docker/cli-plugins/docker-buildx https://github.com/docker/buildx/releases/latest/download/buildx-v0.13.1.linux-amd64
chmod +x ~/.docker/cli-plugins/docker-buildx
```

### 2. Authenticate กับ Artifact Registry

```bash
gcloud auth configure-docker asia-southeast1-docker.pkg.dev --quiet
```

## 🎯 Build Options

### Build สำหรับ Architecture เดียว

#### AMD64 only (เหมาะสำหรับ server)
```bash
docker buildx build \
  --platform linux/amd64 \
  --push \
  --tag IMAGE_NAME:TAG \
  .
```

#### ARM64 only (เหมาะสำหรับ Mac M1/M2)
```bash
docker buildx build \
  --platform linux/arm64 \
  --push \
  --tag IMAGE_NAME:TAG \
  .
```

### Build Multi-Arch (แนะนำ)

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --push \
  --tag IMAGE_NAME:TAG \
  .
```

## 🔧 Advanced Options

### Build with Progress and Cache

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --push \
  --progress=plain \
  --cache-from type=registry,ref=IMAGE_NAME:cache \
  --cache-to type=registry,ref=IMAGE_NAME:cache \
  --tag IMAGE_NAME:TAG \
  .
```

### Build with Build Args

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --push \
  --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
  --build-arg VCS_REF=$(git rev-parse --short HEAD) \
  --tag IMAGE_NAME:TAG \
  .
```

## 📊 Expected Output

เมื่อ build สำเร็จคุณจะเห็น:

```
#1 [linux/amd64 internal] load build definition from Dockerfile
#2 [linux/amd64 internal] load metadata for docker.io/library/node:18-alpine
#3 [linux/arm64 internal] load build definition from Dockerfile
#4 [linux/arm64 internal] load metadata for docker.io/library/node:18-alpine
...

Exporting to image
 - exporting manifest
 - exporting manifest sha256:...
 - exporting manifest sha256:...
Exporting
 - ...
Exporting to registry
 * [type: registry] pushing tags
```

## 🔍 Troubleshooting

### ปัญหา: buildx not found

```bash
# ตรวจสอบว่า Docker Desktop มี buildx หรือไม่
docker buildx version

# ถ้าไม่มี ให้ update Docker Desktop
```

### ปัญหา: Cannot connect to Docker daemon

```bash
# เริ่มต้น Docker Desktop
# หรือ restart Docker
sudo systemctl restart docker
```

### ปัญหา: Build เฉพาะ local architecture

```bash
# ลบ builder เก่าและสร้างใหม่
docker buildx rm multiarch
docker buildx create --name multiarch --driver docker-container --use
docker buildx inspect --bootstrap
```

### ปัญหา: Build ใช้เวลานาน

- ใช้ cache layers
- Build เฉพาะ architecture ที่ต้องการ
- ใช้ GitHub Actions หรือ Cloud Build สำหรับ CI/CD

## 🌐 Deploy to Different Architecture Nodes

### Check Node Architecture

```bash
kubectl get nodes -o wide
```

### Taint Nodes by Architecture (ถ้าต้องการ)

```bash
# Taint ARM nodes
kubectl taint nodes ARM_NODE_NAME arch=arm64:NoSchedule

# Taint AMD nodes
kubectl taint nodes AMD_NODE_NAME arch=amd64:NoSchedule
```

### Deploy with Node Selector

```yaml
spec:
  template:
    spec:
      nodeSelector:
        kubernetes.io/arch: amd64  # หรือ arm64
```

## 🚀 CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Push
on:
  push:
    tags:
      - '*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to Artifact Registry
        uses: docker/login-action@v2
        with:
          registry: asia-southeast1-docker.pkg.dev
          username: oauth2accesstoken
          password: ${{ secrets.GCP_ACCESS_TOKEN }}
      
      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          platforms: linux/amd64,linux/arm64
          push: true
          tags: asia-southeast1-docker.pkg.dev/${{ secrets.GCP_PROJECT_ID }}/baanlomnow-repository/baanlomnow:${{ github.ref_name }}
```

### Google Cloud Build Example

```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'buildx'
      - 'build'
      - '--platform=linux/amd64,linux/arm64'
      - '--push'
      - '-t'
      - 'asia-southeast1-docker.pkg.dev/$PROJECT_ID/baanlomnow-repository/baanlomnow:$TAG_NAME'
      - '.'
```

## 📈 Size Optimization

### Image Size Comparison

- **Single arch**: ~267MB
- **Multi-arch manifest**: ~267MB per architecture
- Total registry space: ~534MB for both

### ลด Size ได้โดย

1. ใช้ Alpine Linux base image (ทำอยู่แล้ว)
2. Multi-stage build (ทำอยู่แล้ว)
3. ลบ dev dependencies
4. ใช้ `.dockerignore`

## ✅ Checklist

- [ ] ติดตั้ง Docker Buildx
- [ ] Authenticate กับ Artifact Registry
- [ ] Run build script หรือ manual build
- [ ] Verify multi-arch manifest
- [ ] Test deploy บน GKE
- [ ] Check node architecture
- [ ] Update deployment config

## 📚 Related Documentation

- [Docker Buildx Documentation](https://docs.docker.com/buildx/)
- [Artifact Registry Guide](./ARTIFACT_REGISTRY_SETUP.md)
- [GKE Quick Start](./GKE_QUICK_START.md)
- [Build & Deploy](./BUILD_AND_DEPLOY.md)

