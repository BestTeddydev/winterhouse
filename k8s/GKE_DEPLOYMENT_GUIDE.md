# 🚀 คู่มือการ Deploy Baanlomnow บน Google Kubernetes Engine (GKE)

## 📋 ขั้นตอนการ Deploy แบบละเอียด

### 1. เตรียมความพร้อม

#### 1.1 ติดตั้ง Tools ที่จำเป็น
```bash
# ติดตั้ง Google Cloud SDK
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# ติดตั้ง kubectl
gcloud components install kubectl

# ติดตั้ง Docker (ถ้ายังไม่มี)
# macOS
brew install docker

# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker.io
```

#### 1.2 ตั้งค่า Google Cloud
```bash
# Login เข้า Google Cloud
gcloud auth login

# ตั้งค่า project
gcloud config set project YOUR_PROJECT_ID

# เปิดใช้งาน APIs ที่จำเป็น
gcloud services enable container.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable compute.googleapis.com
```

### 2. เตรียมข้อมูล Configuration

#### 2.1 อัปเดต Project ID
```bash
# แก้ไข deploy script
sed -i "s/your-project-id/YOUR_PROJECT_ID/g" k8s/deploy.sh
sed -i "s/your-project-id/YOUR_PROJECT_ID/g" k8s/deployment.yaml
```

#### 2.2 จัดการ Secrets
```bash
# สร้าง secrets แบบ interactive
./k8s/manage-secrets.sh create

# อัปเดต ConfigMap
./k8s/manage-secrets.sh config

# อัปเดต Ingress พร้อม domain
./k8s/manage-secrets.sh ingress
```

### 3. สร้าง GKE Cluster

#### 3.1 สร้าง Cluster แบบ Manual
```bash
# สร้าง cluster
gcloud container clusters create baanlomnow-cluster \
  --zone=asia-southeast1-a \
  --num-nodes=3 \
  --enable-autoscaling \
  --min-nodes=1 \
  --max-nodes=10 \
  --machine-type=e2-medium \
  --enable-autorepair \
  --enable-autoupgrade \
  --disk-size=20GB \
  --disk-type=pd-standard \
  --enable-ip-alias \
  --network=default \
  --subnetwork=default

# หรือใช้ script ที่เตรียมไว้
./k8s/deploy.sh
```

#### 3.2 ตั้งค่า kubectl
```bash
# Get cluster credentials
gcloud container clusters get-credentials baanlomnow-cluster --zone=asia-southeast1-a

# ตรวจสอบการเชื่อมต่อ
kubectl get nodes
```

### 4. สร้าง Static IP Address

```bash
# สร้าง static IP
gcloud compute addresses create baanlomnow-ip --global

# ตรวจสอบ IP
gcloud compute addresses describe baanlomnow-ip --global
```

### 5. Build และ Push Docker Image

#### 5.1 Configure Docker สำหรับ GCR
```bash
# Configure Docker
gcloud auth configure-docker

# Build image
docker build -t asia-southeast1-docker.pkg.dev/project-14a6d9ab-7aaf-49a0-92d/baanlomnow-repository/baanlomnow:1.0 .
 
# Push image
docker push asia-southeast1-docker.pkg.dev/project-14a6d9ab-7aaf-49a0-92d/baanlomnow-repository/baanlomnow:1.0
```

#### 5.2 หรือใช้ Cloud Build
```bash
# สร้างไฟล์ cloudbuild.yaml
cat > cloudbuild.yaml << EOF
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/baanlomnow:$COMMIT_SHA', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/baanlomnow:$COMMIT_SHA']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['tag', 'gcr.io/$PROJECT_ID/baanlomnow:$COMMIT_SHA', 'gcr.io/$PROJECT_ID/baanlomnow:latest']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/baanlomnow:latest']
EOF

# Build และ push
gcloud builds submit --config cloudbuild.yaml .
```

### 6. Deploy Application

#### 6.1 Deploy แบบ Manual
```bash
# สร้าง namespace
kubectl apply -f k8s/namespace.yaml

# Deploy MongoDB
kubectl apply -f k8s/mongodb.yaml

# รอให้ MongoDB พร้อม
kubectl wait --for=condition=ready pod -l app=mongodb -n baanlomnow --timeout=300s

# Deploy ConfigMap และ Secrets
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml

# Deploy Application
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

# รอให้ Application พร้อม
kubectl wait --for=condition=ready pod -l app=baanlomnow -n baanlomnow --timeout=300s

# Deploy Ingress
kubectl apply -f k8s/managed-certificate.yaml
kubectl apply -f k8s/ingress.yaml
```

