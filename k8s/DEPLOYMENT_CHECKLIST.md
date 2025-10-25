# ✅ Checklist การ Deploy Baanlomnow บน GKE

## 📋 Pre-deployment Checklist

### 🔧 Prerequisites
- [ ] Google Cloud SDK ติดตั้งแล้ว
- [ ] kubectl ติดตั้งแล้ว
- [ ] Docker ติดตั้งแล้ว
- [ ] Google Cloud Project สร้างแล้ว
- [ ] Billing เปิดใช้งานแล้ว

### 🔐 Authentication & Authorization
- [ ] Login เข้า Google Cloud (`gcloud auth login`)
- [ ] ตั้งค่า project (`gcloud config set project YOUR_PROJECT_ID`)
- [ ] APIs เปิดใช้งานแล้ว:
  - [ ] Container API
  - [ ] Container Registry API
  - [ ] Compute Engine API

### 📝 Configuration
- [ ] Project ID อัปเดตในไฟล์ configuration
- [ ] Domain name ตั้งค่าแล้ว (baanlomnow.com)
- [ ] Secrets เตรียมพร้อมแล้ว:
  - [ ] MongoDB URI
  - [ ] NextAuth Secret
  - [ ] Google Cloud Project ID
  - [ ] Google Cloud Storage Bucket
  - [ ] Email Service Key (Resend)
  - [ ] LINE Integration Keys

## 🚀 Deployment Checklist

### 🏗️ Infrastructure
- [ ] GKE Cluster สร้างแล้ว
- [ ] Static IP Address สร้างแล้ว
- [ ] Node pool ตั้งค่าแล้ว (autoscaling enabled)

### 🐳 Container
- [ ] Docker image build สำเร็จ
- [ ] Docker image push ไป GCR สำเร็จ
- [ ] Image tag ถูกต้อง

### 📦 Kubernetes Resources
- [ ] Namespace สร้างแล้ว
- [ ] ConfigMap สร้างแล้ว
- [ ] Secrets สร้างแล้ว
- [ ] MongoDB deployment สร้างแล้ว
- [ ] Application deployment สร้างแล้ว
- [ ] Service สร้างแล้ว
- [ ] Ingress สร้างแล้ว
- [ ] Managed Certificate สร้างแล้ว

### 🔍 Verification
- [ ] Pods ทำงานปกติ
- [ ] Services ทำงานปกติ
- [ ] Ingress ทำงานปกติ
- [ ] External IP ได้รับแล้ว
- [ ] SSL Certificate พร้อมใช้งาน
- [ ] Application ตอบสนองปกติ

## 🌐 DNS & Domain Checklist

### 📡 DNS Configuration
- [ ] A record สำหรับ baanlomnow.com
- [ ] A record สำหรับ www.baanlomnow.com
- [ ] CNAME record (ถ้าจำเป็น)
- [ ] DNS propagation เสร็จสิ้น

### 🔒 SSL Certificate
- [ ] Certificate สร้างแล้ว
- [ ] Certificate status: Ready
- [ ] HTTPS redirect ทำงานปกติ
- [ ] Mixed content issues แก้ไขแล้ว

## 🧪 Testing Checklist

### 🔍 Health Checks
- [ ] Health endpoint ตอบสนองปกติ (`/api/health`)
- [ ] Application startup สำเร็จ
- [ ] Database connection สำเร็จ
- [ ] External services เชื่อมต่อได้

### 🌐 Functionality Tests
- [ ] Homepage โหลดได้
- [ ] User registration/login ทำงาน
- [ ] Room booking ทำงาน
- [ ] Payment integration ทำงาน
- [ ] Admin panel ทำงาน
- [ ] File upload ทำงาน

### 📱 Cross-platform Tests
- [ ] Desktop browser ทำงานปกติ
- [ ] Mobile browser ทำงานปกติ
- [ ] Different screen sizes ทำงานปกติ

## 📊 Monitoring Checklist

