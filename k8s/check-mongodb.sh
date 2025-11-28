#!/bin/bash

set -e

NAMESPACE="baanlomnow"

echo "🔍 ตรวจสอบสถานะ MongoDB..."
echo ""

# 1. ตรวจสอบ MongoDB Pod
echo "📦 MongoDB Pod Status:"
kubectl get pods -n $NAMESPACE -l app=mongodb
echo ""

# 2. ตรวจสอบ PersistentVolumeClaim
echo "💾 PersistentVolumeClaim Status:"
kubectl get pvc -n $NAMESPACE | grep mongodb
echo ""

# 3. ตรวจสอบ PersistentVolume
echo "📂 PersistentVolume:"
kubectl get pv | grep mongodb
echo ""

# 4. ตรวจสอบ MongoDB Logs
echo "📋 MongoDB Logs (last 50 lines):"
kubectl logs -n $NAMESPACE -l app=mongodb --tail=50
echo ""

# 5. ตรวจสอบ Events
echo "⚠️  Recent Events:"
kubectl get events -n $NAMESPACE --sort-by='.lastTimestamp' | grep mongodb | tail -10
echo ""

# 6. ตรวจสอบว่ามีข้อมูลใน MongoDB หรือไม่
echo "🔍 ตรวจสอบข้อมูลใน MongoDB..."
POD_NAME=$(kubectl get pods -n $NAMESPACE -l app=mongodb -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")

if [ -z "$POD_NAME" ]; then
    echo "❌ ไม่พบ MongoDB Pod!"
    exit 1
fi

echo "📊 Pod: $POD_NAME"
echo ""

# ตรวจสอบว่ามี databases หรือไม่
echo "📚 Databases:"
kubectl exec -n $NAMESPACE $POD_NAME -- mongosh --quiet --eval "db.adminCommand('listDatabases')" 2>/dev/null || echo "❌ ไม่สามารถเชื่อมต่อ MongoDB ได้"
echo ""

# ตรวจสอบ collections ใน baanlomnow database
echo "📁 Collections in 'baanlomnow' database:"
kubectl exec -n $NAMESPACE $POD_NAME -- mongosh --quiet --eval "use baanlomnow; db.getCollectionNames()" 2>/dev/null || echo "❌ ไม่พบ database 'baanlomnow'"
echo ""

# ตรวจสอบจำนวน documents ในแต่ละ collection
echo "📊 Document Counts:"
for collection in users bookings rooms payments buildings employeeattendances; do
    count=$(kubectl exec -n $NAMESPACE $POD_NAME -- mongosh --quiet --eval "use baanlomnow; db.$collection.countDocuments()" 2>/dev/null || echo "0")
    echo "  - $collection: $count"
done
echo ""

# 7. ตรวจสอบข้อมูลใน volume
echo "📂 ตรวจสอบข้อมูลใน Volume (/data/db):"
kubectl exec -n $NAMESPACE $POD_NAME -- ls -lah /data/db 2>/dev/null || echo "❌ ไม่สามารถเข้าถึง volume ได้"
echo ""

echo "✅ การตรวจสอบเสร็จสิ้น"

