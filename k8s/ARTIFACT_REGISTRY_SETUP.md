# Google Artifact Registry Setup Guide

This guide explains how to set up Google Artifact Registry for storing Docker images and deploying to Kubernetes.

## 📋 Prerequisites

- Google Cloud Project with billing enabled
- `gcloud` CLI installed and authenticated
- `kubectl` configured for your Kubernetes cluster
- Docker installed locally

## 🚀 Step 1: Create Artifact Registry Repository

```bash
# Set your project ID
export PROJECT_ID="project-14a6d9ab-7aaf-49a0-92d"
export REGION="asia-southeast1"
export REPOSITORY="baanlomnow-repository"

# Create the repository
gcloud artifacts repositories create ${REPOSITORY} \
  --repository-format=docker \
  --location=${REGION} \
  --description="Docker repository for Baanlomnow application" \
  --project=${PROJECT_ID}
```

## 🔐 Step 2: Create Service Account for Kubernetes

```bash
# Create service account
gcloud iam service-accounts create artifact-registry-sa \
  --display-name="Artifact Registry Service Account" \
  --project=${PROJECT_ID}

# Grant pull permissions
gcloud artifacts repositories add-iam-policy-binding ${REPOSITORY} \
  --location=${REGION} \
  --member="serviceAccount:artifact-registry-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.reader" \
  --project=${PROJECT_ID}

# Grant push permissions (for local dev)
gcloud artifacts repositories add-iam-policy-binding ${REPOSITORY} \
  --location=${REGION} \
  --member="serviceAccount:artifact-registry-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer" \
  --project=${PROJECT_ID}
```

## 🔑 Step 3: Create and Download Key

```bash
# Create key file
gcloud iam service-accounts keys create artifact-registry-key.json \
  --iam-account=artifact-registry-sa@${PROJECT_ID}.iam.gserviceaccount.com \
  --project=${PROJECT_ID}

# Create Kubernetes secret
kubectl create secret generic artifact-registry-json-key \
  --from-file=key.json=artifact-registry-key.json \
  --namespace=baanlomnow \
  --dry-run=client -o yaml | kubectl apply -f -

# Clean up local key file (optional, store securely)
rm artifact-registry-key.json
```

## 🏗️ Step 4: Build and Push Docker Image

### Option A: Using the Script

```bash
# Run the push script
./k8s/push-to-artifact-registry.sh
```

### Option B: Manual Steps

```bash
# Authenticate Docker with Artifact Registry
gcloud auth configure-docker asia-southeast1-docker.pkg.dev --quiet

# Build the image
docker build -t baanlomnow:1.0 .

# Tag the image
docker tag baanlomnow:1.0 asia-southeast1-docker.pkg.dev/project-14a6d9ab-7aaf-49a0-92d/baanlomnow-repository/baanlomnow:1.0

# Push the image
docker push asia-southeast1-docker.pkg.dev/project-14a6d9ab-7aaf-49a0-92d/baanlomnow-repository/baanlomnow:1.0
```

## 🚀 Step 5: Deploy to Kubernetes

```bash
# Apply the deployment
kubectl apply -f k8s/deployment.yaml

# Check rollout status
kubectl rollout status deployment/baanlomnow-app -n baanlomnow

# Verify pods are running
kubectl get pods -n baanlomnow
```

## 📝 Configuration Details

### Image Path

```
asia-southeast1-docker.pkg.dev/project-14a6d9ab-7aaf-49a0-92d/baanlomnow-repository/baanlomnow:1.0
```

**Components:**
- `asia-southeast1`: Region
- `docker.pkg.dev`: Artifact Registry domain
- `project-14a6d9ab-7aaf-49a0-92d`: Project ID
- `baanlomnow-repository`: Repository name
- `baanlomnow:1.0`: Image name and tag

### Deployment Updates

The deployment now uses:
```yaml
image: asia-southeast1-docker.pkg.dev/project-14a6d9ab-7aaf-49a0-92d/baanlomnow-repository/baanlomnow:1.0
imagePullSecrets:
  - name: artifact-registry-json-key
```

## 🔄 Update Image Workflow

### Development

```bash
# Build and push new version
docker build -t baanlomnow:1.1 .
docker tag baanlomnow:1.1 asia-southeast1-docker.pkg.dev/project-14a6d9ab-7aaf-49a0-92d/baanlomnow-repository/baanlomnow:1.1
docker push asia-southeast1-docker.pkg.dev/project-14a6d9ab-7aaf-49a0-92d/baanlomnow-repository/baanlomnow:1.1

# Update deployment
kubectl set image deployment/baanlomnow-app baanlomnow-app=asia-southeast1-docker.pkg.dev/project-14a6d9ab-7aaf-49a0-92d/baanlomnow-repository/baanlomnow:1.1 -n baanlomnow
```

### Using the Script

```bash
# Edit the script to change IMAGE_TAG if needed
vim k8s/push-to-artifact-registry.sh

# Run the script
./k8s/push-to-artifact-registry.sh

# Update deployment
kubectl apply -f k8s/deployment.yaml
```

## 🔍 Troubleshooting

### Authentication Issues

```bash
# Re-authenticate
gcloud auth configure-docker asia-southeast1-docker.pkg.dev --quiet

# Verify credentials
gcloud auth list
```

### Pull Errors in Kubernetes

```bash
# Check if secret exists
kubectl get secret artifact-registry-json-key -n baanlomnow

# Check pod events
kubectl describe pod <pod-name> -n baanlomnow

# Check logs
kubectl logs <pod-name> -n baanlomnow
```

### Permission Errors

```bash
# Verify service account permissions
gcloud artifacts repositories get-iam-policy ${REPOSITORY} \
  --location=${REGION} \
  --project=${PROJECT_ID}
```

## 🌐 Image Management

### List Images

```bash
gcloud artifacts docker images list \
  asia-southeast1-docker.pkg.dev/project-14a6d9ab-7aaf-49a0-92d/baanlomnow-repository \
  --project=${PROJECT_ID}
```

### Delete Old Images

```bash
gcloud artifacts docker images delete \
  asia-southeast1-docker.pkg.dev/project-14a6d9ab-7aaf-49a0-92d/baanlomnow-repository/baanlomnow:TAG \
  --delete-tags \
  --project=${PROJECT_ID}
```

## ✅ Benefits of Artifact Registry

1. **Better Performance**: Located in same region as GKE cluster
2. **Vulnerability Scanning**: Built-in security scanning
3. **IAM Integration**: Fine-grained access control
4. **Multi-Format Support**: Supports Docker, npm, Maven, etc.
5. **Cost Efficiency**: Pay only for what you use

## 🔐 Security Best Practices

1. Use Workload Identity for GKE (recommended)
2. Rotate service account keys regularly
3. Use least-privilege IAM roles
4. Enable vulnerability scanning
5. Keep images updated with security patches
