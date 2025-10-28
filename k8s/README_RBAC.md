# RBAC Configuration for GKE

## Problem
The error "Grant roles/container.defaultNodeServiceAccount role to Node service account" occurs when deploying to GKE without proper Service Account permissions.

## Solution

### 1. Create RBAC Configuration
Apply the RBAC configuration to create the ServiceAccount and grant necessary permissions:

```bash
cd k8s
kubectl apply -f rbac.yaml
```

### 2. Verify ServiceAccount
Check that the ServiceAccount was created:

```bash
kubectl get serviceaccount baanlomnow-sa -n baanlomnow
```

### 3. Apply Deployment
Now apply the deployment with the ServiceAccount:

```bash
kubectl apply -f deployment.yaml
```

## What's in rbac.yaml?

1. **ServiceAccount** (`baanlomnow-sa`) - Service account for the pods
2. **ClusterRoleBinding** - Grants "view" cluster role to the service account
3. **Role** (`pod-reader`) - Allows reading pods in the namespace
4. **RoleBinding** - Binds the role to the service account

## Deployment Order

Make sure to apply resources in this order:

1. Namespace
2. RBAC (ServiceAccount and permissions)
3. ConfigMap
4. Secrets
5. Deployment
6. Service
7. Ingress

## Quick Deploy Script

Use the provided script to deploy everything in the correct order:

```bash
chmod +x k8s/deploy-rbac.sh
./k8s/deploy-rbac.sh
```

