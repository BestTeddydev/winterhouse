# 📦 MongoDB Backup Setup สำหรับ Google Kubernetes Engine

## 🎯 ภาพรวม

ระบบนี้จะ backup MongoDB อัตโนมัติไปยัง Google Cloud Storage (GCS) ทุกวันเวลา 02:00 UTC (09:00 เวลาไทย) และเก็บ backup ไว้ 30 วัน

## 📋 ข้อกำหนดเบื้องต้น

1. มี GCP Project และสามารถเข้าถึงได้
2. มี `gcloud` CLI ติดตั้งและ login แล้ว
3. มี cluster access ผ่าน `kubectl`

## 🚀 การติดตั้ง

### ขั้นตอนที่ 1: รัน Setup Script

```bash
cd k8s
./mongodb-backup-setup.sh
```

Script นี้จะ:
- ✅ สร้าง GCS bucket (`baanlomnow-mongodb-backups`)
- ✅ สร้าง Service Account สำหรับ backup
- ✅ ให้สิทธิ์ Service Account เข้าถึง GCS
- ✅ สร้าง Kubernetes Secret สำหรับ credentials
- ✅ สร้าง Kubernetes Service Account และ RBAC
- ✅ สร้าง CronJob สำหรับ backup อัตโนมัติ

### ขั้นตอนที่ 2: ตรวจสอบสถานะ

```bash
# ตรวจสอบ CronJob
kubectl get cronjob mongodb-backup -n baanlomnow

# ตรวจสอบ Jobs ที่รันแล้ว
kubectl get jobs -n baanlomnow | grep mongodb-backup

# ดู logs ของ job ล่าสุด
kubectl logs -n baanlomnow -l job-name=mongodb-backup-$(date +%Y%m%d) --tail=50
```

## 📥 การ Restore จาก Backup

### ดู Backup Files ที่มี

```bash
gsutil ls gs://baanlomnow-mongodb-backups/
```

### Restore จาก Backup

```bash
cd k8s
./restore-from-gcs.sh mongodb-backup-20251106_020000.tar.gz
```

## 🔧 Manual Backup

ถ้าต้องการ backup ทันที (ไม่ต้องรอ cron):

```bash
# 1. สร้าง Job จาก CronJob
kubectl create job --from=cronjob/mongodb-backup mongodb-backup-manual-$(date +%Y%m%d-%H%M%S) -n baanlomnow

# 2. ตรวจสอบสถานะ
kubectl get jobs -n baanlomnow | grep mongodb-backup-manual

# 3. ดู logs
kubectl logs -n baanlomnow -l job-name=mongodb-backup-manual-$(date +%Y%m%d-%H%M%S)
```

## ⚙️ การตั้งค่า

### เปลี่ยน Schedule

แก้ไขไฟล์ `mongodb-backup-cronjob.yaml`:

```yaml
spec:
  schedule: "0 2 * * *"  # เปลี่ยนตามต้องการ (Cron format)
```

ตัวอย่าง:
- `"0 2 * * *"` - ทุกวันเวลา 02:00 UTC
- `"0 */6 * * *"` - ทุก 6 ชั่วโมง
- `"0 0 * * 0"` - ทุกวันอาทิตย์เวลา 00:00 UTC

### เปลี่ยน Bucket Name

แก้ไขไฟล์ `mongodb-backup-cronjob.yaml`:

```yaml
env:
- name: GCS_BACKUP_BUCKET
  value: "your-bucket-name"
```

### เปลี่ยน Retention Period

แก้ไขไฟล์ `mongodb-backup-cronjob.yaml` ในส่วนลบ backup เก่า:

```bash
# เปลี่ยนจาก 30 วันเป็น 60 วัน
gsutil -m rm -r gs://${GCS_BUCKET}/mongodb-backup-$(date -d '60 days ago' +%Y%m%d)*
```

## 🔍 Troubleshooting

### ปัญหา: Backup ล้มเหลว

```bash
# ดู logs
kubectl logs -n baanlomnow -l job-name=mongodb-backup-YYYYMMDD

# ตรวจสอบ Service Account
kubectl get secret gcp-service-account-key -n baanlomnow

# ตรวจสอบ GCS bucket
gsutil ls gs://baanlomnow-mongodb-backups/
```

### ปัญหา: ไม่สามารถอัปโหลดไปยัง GCS

1. ตรวจสอบว่า Service Account มีสิทธิ์:
```bash
gsutil iam get gs://baanlomnow-mongodb-backups
```

2. ตรวจสอบว่า Secret ถูกสร้างแล้ว:
```bash
kubectl get secret gcp-service-account-key -n baanlomnow
```

3. ตรวจสอบว่า Secret มีข้อมูล:
```bash
kubectl get secret gcp-service-account-key -n baanlomnow -o jsonpath='{.data.key\.json}' | base64 -d
```

### ปัญหา: CronJob ไม่รัน

```bash
# ตรวจสอบ CronJob
kubectl describe cronjob mongodb-backup -n baanlomnow

# ตรวจสอบ Events
kubectl get events -n baanlomnow --sort-by='.lastTimestamp' | grep mongodb-backup
```

## 📊 Monitoring

### ตรวจสอบ Backup Size

```bash
gsutil du -sh gs://baanlomnow-mongodb-backups/
```

### ดูจำนวน Backup Files

```bash
gsutil ls gs://baanlomnow-mongodb-backups/ | wc -l
```

### ดู Backup ล่าสุด

```bash
gsutil ls -l gs://baanlomnow-mongodb-backups/ | tail -5
```

## 🔐 Security Best Practices

1. **ใช้ Workload Identity** (แนะนำสำหรับ production):
   - ลบ Service Account key
   - ใช้ Workload Identity binding แทน

2. **Encrypt Backup**:
   - เปิดใช้ encryption ที่ bucket level
   ```bash
   gsutil encryption set on gs://baanlomnow-mongodb-backups/
   ```

3. **Restrict Access**:
   - จำกัดการเข้าถึง GCS bucket ให้เฉพาะ Service Account ที่จำเป็น

## 📚 Related Documentation

- [Google Cloud Storage Documentation](https://cloud.google.com/storage/docs)
- [Kubernetes CronJob](https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/)
- [MongoDB Backup Strategies](https://docs.mongodb.com/manual/core/backups/)

