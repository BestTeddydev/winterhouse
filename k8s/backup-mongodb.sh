#!/bin/bash

set -e

NAMESPACE="baanlomnow"
BACKUP_DIR="./mongodb-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="mongodb-backup-$TIMESTAMP"

echo "💾 MongoDB Backup Script"
echo ""

# สร้าง backup directory
mkdir -p "$BACKUP_DIR"

# ตรวจสอบ MongoDB Pod
POD_NAME=$(kubectl get pods -n $NAMESPACE -l app=mongodb -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")

if [ -z "$POD_NAME" ]; then
    echo "❌ ไม่พบ MongoDB Pod!"
    exit 1
fi

echo "📦 MongoDB Pod: $POD_NAME"
echo ""

# สร้าง backup
echo "🔄 กำลังสร้าง backup..."
kubectl exec -n $NAMESPACE $POD_NAME -- mongodump \
    --uri="mongodb://admin:bestbaanlomnow@localhost:27017/baanlomnow?authSource=admin" \
    --out=/tmp/backup 2>/dev/null || {
    echo "❌ ไม่สามารถสร้าง backup ได้"
    exit 1
}

# Copy backup จาก pod
echo "📥 กำลังดาวน์โหลด backup..."
kubectl cp "$NAMESPACE/$POD_NAME:/tmp/backup" "$BACKUP_DIR/$BACKUP_NAME" 2>/dev/null || {
    echo "❌ ไม่สามารถดาวน์โหลด backup ได้"
    exit 1
}

# บีบอัด backup
echo "🗜️  กำลังบีบอัด backup..."
cd "$BACKUP_DIR"
tar -czf "$BACKUP_NAME.tar.gz" "$BACKUP_NAME" 2>/dev/null && rm -rf "$BACKUP_NAME" || {
    echo "⚠️  ไม่สามารถบีบอัดได้ แต่ backup ยังอยู่"
}

echo ""
echo "✅ Backup เสร็จสิ้น: $BACKUP_DIR/$BACKUP_NAME.tar.gz"
echo "📊 ตรวจสอบขนาด backup:"
ls -lh "$BACKUP_DIR/$BACKUP_NAME.tar.gz" 2>/dev/null || ls -lh "$BACKUP_DIR/$BACKUP_NAME"

