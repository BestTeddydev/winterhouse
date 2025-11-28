# เปิดใช้ Workload Identity สำหรับ GKE Cluster

CLUSTER_NAME="baanlomnow-cluster"
CLUSTER_ZONE="asia-southeast1-a"
PROJECT_ID="project-14a6d9ab-7aaf-49a0-92d"

echo "🔧 กำลังเปิดใช้ Workload Identity..."
echo "⚠️  การดำเนินการนี้อาจใช้เวลาหลายนาที และอาจทำให้ cluster restart บางส่วน"

gcloud container clusters update ${CLUSTER_NAME} \
    --zone=${CLUSTER_ZONE} \
    --workload-pool=${PROJECT_ID}.svc.id.goog \
    --project=${PROJECT_ID}

echo ""
echo "✅ เปิดใช้ Workload Identity สำเร็จ!"
echo ""
echo "🔄 Restart node pool เพื่อให้ใช้ Workload Identity:"
echo "   gcloud container node-pools update default-pool --cluster=${CLUSTER_NAME} --zone=${CLUSTER_ZONE} --workload-metadata=GKE_METADATA"

