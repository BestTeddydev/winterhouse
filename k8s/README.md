# Kubernetes Deployment Guide

> 💡 **สำหรับผู้เริ่มต้น:** ดูคู่มือ [GKE_QUICK_START.md](./GKE_QUICK_START.md) สำหรับการ deploy บน Google Kubernetes Engine แบบละเอียด

## 📋 Prerequisites

- Kubernetes cluster (Docker Desktop, GKE, etc.)
- `kubectl` installed and configured
- Docker image built and pushed to registry

## 🏗️ Image Registry

### For Local Development (Docker Desktop)

The deployment uses local images. You can build and use the image locally:

```bash
# Build the image
docker build -t baanlomnow:1.0 .

# For local testing, use port-forward
kubectl port-forward service/baanlomnow-service 3000:80 -n baanlomnow
```

### For Production (Google Artifact Registry)

For production deployment on GKE, you need to:

1. **Push image to Artifact Registry:**
   ```bash
   # Run the push script
   ./k8s/push-to-artifact-registry.sh
   ```

2. **Set up image pull secret:**
   See `ARTIFACT_REGISTRY_SETUP.md` for detailed instructions

3. **Update deployment:**
   ```bash
   kubectl apply -f k8s/deployment.yaml
   ```

The deployment is configured to use:
```
asia-southeast1-docker.pkg.dev/project-14a6d9ab-7aaf-49a0-92d/baanlomnow-repository/baanlomnow:1.0
```

## 🚀 Quick Start

### 1. Create Namespace

```bash
kubectl create namespace baanlomnow
```

### 2. Set Up Secrets

**Important:** The `secrets.yaml` file contains sensitive information and should NOT be committed to git.

Use the template to create your secrets:

```bash
# Copy the template
cp k8s/secrets.yaml.template k8s/secrets.yaml

# Edit with your actual values
nano k8s/secrets.yaml

# Apply the secrets
kubectl apply -f k8s/secrets.yaml
```

### 3. Deploy MongoDB

```bash
kubectl apply -f k8s/mongodb-simple.yaml
```

Wait for MongoDB to be ready:

```bash
kubectl wait --for=condition=ready pod -l app=mongodb -n baanlomnow --timeout=120s
```

### 4. Deploy Application

```bash
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

### 5. Deploy Ingress (Optional)

For local development with Docker Desktop:

```bash
# Install NGINX Ingress Controller (if not already installed)
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml

# Apply ingress
kubectl apply -f k8s/ingress-local.yaml
```

Access your application at: **http://localhost**

## 📁 Files

## 📚 Documentation Files

- **[GKE_QUICK_START.md](./GKE_QUICK_START.md)** - คู่มือ deploy บน GKE แบบละเอียด (สำหรับผู้เริ่มต้น) ⭐
- **[ARTIFACT_REGISTRY_SETUP.md](./ARTIFACT_REGISTRY_SETUP.md)** - คู่มือการตั้งค่า Artifact Registry
- **[GKE_DEPLOYMENT_GUIDE.md](./GKE_DEPLOYMENT_GUIDE.md)** - คู่มือ deploy แบบ advanced
- **[MULTI_ARCH_BUILD.md](./MULTI_ARCH_BUILD.md)** - คู่มือการ build Docker image สำหรับหลาย architecture 🏗️
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - คู่มือแก้ไขปัญหา Kubernetes 🔧
- **[DEPLOY_FIX_SUMMARY.md](./DEPLOY_FIX_SUMMARY.md)** - สรุปปัญหา FailedScheduling และวิธีแก้ไข
- `secrets.yaml.template` - Template for secrets (copy to `secrets.yaml` and fill in your values)
- `deployment.yaml` - Application deployment (local development - uses local image)
- `deployment.prod.yaml` - Application deployment (production - uses Artifact Registry)
- `service.yaml` - Service configuration
- `mongodb-simple.yaml` - MongoDB deployment (without persistent storage)
- `mongodb.yaml` - MongoDB deployment (with persistent storage)
- `ingress-local.yaml` - Ingress configuration for local development
- `ingress.yaml` - Ingress configuration for production (GKE)
- `push-to-artifact-registry.sh` - Script to build and push Docker image to Artifact Registry

## 🔐 Secrets Configuration

The secrets file should include:

- **MongoDB**: Connection strings and root password
- **NextAuth**: Secret and URL
- **Stripe**: Payment gateway keys
- **Google Cloud**: Project ID and storage bucket
- **Resend**: Email API key
- **LINE**: Channel credentials

## 🌐 Access Methods

### Port Forwarding

```bash
kubectl port-forward service/baanlomnow-service 3000:80 -n baanlomnow
```

Access at: http://localhost:3000

### Ingress

After deploying ingress:

Access at: http://localhost

## 🔍 Troubleshooting

### Check Pod Status

```bash
kubectl get pods -n baanlomnow
```

### View Logs

```bash
kubectl logs -l app=baanlomnow -n baanlomnow
```

### Describe Pod

```bash
kubectl describe pod <pod-name> -n baanlomnow
```

### Check Ingress

```bash
kubectl get ingress -n baanlomnow
```

## 📝 Notes

- For production: Use `mongodb.yaml` with persistent storage
- For development: Use `mongodb-simple.yaml` without persistent storage
- Secrets are excluded from git (see `.gitignore`)

## 🎯 Summary of Changes

The Kubernetes deployment has been configured to use Google Artifact Registry:

- **Image Path**: `asia-southeast1-docker.pkg.dev/project-14a6d9ab-7aaf-49a0-92d/baanlomnow-repository/baanlomnow:1.0`
- **Script**: `push-to-artifact-registry.sh` for building and pushing images
- **Setup Guide**: `ARTIFACT_REGISTRY_SETUP.md` for detailed configuration
- **Local Development**: Works with Docker Desktop (no image pull secrets needed)
- **Production**: Requires image pull secrets setup (see setup guide)