### 📈 Application Monitoring
- [ ] Logs เก็บได้ปกติ
- [ ] Metrics เก็บได้ปกติ
- [ ] Error tracking ตั้งค่าแล้ว
- [ ] Performance monitoring ตั้งค่าแล้ว

### 🔧 Infrastructure Monitoring
- [ ] Cluster health monitoring
- [ ] Node health monitoring
- [ ] Resource usage monitoring
- [ ] Network monitoring

## 🔒 Security Checklist

### 🛡️ Network Security
- [ ] Network policies ตั้งค่าแล้ว
- [ ] Firewall rules ตั้งค่าแล้ว
- [ ] Private cluster (ถ้าจำเป็น)
- [ ] VPC ตั้งค่าแล้ว

### 🔐 Application Security
- [ ] Secrets management ปลอดภัย
- [ ] Environment variables ปลอดภัย
- [ ] Database credentials ปลอดภัย
- [ ] API keys ปลอดภัย

### 👥 Access Control
- [ ] RBAC ตั้งค่าแล้ว
- [ ] Service accounts ตั้งค่าแล้ว
- [ ] IAM roles ตั้งค่าแล้ว

## 💰 Cost Optimization Checklist

### 💸 Resource Optimization
- [ ] Resource requests ตั้งค่าเหมาะสม
- [ ] Resource limits ตั้งค่าเหมาะสม
- [ ] Horizontal Pod Autoscaler ตั้งค่าแล้ว
- [ ] Cluster Autoscaler ตั้งค่าแล้ว

### 🏷️ Cost Management
- [ ] Resource tagging ตั้งค่าแล้ว
- [ ] Cost monitoring ตั้งค่าแล้ว
- [ ] Budget alerts ตั้งค่าแล้ว
- [ ] Preemptible instances (ถ้าจำเป็น)

## 🚨 Troubleshooting Checklist

### 🔍 Common Issues
- [ ] Pod startup failures
- [ ] Service connectivity issues
- [ ] Ingress configuration issues
- [ ] SSL certificate issues
- [ ] Database connection issues

### 🛠️ Debug Tools
- [ ] kubectl commands ทำงานได้
- [ ] Log access ทำงานได้
- [ ] Pod debugging ทำงานได้
- [ ] Network debugging ทำงานได้

## 📚 Documentation Checklist

### 📖 Documentation
- [ ] Deployment guide อัปเดตแล้ว
- [ ] Configuration guide อัปเดตแล้ว
- [ ] Troubleshooting guide อัปเดตแล้ว
- [ ] Monitoring guide อัปเดตแล้ว

### 👥 Team Knowledge
- [ ] Team training เสร็จสิ้น
- [ ] Runbook เตรียมพร้อม
- [ ] Emergency contacts อัปเดตแล้ว
- [ ] Escalation procedures อัปเดตแล้ว

## 🎯 Post-deployment Checklist

### ✅ Final Verification
- [ ] All services ทำงานปกติ
- [ ] Performance อยู่ในเกณฑ์ที่ยอมรับได้
- [ ] Security scan ผ่าน
- [ ] Load testing ผ่าน

### 📋 Handover
- [ ] Production access มอบให้ทีม
- [ ] Monitoring access มอบให้ทีม
- [ ] Documentation มอบให้ทีม
- [ ] Support procedures มอบให้ทีม

---

## 🚀 Quick Commands

```bash
# Deploy ทั้งหมด
./k8s/quick-deploy.sh

# หรือใช้ script เดิม
./k8s/deploy.sh

# ทดสอบ
./k8s/test.sh

# ตรวจสอบ status
kubectl get all -n baanlomnow

# ดู logs
kubectl logs -f deployment/baanlomnow-app -n baanlomnow

# Scale
kubectl scale deployment baanlomnow-app --replicas=5 -n baanlomnow
```

---

**🎉 Checklist เสร็จสมบูรณ์!**

ใช้ checklist นี้เพื่อให้แน่ใจว่าการ deploy สำเร็จและปลอดภัย