#### 6.2 Deploy แบบใช้ Script
```bash
# Deploy ทั้งหมด
./k8s/deploy.sh
```

### 7. ตรวจสอบการ Deploy

#### 7.1 ตรวจสอบ Status
```bash
# ตรวจสอบ pods
kubectl get pods -n baanlomnow

# ตรวจสอบ services
kubectl get services -n baanlomnow

# ตรวจสอบ ingress
kubectl get ingress -n baanlomnow

# ตรวจสอบ external IP
kubectl get ingress baanlomnow-ingress -n baanlomnow -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
```

#### 7.2 ทดสอบ Application
```bash
# ใช้ test script
./k8s/test.sh

# หรือทดสอบ manual
kubectl port-forward service/baanlomnow-service 3000:80 -n baanlomnow
# เปิด http://localhost:3000 ใน browser
```

### 8. ตั้งค่า DNS

#### 8.1 ตั้งค่า Domain
```bash
# รับ External IP
EXTERNAL_IP=$(kubectl get ingress baanlomnow-ingress -n baanlomnow -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

echo "External IP: $EXTERNAL_IP"
echo "ตั้งค่า DNS A record สำหรับ baanlomnow.com ชี้ไปที่ $EXTERNAL_IP"
```

#### 8.2 ตรวจสอบ SSL Certificate
```bash
# ตรวจสอบ certificate status
kubectl describe managedcertificate baanlomnow-ssl-cert -n baanlomnow

# รอให้ certificate พร้อม (อาจใช้เวลาหลายนาที)
kubectl wait --for=condition=Ready managedcertificate baanlomnow-ssl-cert -n baanlomnow --timeout=600s
```

### 9. Monitoring และ Maintenance

#### 9.1 ตรวจสอบ Logs
```bash
# Application logs
kubectl logs -f deployment/baanlomnow-app -n baanlomnow

# MongoDB logs
kubectl logs -f deployment/mongodb -n baanlomnow

# Ingress logs
kubectl logs -f deployment/ingress-gce -n kube-system
```

#### 9.2 Scale Application
```bash
# Scale up
kubectl scale deployment baanlomnow-app --replicas=5 -n baanlomnow

# Scale down
kubectl scale deployment baanlomnow-app --replicas=2 -n baanlomnow
```

#### 9.3 Update Application
```bash
# Build new image
docker build -t gcr.io/YOUR_PROJECT_ID/baanlomnow:v2.0 .

# Push new image
docker push gcr.io/YOUR_PROJECT_ID/baanlomnow:v2.0

# Update deployment
kubectl set image deployment/baanlomnow-app baanlomnow-app=gcr.io/YOUR_PROJECT_ID/baanlomnow:v2.0 -n baanlomnow

# ตรวจสอบ rolling update
kubectl rollout status deployment/baanlomnow-app -n baanlomnow
```

### 10. Troubleshooting

#### 10.1 ปัญหาที่พบบ่อย

**Pod ไม่สามารถเริ่มได้:**
```bash
# ตรวจสอบ pod details
kubectl describe pod <pod-name> -n baanlomnow

# ตรวจสอบ logs
kubectl logs <pod-name> -n baanlomnow
```

**Service ไม่สามารถเชื่อมต่อได้:**
```bash
# ตรวจสอบ service
kubectl describe service baanlomnow-service -n baanlomnow

# ตรวจสอบ endpoints
kubectl get endpoints baanlomnow-service -n baanlomnow
```

**Ingress ไม่ทำงาน:**
```bash
# ตรวจสอบ ingress
kubectl describe ingress baanlomnow-ingress -n baanlomnow

# ตรวจสอบ certificate
kubectl describe managedcertificate baanlomnow-ssl-cert -n baanlomnow
```

#### 10.2 Debug Commands
```bash
# เข้า pod
kubectl exec -it <pod-name> -n baanlomnow -- /bin/sh

# ตรวจสอบ resources
kubectl top pods -n baanlomnow
kubectl top nodes

# ตรวจสอบ events
kubectl get events -n baanlomnow --sort-by='.lastTimestamp'
```

