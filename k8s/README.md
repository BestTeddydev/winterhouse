# Kubernetes Deployment Guide

## 📋 Prerequisites

- Kubernetes cluster (Docker Desktop, GKE, etc.)
- `kubectl` installed and configured
- Docker image built and pushed to registry

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

- `secrets.yaml.template` - Template for secrets (copy to `secrets.yaml` and fill in your values)
- `deployment.yaml` - Application deployment
- `service.yaml` - Service configuration
- `mongodb-simple.yaml` - MongoDB deployment (without persistent storage)
- `mongodb.yaml` - MongoDB deployment (with persistent storage)
- `ingress-local.yaml` - Ingress configuration for local development
- `ingress.yaml` - Ingress configuration for production (GKE)

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