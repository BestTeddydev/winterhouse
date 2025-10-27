# 🔌 คู่มือเชื่อมต่อ MongoDB ใน Kubernetes

มีหลายวิธีสำหรับเชื่อมต่อ MongoDB ที่ deploy อยู่ใน Kubernetes

## 🚀 วิธีที่ 1: Port Forwarding (แนะนำ)

### Connection String
```
mongodb://admin:bestbaanlomnow@localhost:27017/baanlomnow?authSource=admin
```

### Terminal Commands

```bash
# Option A: ใช้ Service
kubectl port-forward svc/mongodb-service 27017:27017 -n baanlomnow

# Option B: ใช้ Pod โดยตรง
kubectl port-forward deployment/mongodb 27017:27017 -n baanlomnow
```

### Connect from MongoDB Client

หลังจากรัน port-forward แล้ว:

```bash
# ใช้ mongosh
mongosh "mongodb://admin:bestbaanlomnow@localhost:27017/baanlomnow?authSource=admin"

# หรือใช้ mongodb-compass
mongodb-compass "mongodb://admin:bestbaanlomnow@localhost:27017/baanlomnow?authSource=admin"
```

### MongoDB Compass Connection
1. เปิด MongoDB Compass
2. Connection String:
   ```
   mongodb://admin:bestbaanlomnow@localhost:27017/baanlomnow?authSource=admin
   ```
3. Connect

### Studio 3T Connection
1. เปิด Studio 3T
2. New Connection → Standard
3. Server: `localhost`
4. Port: `27017`
5. Database: `baanlomnow`
6. Authentication → Login as User:
   - Username: `admin`
   - Password: `bestbaanlomnow`
   - Auth Database: `admin`
7. Test & Connect

---

## 🔍 วิธีที่ 2: Exec into MongoDB Pod

### Get into MongoDB Shell

```bash
# Check pod name
kubectl get pods -n baanlomnow | grep mongodb

# Exec into MongoDB pod
kubectl exec -it deployment/mongodb -n baanlomnow -- mongosh

# หรือ exec แล้ว mongosh ทันที
kubectl exec -it deployment/mongodb -n baanlomnow -- mongosh "mongodb://localhost:27017/baanlomnow"
```

### MongoDB Commands

```bash
# List databases
kubectl exec deployment/mongodb -n baanlomnow -- mongosh --eval "db.adminCommand('listDatabases')"

# Switch database
kubectl exec deployment/mongodb -n baanlomnow -- mongosh --eval "use baanlomnow; db.getName()"

# List collections
kubectl exec deployment/mongodb -n baanlomnow -- mongosh --eval "use baanlomnow; db.getCollectionNames()"

# Count documents in collection
kubectl exec deployment/mongodb -n baanlomnow -- mongosh --eval "use baanlomnow; db.bookings.countDocuments()"

# Query documents
kubectl exec deployment/mongodb -n baanlomnow -- mongosh --eval "use baanlomnow; db.users.find().limit(5)"
```

---

## 🌐 วิธีที่ 3: กรณีต้องการ Access จาก Local Database Tool

### Setup Minikube/Port-Forward Tunnel

**Option A: Auto Port Forward Script**

สร้าง script: `connect-mongodb.sh`

```bash
#!/bin/bash
echo "🔌 Connecting to MongoDB..."
kubectl port-forward svc/mongodb-service 27017:27017 -n baanlomnow &
PF_PID=$!
echo "✅ Port forwarding started (PID: $PF_PID)"
echo "📊 MongoDB URI: mongodb://admin:bestbaanlomnow@localhost:27017/baanlomnow?authSource=admin"
echo ""
echo "Press Ctrl+C to stop..."
wait $PF_PID
```

**Option B: บรรทัดเดียวง่ายๆ**

```bash
kubectl port-forward svc/mongodb-service 27017:27017 -n baanlomnow
```

### Connect with Credentials

**Connection String:**
```
mongodb://admin:bestbaanlomnow@localhost:27017/baanlomnow?authSource=admin
```

**Parameters:**
- Username: `admin`
- Password: `bestbaanlomnow`
- Host: `localhost`
- Port: `27017`
- Database: `baanlomnow`
- Auth Database: `admin`

---

## 📊 วิธีที่ 4: ใช้ MongoDB GUI Tools

### MongoDB Compass

```bash
# 1. Start port-forward (ในอีก terminal)
kubectl port-forward svc/mongodb-service 27017:27017 -n baanlomnow

# 2. เปิด MongoDB Compass
# 3. Connection String:
mongodb://admin:bestbaanlomnow@localhost:27017/baanlomnow?authSource=admin

# 4. Connect
```

