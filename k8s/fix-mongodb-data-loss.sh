#!/bin/bash

set -e

NAMESPACE="baanlomnow"

echo "🔧 MongoDB Data Loss Recovery Script"
echo ""

# 1. ตรวจสอบว่ามี backup หรือไม่
echo "🔍 ตรวจสอบ backup..."
if [ -d "./mongodb-backups" ] && [ "$(ls -A ./mongodb-backups 2>/dev/null)" ]; then
    echo "✅ พบ backup files:"
    ls -lh ./mongodb-backups/
    echo ""
    read -p "ต้องการ restore จาก backup หรือไม่? (y/n): " restore_choice
    if [ "$restore_choice" = "y" ]; then
        LATEST_BACKUP=$(ls -t ./mongodb-backups/*.tar.gz 2>/dev/null | head -1)
        if [ -n "$LATEST_BACKUP" ]; then
            echo "📦 ใช้ backup: $LATEST_BACKUP"
            RESTORE_BACKUP="$LATEST_BACKUP"
        else
            LATEST_BACKUP=$(ls -td ./mongodb-backups/*/ 2>/dev/null | head -1)
            if [ -n "$LATEST_BACKUP" ]; then
                echo "📦 ใช้ backup: $LATEST_BACKUP"
                RESTORE_BACKUP="$LATEST_BACKUP"
            fi
        fi
    fi
else
    echo "⚠️  ไม่พบ backup files"
    RESTORE_BACKUP=""
fi

echo ""

# 2. ตรวจสอบ namespace
echo "📦 ตรวจสอบ namespace..."
if ! kubectl get namespace $NAMESPACE &>/dev/null; then
    echo "❌ ไม่พบ namespace: $NAMESPACE"
    exit 1
fi
echo "✅ Namespace: $NAMESPACE"
echo ""

# 3. ตรวจสอบ secrets
echo "🔐 ตรวจสอบ secrets..."
if ! kubectl get secret baanlomnow-secrets -n $NAMESPACE &>/dev/null; then
    echo "❌ ไม่พบ secret: baanlomnow-secrets"
    echo "⚠️  ต้องสร้าง secret ก่อน!"
    exit 1
fi
echo "✅ Secret: baanlomnow-secrets"
echo ""

# 4. ลบ deployment เก่า (ถ้ามี)
echo "🗑️  ลบ deployment เก่า (ถ้ามี)..."
kubectl delete deployment mongodb -n $NAMESPACE 2>/dev/null || echo "  ไม่มี deployment เก่า"
kubectl delete service mongodb-service -n $NAMESPACE 2>/dev/null || echo "  ไม่มี service เก่า"
echo ""

# 5. ลบ PVC เก่า (ถ้ามี แต่ระวัง!)
echo "⚠️  ตรวจสอบ PVC เก่า..."
EXISTING_PVC=$(kubectl get pvc mongodb-pvc -n $NAMESPACE -o jsonpath='{.metadata.name}' 2>/dev/null || echo "")
if [ -n "$EXISTING_PVC" ]; then
    echo "⚠️  พบ PVC เก่า: mongodb-pvc"
    read -p "ต้องการลบ PVC เก่าและสร้างใหม่หรือไม่? (y/n): " delete_pvc
    if [ "$delete_pvc" = "y" ]; then
        echo "🗑️  กำลังลบ PVC เก่า..."
        kubectl delete pvc mongodb-pvc -n $NAMESPACE
        echo "  ⏳ รอให้ PVC ถูกลบ..."
        sleep 5
    else
        echo "  ⏭️  ข้ามการลบ PVC"
    fi
else
    echo "  ไม่พบ PVC เก่า"
fi
echo ""

# 6. สร้าง PVC ใหม่
echo "📦 กำลังสร้าง PVC ใหม่..."
kubectl apply -f - <<EOF
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mongodb-pvc
  namespace: $NAMESPACE
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
  storageClassName: standard-rwo
EOF

echo "  ⏳ รอให้ PVC bind..."
kubectl wait --for=condition=Bound pvc/mongodb-pvc -n $NAMESPACE --timeout=60s || {
    echo "  ⚠️  PVC bind timeout"
    kubectl describe pvc mongodb-pvc -n $NAMESPACE
    exit 1
}
echo "✅ PVC สร้างสำเร็จ"
echo ""

# 7. สร้าง MongoDB deployment
echo "🚀 กำลังสร้าง MongoDB deployment..."
kubectl apply -f k8s/mongodb-fix.yaml || {
    echo "❌ ไม่สามารถสร้าง deployment ได้"
    exit 1
}

echo "  ⏳ รอให้ MongoDB pod เริ่มทำงาน..."
kubectl wait --for=condition=ready pod -l app=mongodb -n $NAMESPACE --timeout=300s || {
    echo "  ⚠️  Pod startup timeout"
    kubectl logs -n $NAMESPACE -l app=mongodb --tail=50
    exit 1
}
echo "✅ MongoDB pod ทำงานแล้ว"
echo ""

# 8. รอให้ MongoDB พร้อมรับ connection
echo "⏳ รอให้ MongoDB พร้อม..."
sleep 10

# 9. ตรวจสอบข้อมูล
echo "🔍 ตรวจสอบข้อมูลใน MongoDB..."
POD_NAME=$(kubectl get pods -n $NAMESPACE -l app=mongodb -o jsonpath='{.items[0].metadata.name}')
DATABASES=$(kubectl exec -n $NAMESPACE $POD_NAME -- mongosh --quiet --eval "db.adminCommand('listDatabases')" 2>/dev/null || echo "{}")

if echo "$DATABASES" | grep -q "baanlomnow"; then
    echo "✅ พบ database 'baanlomnow'"
    USER_COUNT=$(kubectl exec -n $NAMESPACE $POD_NAME -- mongosh --quiet --eval "use baanlomnow; db.users.countDocuments()" 2>/dev/null || echo "0")
    BOOKING_COUNT=$(kubectl exec -n $NAMESPACE $POD_NAME -- mongosh --quiet --eval "use baanlomnow; db.bookings.countDocuments()" 2>/dev/null || echo "0")
    echo "  📊 Users: $USER_COUNT"
    echo "  📊 Bookings: $BOOKING_COUNT"
    
    if [ "$USER_COUNT" = "0" ] && [ "$BOOKING_COUNT" = "0" ]; then
        echo "  ⚠️  ข้อมูลหายไป!"
        if [ -n "$RESTORE_BACKUP" ]; then
            echo ""
            echo "🔄 กำลัง restore จาก backup..."
            ./restore-mongodb.sh "$RESTORE_BACKUP"
        else
            echo ""
            echo "💡 ไม่มี backup ให้ restore"
            echo "   ต้องสร้างข้อมูลใหม่"
        fi
    fi
else
    echo "⚠️  ไม่พบ database 'baanlomnow'"
    if [ -n "$RESTORE_BACKUP" ]; then
        echo ""
        echo "🔄 กำลัง restore จาก backup..."
        ./restore-mongodb.sh "$RESTORE_BACKUP"
    else
        echo ""
        echo "💡 ไม่มี backup ให้ restore"
        echo "   MongoDB จะสร้าง database ใหม่เมื่อมีการเชื่อมต่อครั้งแรก"
    fi
fi

echo ""
echo "✅ การแก้ไขเสร็จสิ้น!"
echo ""
echo "📋 สถานะปัจจุบัน:"
kubectl get pods -n $NAMESPACE -l app=mongodb
kubectl get pvc -n $NAMESPACE mongodb-pvc

