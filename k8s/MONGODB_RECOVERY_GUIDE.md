# 🔧 คู่มือการกู้คืนข้อมูล MongoDB

## 🚨 สถานการณ์: ข้อมูล MongoDB หายไป

### ขั้นตอนที่ 1: ตรวจสอบสถานะ

```bash
# ใช้สคริปต์ตรวจสอบอัตโนมัติ
cd k8s
./check-mongodb.sh
```

หรือตรวจสอบด้วยตนเอง:

```bash
# 1. ตรวจสอบ MongoDB Pod
kubectl get pods -n baanlomnow -l app=mongodb

# 2. ตรวจสอบ PersistentVolumeClaim
kubectl get pvc -n baanlomnow | grep mongodb

# 3. ตรวจสอบ PersistentVolume
kubectl get pv | grep mongodb

# 4. ดู MongoDB logs
kubectl logs -n baanlomnow -l app=mongodb --tail=50

# 5. ตรวจสอบข้อมูลใน MongoDB
POD_NAME=$(kubectl get pods -n baanlomnow -l app=mongodb -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n baanlomnow $POD_NAME -- mongosh --quiet --eval "use baanlomnow; db.getCollectionNames()"
```

### ขั้นตอนที่ 2: วิเคราะห์ปัญหา

#### กรณีที่ 1: MongoDB Pod ไม่ทำงาน

```bash
# ตรวจสอบสถานะ pod
kubectl describe pod -n baanlomnow -l app=mongodb

# ตรวจสอบ events
kubectl get events -n baanlomnow --sort-by='.lastTimestamp' | grep mongodb
```

**การแก้ไข:**
```bash
# รีสตาร์ท MongoDB deployment
kubectl delete deployment mongodb -n baanlomnow
kubectl apply -f k8s/mongodb.yaml

# รอให้ pod เริ่มทำงาน
kubectl wait --for=condition=ready pod -l app=mongodb -n baanlomnow --timeout=300s
```

#### กรณีที่ 2: PersistentVolumeClaim ไม่ได้ bind

```bash
# ตรวจสอบ PVC status
kubectl describe pvc mongodb-pvc -n baanlomnow
```

**การแก้ไข:**
```bash
# ตรวจสอบ storage class
kubectl get storageclass

# ถ้า PVC เป็น Pending ให้ตรวจสอบว่า storage class ถูกต้อง
# ถ้าใช้ hostpath storage class ต้องสร้างก่อน
```

#### กรณีที่ 3: Pod ถูก recreate แต่ข้อมูลยังอยู่ใน PVC

```bash
# ใช้สคริปต์กู้คืน
./recover-mongodb.sh
```

#### กรณีที่ 4: ข้อมูลหายไปจริงๆ (ไม่มีใน PVC)

**ถ้ามี backup:**
```bash
# ใช้สคริปต์ restore
./restore-mongodb.sh ./mongodb-backups/mongodb-backup-YYYYMMDD_HHMMSS.tar.gz
```

**ถ้าไม่มี backup:**
- ข้อมูลอาจหายไปถาวร
- ต้องสร้างข้อมูลใหม่
- แนะนำให้ตั้งค่า backup อัตโนมัติ

### ขั้นตอนที่ 3: การกู้คืนข้อมูล

#### วิธีที่ 1: ใช้สคริปต์กู้คืนอัตโนมัติ

```bash
cd k8s
./recover-mongodb.sh
```

#### วิธีที่ 2: ตรวจสอบและแก้ไขด้วยตนเอง

**1. ตรวจสอบว่า PVC ยังมีข้อมูลอยู่หรือไม่:**

```bash
# ตรวจสอบ PVC details
kubectl describe pvc mongodb-pvc -n baanlomnow

# ตรวจสอบ volume path (ถ้าใช้ hostpath)
kubectl get pv -o jsonpath='{.items[?(@.spec.claimRef.name=="mongodb-pvc")].spec.hostPath.path}'
```

