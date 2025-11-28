# วิธีที่ 2: ใช้ Service Account Key File (ถ้าไม่สามารถเปิดใช้ Workload Identity ได้)

# สร้าง Service Account key และเก็บเป็น Kubernetes Secret
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
SERVICE_ACCOUNT_NAME="baanlomnow-storage-sa"
GSA_NAME="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
SECRET_NAME="gcs-service-account-key"
NAMESPACE="baanlomnow"

echo "🔑 กำลังสร้าง Service Account key..."

# สร้าง key file ชั่วคราว
KEY_FILE="/tmp/gcs-key.json"
gcloud iam service-accounts keys create ${KEY_FILE} \
    --iam-account=${GSA_NAME} \
    --project=${PROJECT_ID}

# สร้าง Kubernetes Secret
echo "📦 กำลังสร้าง Kubernetes Secret..."
kubectl create secret generic ${SECRET_NAME} \
    --from-file=key.json=${KEY_FILE} \
    --namespace=${NAMESPACE} \
    --dry-run=client -o yaml | kubectl apply -f -

# ลบ key file ชั่วคราว
rm -f ${KEY_FILE}

echo "✅ สร้าง Secret สำเร็จ!"
echo ""
echo "📝 ต้องแก้ไข deployment เพื่อ mount secret และตั้งค่า GOOGLE_CLOUD_KEY_FILE:"
echo "   - เพิ่ม volume:"
echo "     volumes:"
echo "     - name: gcs-key"
echo "       secret:"
echo "         secretName: ${SECRET_NAME}"
echo ""
echo "   - เพิ่ม volumeMount:"
echo "     volumeMounts:"
echo "     - name: gcs-key"
echo "       mountPath: /var/secrets/google"
echo "       readOnly: true"
echo ""
echo "   - เพิ่ม env:"
echo "     env:"
echo "     - name: GOOGLE_CLOUD_KEY_FILE"
echo "       value: /var/secrets/google/key.json"

