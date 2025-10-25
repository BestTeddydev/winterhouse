# Winterhouse Kubernetes Deployment

This directory contains Kubernetes configuration files for deploying the Winterhouse application to Google Kubernetes Engine (GKE).

## Prerequisites

1. **Google Cloud SDK** - Install and configure gcloud CLI
2. **kubectl** - Kubernetes command-line tool
3. **Docker** - For building container images
4. **Google Cloud Project** - With billing enabled

## Quick Start

1. **Configure your project**:
   ```bash
   # Set your project ID
   export PROJECT_ID="your-project-id"
   
   # Update the deploy script
   sed -i "s/your-project-id/${PROJECT_ID}/g" k8s/deploy.sh
   ```

2. **Update configuration files**:
   - Edit `k8s/configmap.yaml` with your actual configuration values
   - Edit `k8s/secrets.yaml` with your base64-encoded secrets
   - Update domain names in `k8s/ingress.yaml` and `k8s/managed-certificate.yaml`

3. **Deploy to GKE**:
   ```bash
   ./k8s/deploy.sh
   ```

## Manual Deployment Steps

If you prefer to deploy manually:

1. **Create GKE cluster**:
   ```bash
   gcloud container clusters create baanlomnow-cluster \
     --zone=asia-southeast1-a \
     --num-nodes=3 \
     --enable-autoscaling \
     --min-nodes=1 \
     --max-nodes=10 \
     --machine-type=e2-medium
   ```

2. **Get cluster credentials**:
   ```bash
   gcloud container clusters get-credentials baanlomnow-cluster --zone=asia-southeast1-a
   ```

3. **Build and push Docker image**:
   ```bash
   docker build -t gcr.io/${PROJECT_ID}/baanlomnow:latest .
   docker push gcr.io/${PROJECT_ID}/baanlomnow:latest
   ```

4. **Apply Kubernetes configurations**:
   ```bash
   kubectl apply -f k8s/namespace.yaml
   kubectl apply -f k8s/mongodb.yaml
   kubectl apply -f k8s/configmap.yaml
   kubectl apply -f k8s/secrets.yaml
   kubectl apply -f k8s/deployment.yaml
   kubectl apply -f k8s/service.yaml
   kubectl apply -f k8s/managed-certificate.yaml
   kubectl apply -f k8s/ingress.yaml
   ```

## Configuration Files

### Core Application Files
- `namespace.yaml` - Creates the baanlomnow namespace
- `deployment.yaml` - Deploys the Next.js application
- `service.yaml` - Exposes the application within the cluster
- `ingress.yaml` - Configures external access with load balancer
- `managed-certificate.yaml` - SSL certificate management

### Configuration Files
- `configmap.yaml` - Non-sensitive configuration values
- `secrets.yaml` - Sensitive data (base64 encoded)

### Database Files
- `mongodb.yaml` - MongoDB deployment with persistent storage

## Environment Variables

### Required Secrets (Base64 Encoded)
```bash
# MongoDB
MONGODB_URI=mongodb://mongodb-service:27017/baanlomnow
MONGODB_ROOT_PASSWORD=your-mongodb-password

# NextAuth
NEXTAUTH_SECRET=your-nextauth-secret

# Google Cloud
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_STORAGE_BUCKET=your-bucket-name

STRIPE_SECRET_KEY=your-stripe-secret-key

# Email Service
RESEND_API_KEY=your-resend-api-key

# LINE Integration
LINE_CHANNEL_SECRET=your-line-channel-secret
LINE_CHANNEL_ACCESS_TOKEN=your-line-channel-access-token
```

### Public Configuration (ConfigMap)
```bash
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.com
STRIPE_PUBLIC_KEY=your-stripe-public-key
LINE_CHANNEL_ID=your-line-channel-id
```

## Monitoring and Troubleshooting

### Check Deployment Status
```bash
kubectl get pods -n baanlomnow
kubectl get services -n baanlomnow
kubectl get ingress -n baanlomnow
```

### View Logs
```bash
# Application logs
kubectl logs -f deployment/baanlomnow-app -n baanlomnow

# MongoDB logs
kubectl logs -f deployment/mongodb -n baanlomnow
```

### Debug Pods
```bash
# Get pod details
kubectl describe pod <pod-name> -n baanlomnow

# Execute commands in pod
kubectl exec -it <pod-name> -n baanlomnow -- /bin/sh
```

### Scale Application
```bash
# Scale up/down replicas
kubectl scale deployment baanlomnow-app --replicas=5 -n baanlomnow
```

## Security Considerations

1. **Secrets Management**: Use Google Secret Manager for production
2. **Network Policies**: Implement network policies for pod-to-pod communication
3. **RBAC**: Configure proper role-based access control
4. **Image Security**: Use vulnerability scanning for container images
5. **SSL/TLS**: Ensure all traffic is encrypted

## Cost Optimization

1. **Resource Limits**: Set appropriate CPU and memory limits
2. **Autoscaling**: Configure horizontal pod autoscaling
3. **Node Pool**: Use preemptible instances for non-critical workloads
4. **Storage**: Choose appropriate storage classes based on needs

## Backup and Recovery

1. **MongoDB Backup**: Implement regular database backups
2. **Persistent Volumes**: Backup persistent volume data
3. **Configuration**: Version control all configuration files
4. **Disaster Recovery**: Test recovery procedures regularly

## Support

For issues and questions:
1. Check the application logs
2. Verify configuration values
3. Ensure all secrets are properly encoded
4. Check GKE cluster health
5. Verify network connectivity
