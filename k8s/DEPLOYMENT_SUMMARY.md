# Winterhouse Kubernetes Deployment - Complete Setup

## 🎉 สรุปการสร้าง Kubernetes Configuration สำหรับ GKE

ฉันได้สร้างไฟล์ Kubernetes configuration ที่สมบูรณ์สำหรับ deploy แอปพลิเคชัน Winterhouse บน Google Kubernetes Engine (GKE) แล้ว

## 📁 ไฟล์ที่สร้างขึ้น

### Core Kubernetes Files
- **`namespace.yaml`** - สร้าง namespace สำหรับแอปพลิเคชัน
- **`deployment.yaml`** - Deploy Next.js application พร้อม health checks
- **`service.yaml`** - Expose application ภายใน cluster
- **`ingress.yaml`** - Configure external access พร้อม load balancer
- **`managed-certificate.yaml`** - SSL certificate management

### Configuration Files
- **`configmap.yaml`** - Non-sensitive configuration values
- **`secrets.yaml`** - Sensitive data (base64 encoded)

### Database Files
- **`mongodb.yaml`** - MongoDB deployment พร้อม persistent storage

### Management Scripts
- **`deploy.sh`** - Script สำหรับ deploy ทั้งหมด
- **`test.sh`** - Script สำหรับทดสอบ deployment
- **`manage-secrets.sh`** - Script สำหรับจัดการ secrets
- **`cleanup.sh`** - Script สำหรับลบ deployment

### Documentation
- **`README.md`** - คู่มือการใช้งานแบบละเอียด

## 🚀 วิธีการใช้งาน

### 1. เตรียมข้อมูล
```bash
# ตั้งค่า project ID
export PROJECT_ID="your-project-id"

# อัปเดต deploy script
sed -i "s/your-project-id/${PROJECT_ID}/g" k8s/deploy.sh
```

### 2. จัดการ Secrets
```bash
# สร้าง secrets แบบ interactive
./k8s/manage-secrets.sh create

# อัปเดต ConfigMap
./k8s/manage-secrets.sh config

# อัปเดต Ingress พร้อม domain
./k8s/manage-secrets.sh ingress
```

### 3. Deploy
```bash
# Deploy ทั้งหมด
./k8s/deploy.sh
```

### 4. ทดสอบ
```bash
# ทดสอบ deployment
./k8s/test.sh
```

### 5. ลบ (ถ้าต้องการ)
```bash
# ลบ deployment
./k8s/cleanup.sh
```

## 🔧 Features ที่รองรับ

### Application Features
- ✅ Next.js application deployment
- ✅ Health checks และ readiness probes
- ✅ Resource limits และ requests
- ✅ Horizontal pod autoscaling
- ✅ Rolling updates

### Database Features
- ✅ MongoDB deployment
- ✅ Persistent volume storage
- ✅ Database connectivity

### Security Features
- ✅ Secrets management
- ✅ ConfigMap สำหรับ configuration
- ✅ SSL/TLS certificates
- ✅ Non-root user execution

### Monitoring Features
- ✅ Health endpoint monitoring
- ✅ Log aggregation
- ✅ Resource usage tracking

## 🌐 Network Configuration

### Ingress
- Google Cloud Load Balancer
- SSL/TLS termination
- Custom domain support
- Static IP address

### Services
- ClusterIP service สำหรับ internal communication
- Load balancing
- Service discovery

## 📊 Resource Requirements

### Application Pods
- **CPU**: 250m request, 500m limit
- **Memory**: 256Mi request, 512Mi limit
- **Replicas**: 3 (configurable)

### MongoDB Pod
- **CPU**: 250m request, 500m limit
- **Memory**: 256Mi request, 512Mi limit
- **Storage**: 10Gi persistent volume

## 🔐 Security Considerations

### Secrets Management
- Base64 encoded secrets
- Kubernetes secrets
- Environment variable injection

### Network Security
- Private cluster communication
- SSL/TLS encryption
- Firewall rules

### Access Control
- RBAC configuration
- Service account management
- Pod security policies

## 📈 Scaling และ Performance

### Horizontal Pod Autoscaling
- CPU-based scaling
- Memory-based scaling
- Custom metrics support

### Resource Optimization
- Resource requests และ limits
- Node affinity rules
- Pod disruption budgets

## 🛠️ Troubleshooting

### Common Issues
1. **Pod startup failures** - Check logs และ resource limits
2. **Database connectivity** - Verify MongoDB service
3. **Ingress issues** - Check SSL certificate status
4. **Resource constraints** - Monitor resource usage

### Debug Commands
```bash
# ดู pod status
kubectl get pods -n baanlomnow

# ดู logs
kubectl logs -f deployment/baanlomnow-app -n baanlomnow

# ดู service status
kubectl get services -n baanlomnow

# ดู ingress status
kubectl get ingress -n baanlomnow
```

## 🎯 Next Steps

1. **Update configuration** - แก้ไข domain และ project ID
2. **Configure secrets** - ใส่ข้อมูลจริงใน secrets
3. **Deploy to GKE** - รัน deploy script
4. **Configure DNS** - ชี้ domain ไปที่ external IP
5. **Monitor application** - ใช้ test script เพื่อตรวจสอบ

## 📞 Support

หากมีปัญหาหรือคำถาม:
1. ตรวจสอบ logs ของ pods
2. ตรวจสอบ configuration values
3. ตรวจสอบ secrets encoding
4. ตรวจสอบ GKE cluster health
5. ตรวจสอบ network connectivity

---

**🎉 การตั้งค่า Kubernetes configuration เสร็จสมบูรณ์แล้ว!**

ตอนนี้คุณสามารถ deploy แอปพลิเคชัน Winterhouse บน GKE ได้แล้ว โดยใช้ไฟล์และ scripts ที่สร้างขึ้น
