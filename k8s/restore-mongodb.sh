#!/bin/bash

set -e

NAMESPACE="baanlomnow"

if [ -z "$1" ]; then
    echo "❌ กรุณาระบุ path ของ backup file"
    echo "Usage: ./restore-mongodb.sh <backup-file-path>"
    echo "Example: ./restore-mongodb.sh ./mongodb-backups/mongodb-backup-20240101_120000.tar.gz"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ] && [ ! -d "$BACKUP_FILE" ]; then
    echo "❌ ไม่พบ backup file: $BACKUP_FILE"
    exit 1
fi

echo "🔄 MongoDB Restore Script"
echo ""

# ตรวจสอบ MongoDB Pod
POD_NAME=$(kubectl get pods -n $NAMESPACE -l app=mongodb -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")

if [ -z "$POD_NAME" ]; then
    echo "❌ ไม่พบ MongoDB Pod!"
    exit 1
fi

echo "📦 MongoDB Pod: $POD_NAME"
echo ""

# ถ้าเป็นไฟล์ tar.gz ให้ extract ก่อน
RESTORE_DIR=""
if [[ "$BACKUP_FILE" == *.tar.gz ]]; then
    echo "📦 กำลัง extract backup file..."
    EXTRACT_DIR="./mongodb-restore-temp"
    mkdir -p "$EXTRACT_DIR"
    tar -xzf "$BACKUP_FILE" -C "$EXTRACT_DIR" || {
        echo "❌ ไม่สามารถ extract backup ได้"
        exit 1
    }
    RESTORE_DIR=$(find "$EXTRACT_DIR" -type d -name "baanlomnow" | head -1 | xargs dirname)
else
    RESTORE_DIR="$BACKUP_FILE"
fi

if [ -z "$RESTORE_DIR" ] || [ ! -d "$RESTORE_DIR" ]; then
    echo "❌ ไม่พบ backup directory"
    exit 1
fi

echo "📂 Backup directory: $RESTORE_DIR"
echo ""

# Copy backup ไปยัง pod
echo "📤 กำลังอัปโหลด backup ไปยัง pod..."
kubectl cp "$RESTORE_DIR" "$NAMESPACE/$POD_NAME:/tmp/restore" 2>/dev/null || {
    echo "❌ ไม่สามารถอัปโหลด backup ได้"
    [ -d "$EXTRACT_DIR" ] && rm -rf "$EXTRACT_DIR"
    exit 1
}

# Restore
echo "🔄 กำลัง restore ข้อมูล..."
kubectl exec -n $NAMESPACE $POD_NAME -- mongorestore \
    --uri="mongodb://admin:bestbaanlomnow@localhost:27017/baanlomnow?authSource=admin" \
    --drop \
    /tmp/restore/baanlomnow 2>/dev/null || {
    echo "❌ ไม่สามารถ restore ได้"
    [ -d "$EXTRACT_DIR" ] && rm -rf "$EXTRACT_DIR"
    exit 1
}

# Cleanup
echo "🧹 กำลังลบไฟล์ชั่วคราว..."
kubectl exec -n $NAMESPACE $POD_NAME -- rm -rf /tmp/restore 2>/dev/null || true
[ -d "$EXTRACT_DIR" ] && rm -rf "$EXTRACT_DIR"

echo ""
echo "✅ Restore เสร็จสิ้น!"

# ตรวจสอบข้อมูล
echo ""
echo "🔍 ตรวจสอบข้อมูลที่ restore..."
USER_COUNT=$(kubectl exec -n $NAMESPACE $POD_NAME -- mongosh --quiet --eval "use baanlomnow; db.users.countDocuments()" 2>/dev/null || echo "0")
BOOKING_COUNT=$(kubectl exec -n $NAMESPACE $POD_NAME -- mongosh --quiet --eval "use baanlomnow; db.bookings.countDocuments()" 2>/dev/null || echo "0")
echo "📊 Users: $USER_COUNT"
echo "📊 Bookings: $BOOKING_COUNT"

