#!/bin/bash

set -e

PROJECT_ID=$(gcloud config get-value project 2>/dev/null || echo "")
BUCKET_NAME="baanlomnow-mongodb-backups"
NAMESPACE="baanlomnow"
SERVICE_ACCOUNT_NAME="mongodb-backup-sa"
KSA_NAME="mongodb-backup-sa"  # Kubernetes Service Account name
GSA_NAME="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo "🔧 MongoDB Backup Setup (Workload Identity) สำหรับ Google Kubernetes Engine"
echo ""

# ตรวจสอบว่า project ID ถูกตั้งค่าหรือไม่
if [ -z "$PROJECT_ID" ]; then
    echo "❌ ไม่พบ GCP Project ID"
    echo "   กรุณา run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "📋 การตั้งค่า:"
echo "  Project ID: $PROJECT_ID"
echo "  Bucket Name: $BUCKET_NAME"
echo "  Namespace: $NAMESPACE"
echo "  GSA: $GSA_NAME"
echo "  KSA: $KSA_NAME"
echo ""

# 1. สร้าง GCS bucket (ถ้ายังไม่มี)
echo "🪣 ตรวจสอบ GCS bucket..."
if ! gsutil ls -b gs://${BUCKET_NAME} &>/dev/null; then
    echo "  กำลังสร้าง bucket..."
    gsutil mb -p ${PROJECT_ID} -l asia-southeast1 gs://${BUCKET_NAME} || {
        echo "  ⚠️  ไม่สามารถสร้าง bucket ได้ (อาจมีอยู่แล้ว)"
    }
    echo "✅ Bucket สร้างสำเร็จ"
else
    echo "✅ Bucket มีอยู่แล้ว"
fi

# 2. สร้าง Service Account สำหรับ backup (ถ้ายังไม่มี)
echo ""
echo "👤 ตรวจสอบ Service Account..."
if ! gcloud iam service-accounts describe ${GSA_NAME} &>/dev/null; then
    echo "  กำลังสร้าง Service Account..."
    gcloud iam service-accounts create ${SERVICE_ACCOUNT_NAME} \
        --display-name="MongoDB Backup Service Account" \
        --description="Service account for MongoDB backup CronJob" \
        --project=${PROJECT_ID} || {
        echo "  ⚠️  Service Account อาจมีอยู่แล้ว"
    }
    echo "✅ Service Account สร้างสำเร็จ"
    # รอให้ Service Account พร้อม
    sleep 5
else
    echo "✅ Service Account มีอยู่แล้ว"
fi

# 3. ให้สิทธิ์ Service Account เข้าถึง GCS bucket
echo ""
echo "🔐 กำลังให้สิทธิ์ Service Account..."
gsutil iam ch serviceAccount:${GSA_NAME}:objectAdmin gs://${BUCKET_NAME} || {
    echo "  ⚠️  ไม่สามารถให้สิทธิ์ได้"
}

# 4. เปิดใช้ Workload Identity ใน cluster
echo ""
echo "🔧 ตรวจสอบ Workload Identity..."
CLUSTER_NAME=$(gcloud container clusters list --format="value(name)" --filter="status:RUNNING" | head -1)
CLUSTER_ZONE=$(gcloud container clusters list --format="value(zone)" --filter="status:RUNNING" | head -1)

if [ -z "$CLUSTER_NAME" ]; then
    echo "⚠️  ไม่พบ cluster - ต้องเปิดใช้ Workload Identity ด้วยตนเอง"
else
    echo "  Cluster: $CLUSTER_NAME"
    echo "  Zone: $CLUSTER_ZONE"
    
    # ตรวจสอบว่า Workload Identity เปิดอยู่หรือไม่
    WORKLOAD_IDENTITY_ENABLED=$(gcloud container clusters describe ${CLUSTER_NAME} --zone=${CLUSTER_ZONE} --format="value(workloadIdentityConfig.workloadPool)" 2>/dev/null || echo "")
    
    if [ -z "$WORKLOAD_IDENTITY_ENABLED" ]; then
        echo "  ⚠️  Workload Identity ยังไม่เปิดใช้"
        echo "  💡 ต้องเปิดใช้ Workload Identity ใน cluster ก่อน"
        echo "     ดู: https://cloud.google.com/kubernetes-engine/docs/how-to/workload-identity"
    else
        echo "  ✅ Workload Identity เปิดใช้แล้ว"
    fi
fi

# 5. สร้าง Kubernetes Service Account
echo ""
echo "🔧 กำลังสร้าง Kubernetes Service Account..."
kubectl apply -f - <<EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: ${KSA_NAME}
  namespace: ${NAMESPACE}
  annotations:
    iam.gke.io/gcp-service-account: ${GSA_NAME}
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: mongodb-backup-role
  namespace: ${NAMESPACE}
rules:
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: mongodb-backup-binding
  namespace: ${NAMESPACE}
subjects:
- kind: ServiceAccount
  name: ${KSA_NAME}
  namespace: ${NAMESPACE}
roleRef:
  kind: Role
  name: mongodb-backup-role
  apiGroup: rbac.authorization.k8s.io
EOF

echo "✅ Kubernetes Service Account สร้างสำเร็จ"

# 6. Bind Kubernetes Service Account กับ GCP Service Account
echo ""
echo "🔗 กำลัง bind Kubernetes Service Account กับ GCP Service Account..."
gcloud iam service-accounts add-iam-policy-binding ${GSA_NAME} \
    --role roles/iam.workloadIdentityUser \
    --member "serviceAccount:${PROJECT_ID}.svc.id.goog[${NAMESPACE}/${KSA_NAME}]" \
    --project=${PROJECT_ID} || {
    echo "  ⚠️  อาจ bind ไปแล้ว หรือ Workload Identity ยังไม่เปิดใช้"
}

# 7. สร้าง CronJob
echo ""
echo "⏰ กำลังสร้าง CronJob..."
kubectl apply -f k8s/mongodb-backup-workload-identity.yaml

echo ""
echo "✅ การตั้งค่าเสร็จสิ้น!"
echo ""
echo "📋 สรุป:"
echo "  - GCS Bucket: gs://${BUCKET_NAME}"
echo "  - Backup Schedule: ทุกวันเวลา 02:00 UTC (09:00 เวลาไทย)"
echo "  - Retention: เก็บ backup 30 วัน"
echo "  - Authentication: Workload Identity"
echo ""
echo "📊 ตรวจสอบสถานะ:"
echo "  kubectl get cronjob mongodb-backup -n ${NAMESPACE}"
echo "  kubectl get jobs -n ${NAMESPACE} | grep mongodb-backup"
echo ""
echo "📥 ดู backup files:"
echo "  gsutil ls gs://${BUCKET_NAME}/"
echo ""
echo "🔄 Restore จาก backup:"
echo "  ./k8s/restore-from-gcs.sh mongodb-backup-YYYYMMDD_HHMMSS.tar.gz"

