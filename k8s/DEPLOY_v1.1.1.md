# 🚀 Deploy Image Version 1.1.1

## 📋 Quick Start

### Option 1: Build and Deploy in One Command (Recommended)
```bash
bash k8s/build-and-set-image.sh 1.1.1
```

### Option 2: Step by Step

#### Step 1: Build Multi-Architecture Image
```bash
bash k8s/build-multi-arch.sh 1.1.1
```

#### Step 2: Set Image to Deployment
```bash
bash k8s/set-image.sh 1.1.1
```

## 🔍 Manual Commands

### Build Image Only
```bash
bash k8s/build-multi-arch.sh 1.1.1
```

### Set Image Only (if image already exists)
```bash
kubectl set image deployment/baanlomnow-app \
  baanlomnow-app=asia-southeast1-docker.pkg.dev/project-14a6d9ab-7aaf-49a0-92d/baanlomnow-repository/baanlomnow:1.1.1 \
  -n baanlomnow
```

### Monitor Rollout
```bash
kubectl rollout status deployment/baanlomnow-app -n baanlomnow
```

### Check Pods
```bash
kubectl get pods -n baanlomnow
```

### View Deployment Details
```bash
kubectl describe deployment baanlomnow-app -n baanlomnow
```

## 🐛 Troubleshooting

### If image doesn't exist in Artifact Registry
1. Make sure you've built and pushed the image:
   ```bash
   bash k8s/build-multi-arch.sh 1.1.1
   ```

2. Verify image exists:
   ```bash
   gcloud artifacts docker images list \
     asia-southeast1-docker.pkg.dev/project-14a6d9ab-7aaf-49a0-92d/baanlomnow-repository/baanlomnow \
     --filter="tags:1.1.1"
   ```

### If deployment fails
1. Check pod status:
   ```bash
   kubectl get pods -n baanlomnow
   kubectl describe pod <pod-name> -n baanlomnow
   ```

2. Check logs:
   ```bash
   kubectl logs -l app=baanlomnow -n baanlomnow --tail=100
   ```

3. Check if imagePullSecrets is configured:
   ```bash
   kubectl get deployment baanlomnow-app -n baanlomnow -o yaml | grep imagePullSecrets
   ```

### If image pull fails
Make sure `imagePullSecrets` is configured in deployment:
```bash
kubectl get deployment baanlomnow-app -n baanlomnow -o yaml | grep -A 2 imagePullSecrets
```

Should show:
```yaml
imagePullSecrets:
- name: artifact-registry-json-key
```

## 📝 Notes

- Image path: `asia-southeast1-docker.pkg.dev/project-14a6d9ab-7aaf-49a0-92d/baanlomnow-repository/baanlomnow:1.1.1`
- Deployment name: `baanlomnow-app`
- Namespace: `baanlomnow`
- The script will automatically check if image exists before setting it
- Rollout status will be monitored automatically

## ✅ Verification

After deployment, verify:
1. Pods are running:
   ```bash
   kubectl get pods -n baanlomnow
   ```

2. Image is correct:
   ```bash
   kubectl get deployment baanlomnow-app -n baanlomnow -o jsonpath='{.spec.template.spec.containers[0].image}'
   ```

3. Application is healthy:
   ```bash
   kubectl get pods -n baanlomnow -o wide
   ```

