#!/bin/bash

set -e

if [ -z "$1" ]; then
    echo "❌ กรุณาระบุ backup file name จาก GCS"
    echo "Usage: ./restore-from-gcs.sh <backup-filename>"
    echo ""
    echo "📋 ดู backup files ที่มี:"
    echo "  gsutil ls gs://baanlomnow-mongodb-backups/"
    exit 1
fi

BACKUP_FILE="$1"
BUCKET_NAME="baanlomnow-mongodb-backups"
NAMESPACE="baanlomnow"
TEMP_DIR="./mongodb-restore-temp"

echo "🔄 MongoDB Restore from GCS"
echo ""

# ตรวจสอบว่า backup file มีอยู่
echo "🔍 ตรวจสอบ backup file..."
if ! gsutil ls gs://${BUCKET_NAME}/${BACKUP_FILE} &>/dev/null; then
    echo "❌ ไม่พบ backup file: gs://${BUCKET_NAME}/${BACKUP_FILE}"
    echo ""
    echo "📋 Backup files ที่มี:"
    gsutil ls gs://${BUCKET_NAME}/ | head -10
    exit 1
fi

echo "✅ พบ backup file: gs://${BUCKET_NAME}/${BACKUP_FILE}"
echo ""

# Download backup
echo "📥 กำลังดาวน์โหลด backup..."
mkdir -p ${TEMP_DIR}
gsutil cp gs://${BUCKET_NAME}/${BACKUP_FILE} ${TEMP_DIR}/ || {
    echo "❌ ไม่สามารถดาวน์โหลดได้"
    exit 1
}

# Extract backup
if [[ "$BACKUP_FILE" == *.tar.gz ]]; then
    echo "📦 กำลัง extract backup..."
    cd ${TEMP_DIR}
    tar -xzf ${BACKUP_FILE} || {
        echo "❌ ไม่สามารถ extract ได้"
        exit 1
    }
    RESTORE_DIR=$(find . -type d -name "baanlomnow" | head -1 | xargs dirname)
    cd ..
else
    RESTORE_DIR="${TEMP_DIR}/${BACKUP_FILE}"
fi

# Restore to MongoDB
echo "🔄 กำลัง restore ข้อมูล..."
POD_NAME=$(kubectl get pods -n ${NAMESPACE} -l app=mongodb -o jsonpath='{.items[0].metadata.name}')

if [ -z "$POD_NAME" ]; then
    echo "❌ ไม่พบ MongoDB pod"
    exit 1
fi

echo "📦 Pod: $POD_NAME"

# Copy backup ไปยัง pod
kubectl cp ${RESTORE_DIR} ${NAMESPACE}/${POD_NAME}:/tmp/restore || {
    echo "❌ ไม่สามารถอัปโหลด backup ได้"
    rm -rf ${TEMP_DIR}
    exit 1
}

# Restore
kubectl exec -n ${NAMESPACE} ${POD_NAME} -- mongorestore \
    --uri="mongodb://admin:bestbaanlomnow@localhost:27017/baanlomnow?authSource=admin" \
    --drop \
    /tmp/restore/baanlomnow || {
    echo "❌ ไม่สามารถ restore ได้"
    rm -rf ${TEMP_DIR}
    exit 1
}

# Cleanup
echo "🧹 กำลังลบไฟล์ชั่วคราว..."
kubectl exec -n ${NAMESPACE} ${POD_NAME} -- rm -rf /tmp/restore
rm -rf ${TEMP_DIR}

echo ""
echo "✅ Restore เสร็จสิ้น!"

# ตรวจสอบข้อมูล
echo ""
echo "🔍 ตรวจสอบข้อมูลที่ restore..."
USER_COUNT=$(kubectl exec -n ${NAMESPACE} ${POD_NAME} -- mongosh --quiet --eval "use baanlomnow; db.users.countDocuments()" 2>/dev/null || echo "0")
BOOKING_COUNT=$(kubectl exec -n ${NAMESPACE} ${POD_NAME} -- mongosh --quiet --eval "use baanlomnow; db.bookings.countDocuments()" 2>/dev/null || echo "0")
echo "📊 Users: $USER_COUNT"
echo "📊 Bookings: $BOOKING_COUNT"

