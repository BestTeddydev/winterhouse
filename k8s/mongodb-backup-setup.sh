#!/bin/bash

set -e

PROJECT_ID=$(gcloud config get-value project 2>/dev/null || echo "")
BUCKET_NAME="baanlomnow-mongodb-backups"
NAMESPACE="baanlomnow"
SERVICE_ACCOUNT_NAME="mongodb-backup-sa"

echo "🔧 MongoDB Backup Setup สำหรับ Google Kubernetes Engine"
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

# 2. สร้าง Service Account สำหรับ backup
echo ""
echo "👤 ตรวจสอบ Service Account..."
if ! gcloud iam service-accounts describe ${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com &>/dev/null; then
    echo "  กำลังสร้าง Service Account..."
    gcloud iam service-accounts create ${SERVICE_ACCOUNT_NAME} \
        --display-name="MongoDB Backup Service Account" \
        --description="Service account for MongoDB backup CronJob" \
        --project=${PROJECT_ID} || {
        echo "  ⚠️  Service Account อาจมีอยู่แล้ว"
    }
    echo "✅ Service Account สร้างสำเร็จ"
else
    echo "✅ Service Account มีอยู่แล้ว"
fi

# 3. ให้สิทธิ์ Service Account เข้าถึง GCS bucket
echo ""
echo "🔐 กำลังให้สิทธิ์ Service Account..."
gsutil iam ch serviceAccount:${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com:objectAdmin gs://${BUCKET_NAME} || {
    echo "  ⚠️  ไม่สามารถให้สิทธิ์ได้ (อาจให้ไปแล้ว)"
}

# 4. สร้าง Kubernetes Secret สำหรับ Service Account key
echo ""
echo "🔑 กำลังสร้าง Kubernetes Secret..."
if ! kubectl get secret gcp-service-account-key -n ${NAMESPACE} &>/dev/null; then
    echo "  กำลังสร้าง key..."
    gcloud iam service-accounts keys create /tmp/gcp-key.json \
        --iam-account=${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com \
        --project=${PROJECT_ID}
    
    echo "  กำลังสร้าง Kubernetes secret..."
    kubectl create secret generic gcp-service-account-key \
        --from-file=key.json=/tmp/gcp-key.json \
        -n ${NAMESPACE}
    
    # ลบไฟล์ key หลังสร้าง secret
    rm -f /tmp/gcp-key.json
    echo "✅ Secret สร้างสำเร็จ"
else
    echo "✅ Secret มีอยู่แล้ว"
fi

# 5. สร้าง Kubernetes Service Account
echo ""
echo "🔧 กำลังสร้าง Kubernetes Service Account..."
kubectl apply -f - <<EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: ${SERVICE_ACCOUNT_NAME}
  namespace: ${NAMESPACE}
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
  name: ${SERVICE_ACCOUNT_NAME}
  namespace: ${NAMESPACE}
roleRef:
  kind: Role
  name: mongodb-backup-role
  apiGroup: rbac.authorization.k8s.io
EOF

echo "✅ Kubernetes Service Account สร้างสำเร็จ"

# 6. สร้าง CronJob
echo ""
echo "⏰ กำลังสร้าง CronJob..."
kubectl apply -f k8s/mongodb-backup-cronjob.yaml

echo ""
echo "✅ การตั้งค่าเสร็จสิ้น!"
echo ""
echo "📋 สรุป:"
echo "  - GCS Bucket: gs://${BUCKET_NAME}"
echo "  - Backup Schedule: ทุกวันเวลา 02:00 UTC (09:00 เวลาไทย)"
echo "  - Retention: เก็บ backup 30 วัน"
echo ""
echo "📊 ตรวจสอบสถานะ:"
echo "  kubectl get cronjob mongodb-backup -n ${NAMESPACE}"
echo "  kubectl get jobs -n ${NAMESPACE} | grep mongodb-backup"
echo ""
echo "📥 ดู backup files:"
echo "  gsutil ls gs://${BUCKET_NAME}/"
echo ""
echo "🔄 Restore จาก backup:"
echo "  gsutil cp gs://${BUCKET_NAME}/mongodb-backup-YYYYMMDD_HHMMSS.tar.gz ./"
echo "  ./k8s/restore-mongodb.sh ./mongodb-backup-YYYYMMDD_HHMMSS.tar.gz"