### Studio 3T

1. MongoDB URL: `mongodb://localhost:27017`
2. Authentication tab:
   - Use Auth: ✅
   - Database: `admin`
   - Username: `admin`
   - Password: `bestbaanlomnow`
3. Test & Connect

### TablePlus

1. Protocol: MongoDB
2. Host: `localhost`
3. Port: `27017`
4. Database: `baanlomnow`
5. Username: `admin`
6. Password: `bestbaanlomnow`
7. Connect

---

## 🔐 Credentials

```
Username: admin
Password: bestbaanlomnow
Database: baanlomnow
Auth Database: admin
```

## 🧪 Test Connections

### Test from Local Machine

```bash
# 1. Start port-forward
kubectl port-forward svc/mongodb-service 27017:27017 -n baanlomnow

# 2. Test connection
mongosh "mongodb://admin:bestbaanlomnow@localhost:27017/baanlomnow?authSource=admin"

# 3. Run a test query
db.users.countDocuments()
```

### Test from inside Cluster

```bash
# Exec into app pod
kubectl exec -it deployment/baanlomnow-app -n baanlomnow -- sh

# Connect to MongoDB
mongosh "mongodb://admin:bestbaanlomnow@mongodb-service:27017/baanlomnow?authSource=admin"
```

---

## 📋 Quick Commands

### Common MongoDB Queries

```bash
# List all databases
kubectl exec deployment/mongodb -n baanlomnow -- mongosh --eval "db.adminCommand('listDatabases')"

# Use baanlomnow database
kubectl exec deployment/mongodb -n baanlomnow -- mongosh --eval "use baanlomnow; db.getName()"

# Count documents in users collection
kubectl exec deployment/mongodb -n baanlomnow -- mongosh --eval "use baanlomnow; db.users.countDocuments()"

# List all collections
kubectl exec deployment/mongodb -n baanlomnow -- mongosh --eval "use baanlomnow; db.getCollectionNames()"

# Find users
kubectl exec deployment/mongodb -n baanlomnow -- mongosh --eval "use baanlomnow; db.users.find().pretty()"

# Find bookings
kubectl exec deployment/mongodb -n baanlomnow -- mongosh --eval "use baanlomnow; db.bookings.find().pretty()"

# Backup database
kubectl exec deployment/mongodb -n baanlomnow -- mongodump --uri="mongodb://admin:bestbaanlomnow@localhost:27017/baanlomnow?authSource=admin"
```

---

## 🛠️ Troubleshooting

### Problem: Cannot connect

```bash
# Check if MongoDB is running
kubectl get pods -n baanlomnow | grep mongodb

# Check MongoDB logs
kubectl logs deployment/mongodb -n baanlomnow

# Check service
kubectl get svc -n baanlomnow | grep mongodb
```

### Problem: Authentication failed

```bash
# Check credentials in secrets
kubectl get secret baanlomnow-secrets -n baanlomnow -o jsonpath='{.data.MONGODB_URI}' | base64 -d

# Should be: mongodb://admin:bestbaanlomnow@mongodb-service:27017/baanlomnow?authSource=admin
```

### Problem: Port forwarding fails

```bash
# Check if port 27017 is already in use
lsof -i :27017

# Kill process if needed
kill -9 <PID>

# Try different port
kubectl port-forward svc/mongodb-service 27018:27017 -n baanlomnow
# Then use mongodb://...@localhost:27018
```

---

## 🎯 Recommended Approach

### สำหรับ Development (Local Machine)

```bash
# Terminal 1: Port forward
kubectl port-forward svc/mongodb-service 27017:27017 -n baanlomnow

# Terminal 2: Connect with your favorite tool
# MongoDB Compass, Studio 3T, TablePlus, etc.
```

### สำหรับ Quick Inspection

```bash
# Exec into pod and use mongosh
kubectl exec -it deployment/mongodb -n baanlomnow -- mongosh
```

### สำหรับ Automation/Scripts

```bash
# Direct connection from kubectl exec
kubectl exec deployment/mongodb -n baanlomnow -- mongosh --eval "use baanlomnow; db.collection_name.find()"
```

---

## 📚 Related Documentation

- [MongoDB Official Documentation](https://docs.mongodb.com/)
- [kubectl port-forward](https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands#port-forward)
- [MongoDB Compass](https://www.mongodb.com/products/compass)
- [Studio 3T](https://studio3t.com/)

