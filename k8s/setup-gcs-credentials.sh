#!/bin/bash

set -e

PROJECT_ID=$(gcloud config get-value project 2>/dev/null || echo "")
NAMESPACE="baanlomnow"
KSA_NAME="baanlomnow-sa"
SERVICE_ACCOUNT_NAME="baanlomnow-storage-sa"
GSA_NAME="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

if [ -z "$PROJECT_ID" ]; then
    echo "❌ ไม่พบ GCP Project ID"
    echo "   กรุณา run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "🔧 MongoDB Backup Setup (Workload Identity) สำหรับ Google Kubernetes Engine"
echo ""
echo "📋 การตั้งค่า:"
echo "  Project ID: $PROJECT_ID"
echo "  Namespace: $NAMESPACE"
echo "  KSA: $KSA_NAME"
echo "  GSA: $GSA_NAME"
echo ""

# 1. สร้าง GCP Service Account (ถ้ายังไม่มี)
echo "👤 ตรวจสอบ GCP Service Account..."
if ! gcloud iam service-accounts describe ${GSA_NAME} &>/dev/null; then
    echo "  กำลังสร้าง Service Account..."
    gcloud iam service-accounts create ${SERVICE_ACCOUNT_NAME} \
        --display-name="Baanlomnow Storage Service Account" \
        --description="Service account for app to access GCS" \
        --project=${PROJECT_ID}
    echo "✅ Service Account สร้างสำเร็จ"
    sleep 3
else
    echo "✅ Service Account มีอยู่แล้ว"
fi

# 2. ให้สิทธิ์ Service Account เข้าถึง GCS bucket
echo ""
echo "🔐 กำลังให้สิทธิ์ Service Account เข้าถึง GCS..."
BUCKET_NAME=$(kubectl get secret baanlomnow-secrets -n ${NAMESPACE} -o jsonpath='{.data.GOOGLE_CLOUD_BUCKET_NAME}' 2>/dev/null | base64 -d || echo "baanlomnow-storage")
echo "  Bucket: $BUCKET_NAME"
gsutil iam ch serviceAccount:${GSA_NAME}:roles/storage.objectAdmin gs://${BUCKET_NAME} || {
    echo "  ⚠️  ไม่สามารถให้สิทธิ์ได้ (อาจมีอยู่แล้ว)"
}

# 3. สร้าง Kubernetes Service Account
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
EOF
echo "✅ Kubernetes Service Account สร้างสำเร็จ"

# 4. Bind Kubernetes Service Account กับ GCP Service Account
echo ""
echo "🔗 กำลัง bind Kubernetes Service Account กับ GCP Service Account..."
gcloud iam service-accounts add-iam-policy-binding ${GSA_NAME} \
    --role roles/iam.workloadIdentityUser \
    --member "serviceAccount:${PROJECT_ID}.svc.id.goog[${NAMESPACE}/${KSA_NAME}]" \
    --project=${PROJECT_ID} || {
    echo "  ⚠️  อาจ bind ไปแล้ว"
}

echo ""
echo "✅ การตั้งค่าเสร็จสิ้น!"
echo ""
echo "📋 สรุป:"
echo "  - GCP Service Account: ${GSA_NAME}"
echo "  - Kubernetes Service Account: ${KSA_NAME}"
echo "  - GCS Bucket: gs://${BUCKET_NAME}"
echo ""
echo "🔄 Restart deployment เพื่อใช้ credentials ใหม่:"
echo "  kubectl rollout restart deployment baanlomnow-app -n ${NAMESPACE}"

