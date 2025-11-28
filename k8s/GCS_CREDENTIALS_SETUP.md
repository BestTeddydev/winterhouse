# สรุปการตั้งค่า GCS Credentials สำหรับ Upload รูปภาพ

## ✅ สิ่งที่ทำเสร็จแล้ว

1. **แก้ไข `src/lib/gcs.ts`**
   - รองรับ Application Default Credentials (ADC)
   - จะใช้ Workload Identity อัตโนมัติเมื่อไม่มี key file
   - รองรับทั้ง `GOOGLE_CLOUD_BUCKET_NAME` และ `GOOGLE_CLOUD_STORAGE_BUCKET`

2. **สร้าง GCP Service Account**
   - Name: `baanlomnow-storage-sa`
   - Email: `baanlomnow-storage-sa@project-14a6d9ab-7aaf-49a0-92d.iam.gserviceaccount.com`
   - Role: `roles/storage.objectAdmin` สำหรับ bucket `baanlomnow`

3. **สร้าง Kubernetes Service Account**
   - Name: `baanlomnow-sa`
   - Namespace: `baanlomnow`
   - Annotation: `iam.gke.io/gcp-service-account` = GCP SA email

4. **Bind Workload Identity**
   - Kubernetes SA ↔ GCP SA binding สำเร็จ
   - IAM Role: `roles/iam.workloadIdentityUser`

5. **เปิดใช้ Workload Identity**
   - Cluster: `baanlomnow-cluster`
   - Workload Pool: `project-14a6d9ab-7aaf-49a0-92d.svc.id.goog`
   - Node Pool: Updated เพื่อใช้ `GKE_METADATA`

6. **แก้ไข Deployment**
   - ใช้ Service Account: `baanlomnow-sa`
   - Environment variables สำหรับ GCS ถูกต้อง

## 🧪 ทดสอบ

หลังจาก pod พร้อมแล้ว:

```bash
# 1. ตรวจสอบ pod ใช้ Service Account ที่ถูกต้อง
kubectl get pods -n baanlomnow -l app=baanlomnow,component=app -o jsonpath='{.items[0].spec.serviceAccountName}'
# ควรได้: baanlomnow-sa

# 2. ทดสอบ upload รูปภาพผ่านหน้าเว็บ

# 3. ตรวจสอบ logs
kubectl logs -n baanlomnow -l app=baanlomnow,component=app --tail=50 | grep -i 'upload\|gcs\|storage\|error'
```

## 🔍 Troubleshooting

### ถ้ายังมีปัญหา 403 Forbidden:

1. **ตรวจสอบ Service Account**
   ```bash
   kubectl get pod -n baanlomnow <pod-name> -o jsonpath='{.spec.serviceAccountName}'
   # ควรได้: baanlomnow-sa
   ```

2. **ตรวจสอบ Workload Identity Binding**
   ```bash
   kubectl get serviceaccount baanlomnow-sa -n baanlomnow -o jsonpath='{.metadata.annotations.iam\.gke\.io/gcp-service-account}'
   # ควรได้: baanlomnow-storage-sa@project-14a6d9ab-7aaf-49a0-92d.iam.gserviceaccount.com
   ```

3. **ตรวจสอบ GCS Permissions**
   ```bash
   gsutil iam get gs://baanlomnow | grep baanlomnow-storage-sa
   ```

4. **ตรวจสอบ Node Pool Metadata**
   ```bash
   gcloud container node-pools describe default-pool \
     --cluster=baanlomnow-cluster \
     --zone=asia-southeast1-a \
     --format="value(config.workloadMetadataConfig.mode)"
   # ควรได้: GKE_METADATA
   ```

5. **Restart Pod**
   ```bash
   kubectl rollout restart deployment baanlomnow-app -n baanlomnow
   ```

## 📝 หมายเหตุ

- Workload Identity อาจใช้เวลาหลายนาทีหลังจาก update node pool
- Pod ต้องใช้ Service Account `baanlomnow-sa` ไม่ใช่ `default`
- Application Default Credentials จะทำงานอัตโนมัติเมื่อ Workload Identity พร้อม