**2. ตรวจสอบว่า pod mount volume ถูกต้องหรือไม่:**

```bash
POD_NAME=$(kubectl get pods -n baanlomnow -l app=mongodb -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n baanlomnow $POD_NAME -- ls -lah /data/db
```

**3. ถ้าข้อมูลยังอยู่ใน volume แต่ MongoDB ไม่เห็น:**

```bash
# เข้าไปใน pod
kubectl exec -it -n baanlomnow $POD_NAME -- mongosh

# ตรวจสอบ database
use baanlomnow
db.getCollectionNames()

# ถ้าไม่มี collections ให้ตรวจสอบว่า volume mount ถูกต้อง
```

### ขั้นตอนที่ 4: การป้องกันในอนาคต

#### 1. สร้าง Backup อัตโนมัติ

```bash
# ใช้สคริปต์ backup
./backup-mongodb.sh

# หรือตั้งค่า cron job สำหรับ backup ตามเวลา
```

#### 2. ตรวจสอบ PVC Configuration

ตรวจสอบว่า `mongodb.yaml` มีการกำหนด PersistentVolumeClaim ถูกต้อง:

```yaml
volumeMounts:
- name: mongodb-storage
  mountPath: /data/db
volumes:
- name: mongodb-storage
  persistentVolumeClaim:
    claimName: mongodb-pvc
```

#### 3. ตรวจสอบ Storage Class

```bash
# ตรวจสอบว่า storage class มีอยู่
kubectl get storageclass

# ถ้าใช้ hostpath ต้องสร้าง storage class ก่อน
```

#### 4. ตั้งค่า Backup Schedule

```bash
# สร้าง CronJob สำหรับ backup อัตโนมัติ
kubectl create cronjob mongodb-backup \
  --image=mongo:7.0 \
  --schedule="0 2 * * *" \
  --restart=OnFailure \
  -- mongodump --uri="mongodb://admin:bestbaanlomnow@mongodb-service:27017/baanlomnow?authSource=admin" --out=/backup
```

## 📋 สรุปคำสั่งที่สำคัญ

### ตรวจสอบสถานะ

```bash
# Pod status
kubectl get pods -n baanlomnow -l app=mongodb

# PVC status
kubectl get pvc -n baanlomnow

# MongoDB logs
kubectl logs -n baanlomnow -l app=mongodb --tail=50

# ตรวจสอบข้อมูล
POD_NAME=$(kubectl get pods -n baanlomnow -l app=mongodb -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n baanlomnow $POD_NAME -- mongosh --quiet --eval "use baanlomnow; db.users.countDocuments()"
```

### กู้คืนข้อมูล

```bash
# ใช้สคริปต์อัตโนมัติ
./recover-mongodb.sh

# Restore จาก backup
./restore-mongodb.sh ./mongodb-backups/mongodb-backup-YYYYMMDD_HHMMSS.tar.gz
```

### Backup

```bash
# สร้าง backup
./backup-mongodb.sh

# Backup ด้วยตนเอง
POD_NAME=$(kubectl get pods -n baanlomnow -l app=mongodb -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n baanlomnow $POD_NAME -- mongodump --uri="mongodb://admin:bestbaanlomnow@localhost:27017/baanlomnow?authSource=admin" --out=/tmp/backup
kubectl cp baanlomnow/$POD_NAME:/tmp/backup ./mongodb-backup-$(date +%Y%m%d)
```

## ⚠️ ข้อควรระวัง

1. **อย่าลบ PVC** ถ้ายังไม่แน่ใจว่าข้อมูลหายไปจริงๆ
2. **ตรวจสอบ backup** ก่อน restore
3. **ทดสอบ restore** ใน staging environment ก่อน production
4. **ตั้งค่า backup อัตโนมัติ** เพื่อป้องกันปัญหานี้ในอนาคต

## 🔗 เอกสารเพิ่มเติม

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Kubernetes PersistentVolumes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/)
- [MongoDB Backup Best Practices](https://docs.mongodb.com/manual/core/backups/)

