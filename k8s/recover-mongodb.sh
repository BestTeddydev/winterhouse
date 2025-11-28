#!/bin/bash

set -e

NAMESPACE="baanlomnow"

echo "🔄 MongoDB Recovery Script"
echo ""

# 1. ตรวจสอบสถานะ
echo "📦 ตรวจสอบ MongoDB Pod..."
POD_NAME=$(kubectl get pods -n $NAMESPACE -l app=mongodb -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")

if [ -z "$POD_NAME" ]; then
    echo "❌ ไม่พบ MongoDB Pod!"
    echo ""
    echo "🔧 กำลังพยายามแก้ไข..."
    
    # ตรวจสอบ PVC
    echo "📂 ตรวจสอบ PersistentVolumeClaim..."
    kubectl get pvc -n $NAMESPACE | grep mongodb || echo "⚠️  ไม่พบ PVC"
    
    # ตรวจสอบว่า PVC ถูก bind หรือไม่
    PVC_STATUS=$(kubectl get pvc -n $NAMESPACE mongodb-pvc -o jsonpath='{.status.phase}' 2>/dev/null || echo "NotFound")
    
    if [ "$PVC_STATUS" != "Bound" ]; then
        echo "⚠️  PVC ไม่ได้ bind: $PVC_STATUS"
        echo ""
        echo "🔧 กำลังรีสตาร์ท MongoDB deployment..."
        kubectl delete deployment mongodb -n $NAMESPACE 2>/dev/null || true
        kubectl apply -f k8s/mongodb.yaml
        echo "⏳ รอให้ MongoDB pod เริ่มทำงาน..."
        kubectl wait --for=condition=ready pod -l app=mongodb -n $NAMESPACE --timeout=300s || echo "⚠️  Timeout"
    fi
    
    POD_NAME=$(kubectl get pods -n $NAMESPACE -l app=mongodb -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
    
    if [ -z "$POD_NAME" ]; then
        echo "❌ ยังไม่สามารถสร้าง Pod ได้"
        exit 1
    fi
fi

echo "✅ MongoDB Pod: $POD_NAME"
echo ""

# 2. ตรวจสอบว่ามีข้อมูลหรือไม่
echo "🔍 ตรวจสอบข้อมูลใน MongoDB..."
DATABASES=$(kubectl exec -n $NAMESPACE $POD_NAME -- mongosh --quiet --eval "db.adminCommand('listDatabases')" 2>/dev/null || echo "{}")

if echo "$DATABASES" | grep -q "baanlomnow"; then
    echo "✅ พบ database 'baanlomnow'"
    
    # ตรวจสอบ collections
    COLLECTIONS=$(kubectl exec -n $NAMESPACE $POD_NAME -- mongosh --quiet --eval "use baanlomnow; db.getCollectionNames()" 2>/dev/null || echo "[]")
    echo "📁 Collections: $COLLECTIONS"
    
    # ตรวจสอบจำนวน documents
    USER_COUNT=$(kubectl exec -n $NAMESPACE $POD_NAME -- mongosh --quiet --eval "use baanlomnow; db.users.countDocuments()" 2>/dev/null || echo "0")
    BOOKING_COUNT=$(kubectl exec -n $NAMESPACE $POD_NAME -- mongosh --quiet --eval "use baanlomnow; db.bookings.countDocuments()" 2>/dev/null || echo "0")
    
    echo "📊 Users: $USER_COUNT"
    echo "📊 Bookings: $BOOKING_COUNT"
    
    if [ "$USER_COUNT" = "0" ] && [ "$BOOKING_COUNT" = "0" ]; then
        echo "⚠️  ข้อมูลหายไป! กำลังตรวจสอบ volume..."
        
        # ตรวจสอบ volume
        echo "📂 ตรวจสอบข้อมูลใน volume..."
        kubectl exec -n $NAMESPACE $POD_NAME -- ls -lah /data/db 2>/dev/null || echo "❌ ไม่สามารถเข้าถึง volume ได้"
        
        echo ""
        echo "💡 วิธีแก้ไข:"
        echo "1. ตรวจสอบว่า PVC ยังมีข้อมูลอยู่หรือไม่"
        echo "2. ตรวจสอบว่า pod ถูก recreate หรือไม่"
        echo "3. ตรวจสอบ backup ถ้ามี"
        echo ""
        echo "🔧 กำลังตรวจสอบ PVC details..."
        kubectl describe pvc mongodb-pvc -n $NAMESPACE
    else
        echo "✅ ข้อมูลยังอยู่ใน MongoDB"
    fi
else
    echo "❌ ไม่พบ database 'baanlomnow'"
    echo ""
    echo "💡 วิธีแก้ไข:"
    echo "1. ตรวจสอบว่า PVC ยังมีข้อมูลอยู่หรือไม่"
    echo "2. ตรวจสอบ backup"
    echo "3. MongoDB อาจถูก recreate ทำให้ข้อมูลหายไป"
fi

echo ""
echo "✅ การตรวจสอบเสร็จสิ้น"