### 11. Security Best Practices

#### 11.1 Network Policies
```bash
# สร้างไฟล์ network-policy.yaml
cat > k8s/network-policy.yaml << EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: baanlomnow-network-policy
  namespace: baanlomnow
spec:
  podSelector:
    matchLabels:
      app: baanlomnow
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: baanlomnow
    ports:
    - protocol: TCP
      port: 3000
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: baanlomnow
    ports:
    - protocol: TCP
      port: 27017
EOF

# Apply network policy
kubectl apply -f k8s/network-policy.yaml
```

#### 11.2 Resource Limits
```bash
# ตรวจสอบ resource usage
kubectl describe pod <pod-name> -n baanlomnow | grep -A 5 "Limits\|Requests"
```

### 12. Backup และ Recovery

#### 12.1 Backup MongoDB
```bash
# สร้าง backup script
cat > backup-mongodb.sh << EOF
#!/bin/bash
POD_NAME=\$(kubectl get pods -n baanlomnow -l app=mongodb -o jsonpath='{.items[0].metadata.name}')
kubectl exec \$POD_NAME -n baanlomnow -- mongodump --out /tmp/backup
kubectl cp baanlomnow/\$POD_NAME:/tmp/backup ./mongodb-backup-\$(date +%Y%m%d)
EOF

chmod +x backup-mongodb.sh
```

#### 12.2 Restore MongoDB
```bash
# Restore script
cat > restore-mongodb.sh << EOF
#!/bin/bash
POD_NAME=\$(kubectl get pods -n baanlomnow -l app=mongodb -o jsonpath='{.items[0].metadata.name}')
kubectl cp ./mongodb-backup-\$1 baanlomnow/\$POD_NAME:/tmp/restore
kubectl exec \$POD_NAME -n baanlomnow -- mongorestore /tmp/restore
EOF

chmod +x restore-mongodb.sh
```

### 13. Cost Optimization

#### 13.1 ใช้ Preemptible Instances
```bash
# สร้าง node pool สำหรับ preemptible instances
gcloud container node-pools create preemptible-pool \
  --cluster=baanlomnow-cluster \
  --zone=asia-southeast1-a \
  --num-nodes=2 \
  --preemptible \
  --machine-type=e2-small
```

#### 13.2 Horizontal Pod Autoscaler
```bash
# สร้างไฟล์ hpa.yaml
cat > k8s/hpa.yaml << EOF
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: baanlomnow-hpa
  namespace: baanlomnow
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: baanlomnow-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
EOF

# Apply HPA
kubectl apply -f k8s/hpa.yaml
```

### 14. Cleanup

#### 14.1 ลบ Application
```bash
# ใช้ cleanup script
./k8s/cleanup.sh

# หรือลบ manual
kubectl delete -f k8s/ -n baanlomnow
kubectl delete namespace baanlomnow
```

#### 14.2 ลบ Cluster
```bash
# ลบ cluster
gcloud container clusters delete baanlomnow-cluster --zone=asia-southeast1-a

# ลบ static IP
gcloud compute addresses delete baanlomnow-ip --global
```

## 🎯 Quick Start Commands

```bash
# 1. เตรียมข้อมูล
export PROJECT_ID="your-project-id"
sed -i "s/your-project-id/$PROJECT_ID/g" k8s/deploy.sh

# 2. จัดการ secrets
./k8s/manage-secrets.sh create
./k8s/manage-secrets.sh config
./k8s/manage-secrets.sh ingress

# 3. Deploy
./k8s/deploy.sh

# 4. ทดสอบ
./k8s/test.sh

# 5. ตรวจสอบ
kubectl get all -n baanlomnow
```

## 📞 Support

หากมีปัญหาหรือคำถาม:
1. ตรวจสอบ logs: `kubectl logs -f deployment/baanlomnow-app -n baanlomnow`
2. ตรวจสอบ events: `kubectl get events -n baanlomnow`
3. ตรวจสอบ resources: `kubectl describe pod <pod-name> -n baanlomnow`
4. ใช้ test script: `./k8s/test.sh`

---

**🎉 คู่มือการ Deploy บน GKE เสร็จสมบูรณ์!**

ตอนนี้คุณสามารถ deploy แอปพลิเคชัน Baanlomnow บน GKE ได้แล้ว
