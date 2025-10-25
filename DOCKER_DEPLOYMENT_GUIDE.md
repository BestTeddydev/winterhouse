# 🐳 Docker Deployment Guide for Winterhouse

คู่มือการ deploy Winterhouse ด้วย Docker สำหรับ Development และ Production

## 📋 สารบัญ

- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Production Deployment](#production-deployment)
- [Environment Variables](#environment-variables)
- [Health Checks](#health-checks)
- [Monitoring & Logs](#monitoring--logs)
- [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

### Required Software
- Docker Engine 20.10+
- Docker Compose 2.0+
- Git

### Required Accounts & Services
- MongoDB Atlas หรือ MongoDB Server
- Stripe Account (สำหรับ Payment Gateway)
- LINE Developers Account
- Google Cloud Storage Account
- Resend Account (สำหรับ Email Service)

## 🚀 Development Setup

### 1. Clone และ Setup Environment

```bash
# Clone repository
git clone <your-repo-url>
cd winterhouse

# สร้างไฟล์ .env สำหรับ development
cp .env.example .env
```

### 2. Configure Environment Variables

แก้ไขไฟล์ `.env`:

```env
# Database
DATABASE_URL=mongodb://admin:admin123@localhost:27017/winterhouse?authSource=admin

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-development-secret-key

# LINE Login
LINE_CHANNEL_ID=your-line-channel-id
LINE_CHANNEL_SECRET=your-line-channel-secret

# LINE Messaging API
LINE_CHANNEL_ACCESS_TOKEN=your-line-access-token
LINE_ADMIN_USER_ID=your-admin-user-id

# Stripe Payment Gateway
STRIPE_PUBLIC_KEY=pk_test_your-stripe-public-key
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Google Cloud Storage
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_STORAGE_BUCKET=your-bucket-name

# Email Service
RESEND_API_KEY=your-resend-api-key

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_your-stripe-public-key
```

### 3. Start Development Environment

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### 4. Access Services

- **Application**: http://localhost:3000
- **MongoDB**: localhost:27017
- **Mongo Express** (optional): http://localhost:8081

### 5. Debug Mode (Optional)

```bash
# Start with Mongo Express for database management
docker-compose --profile debug up -d
```

## 🏭 Production Deployment

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
```

### 2. Configure Production Environment

```bash
# สร้างไฟล์ .env สำหรับ production
cp .env.example .env.prod
```

แก้ไขไฟล์ `.env.prod`:

```env
# Database (ใช้ MongoDB Atlas หรือ Production MongoDB)
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/winterhouse

# NextAuth
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-production-secret-key

# LINE Login
LINE_CHANNEL_ID=your-line-channel-id
LINE_CHANNEL_SECRET=your-line-channel-secret

# LINE Messaging API
LINE_CHANNEL_ACCESS_TOKEN=your-line-access-token
LINE_ADMIN_USER_ID=your-admin-user-id

# Stripe Payment Gateway (Live Keys)
STRIPE_PUBLIC_KEY=pk_live_your-stripe-public-key
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Google Cloud Storage
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_STORAGE_BUCKET=your-bucket-name

# Email Service
RESEND_API_KEY=your-resend-api-key

# App URLs
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_live_your-stripe-public-key

# MongoDB (ถ้าใช้ local MongoDB)
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=your-secure-password
MONGO_DATABASE=winterhouse
```

### 3. Deploy Production

```bash
# Build และ start production services
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f app

# Check service status
docker-compose -f docker-compose.prod.yml ps
```

### 4. SSL Certificate Setup (Optional)

```bash
# สร้างโฟลเดอร์สำหรับ SSL certificates
mkdir -p nginx/ssl

# Copy SSL certificates
cp your-cert.pem nginx/ssl/cert.pem
cp your-key.pem nginx/ssl/key.pem

# Uncomment HTTPS configuration ใน nginx.conf
# แล้ว restart nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

## 🔍 Health Checks

### Application Health Check

```bash
# Check application health
curl http://localhost:3000/api/health

# Check nginx health
curl http://localhost/health
```

### Docker Health Checks

```bash
# Check container health
docker ps

# Check specific service health
docker inspect winterhouse-app-prod | grep -A 10 Health
```

## 📊 Monitoring & Logs

### View Logs

```bash
# Application logs
docker-compose logs -f app

# Database logs
docker-compose logs -f db

# Nginx logs
docker-compose logs -f nginx

# All logs
docker-compose logs -f
```

### Resource Monitoring

```bash
# Check resource usage
docker stats

# Check disk usage
docker system df
```

### Log Rotation

```bash
# Setup log rotation
sudo nano /etc/logrotate.d/docker-containers
```

เพิ่มเนื้อหา:

```
/var/lib/docker/containers/*/*.log {
  rotate 7
  daily
  compress
  size=1M
  missingok
  delaycompress
  copytruncate
}
```

## 🔧 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Failed

```bash
# Check MongoDB status
docker-compose logs db

# Test MongoDB connection
docker exec -it winterhouse-db mongosh --eval "db.adminCommand('ping')"
```

#### 2. Application Won't Start

```bash
# Check application logs
docker-compose logs app

# Check environment variables
docker exec -it winterhouse-app env | grep -E "(DATABASE_URL|NEXTAUTH_SECRET)"
```

#### 3. Nginx Proxy Issues

```bash
# Check nginx configuration
docker exec -it winterhouse-nginx nginx -t

# Reload nginx configuration
docker exec -it winterhouse-nginx nginx -s reload
```

#### 4. Memory Issues

```bash
# Check memory usage
docker stats --no-stream

# Restart services
docker-compose restart
```

### Performance Optimization

#### 1. Database Optimization

```bash
# Create MongoDB indexes
docker exec -it winterhouse-db mongosh winterhouse --eval "
db.bookings.createIndex({ userId: 1 });
db.bookings.createIndex({ roomId: 1 });
db.bookings.createIndex({ checkIn: 1, checkOut: 1 });
"
```

#### 2. Application Optimization

```bash
# Enable production optimizations
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1
```

#### 3. Nginx Optimization

```bash
# Update nginx.conf สำหรับ production
# เพิ่ม worker_processes auto;
# เพิ่ม worker_connections 2048;
```

## 🔄 Backup & Recovery

### Database Backup

```bash
# Backup MongoDB
docker exec winterhouse-db mongodump --out /data/backup/$(date +%Y%m%d)

# Copy backup to host
docker cp winterhouse-db:/data/backup/$(date +%Y%m%d) ./backup/
```

### Application Backup

```bash
# Backup volumes
docker run --rm -v winterhouse_mongodb_prod_data:/data -v $(pwd):/backup alpine tar czf /backup/mongodb-backup.tar.gz -C /data .
```

### Recovery

```bash
# Restore MongoDB
docker exec -i winterhouse-db mongorestore --drop /data/backup/20240101

# Restore volumes
docker run --rm -v winterhouse_mongodb_prod_data:/data -v $(pwd):/backup alpine tar xzf /backup/mongodb-backup.tar.gz -C /data
```

## 🚀 Deployment Commands

### Quick Commands

```bash
# Development
docker-compose up -d
docker-compose down

# Production
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
docker-compose -f docker-compose.prod.yml down

# Rebuild
docker-compose build --no-cache
docker-compose -f docker-compose.prod.yml build --no-cache

# Update
docker-compose pull
docker-compose up -d
```

### Maintenance Commands

```bash
# Clean up unused resources
docker system prune -a

# Remove unused volumes
docker volume prune

# Remove unused networks
docker network prune
```

## 📝 Environment Variables Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `DATABASE_URL` | MongoDB connection string | ✅ | `mongodb://user:pass@host:port/db` |
| `NEXTAUTH_URL` | Application URL | ✅ | `https://your-domain.com` |
| `NEXTAUTH_SECRET` | NextAuth secret key | ✅ | `your-secret-key` |
| `LINE_CHANNEL_ID` | LINE Channel ID | ✅ | `1234567890` |
| `LINE_CHANNEL_SECRET` | LINE Channel Secret | ✅ | `your-line-secret` |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Access Token | ✅ | `your-access-token` |
| `LINE_ADMIN_USER_ID` | Admin User ID | ✅ | `U1234567890` |
| `STRIPE_PUBLIC_KEY` | Stripe Public Key | ✅ | `pk_live_...` |
| `STRIPE_SECRET_KEY` | Stripe Secret Key | ✅ | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook Secret | ⚠️ | `whsec_...` |
| `GOOGLE_CLOUD_PROJECT_ID` | GCP Project ID | ✅ | `your-project-id` |
| `GOOGLE_CLOUD_STORAGE_BUCKET` | GCS Bucket Name | ✅ | `your-bucket` |
| `RESEND_API_KEY` | Resend API Key | ✅ | `re_...` |
| `NEXT_PUBLIC_APP_URL` | Public App URL | ✅ | `https://your-domain.com` |
| `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` | Public Stripe Key | ✅ | `pk_live_...` |

## 🎯 Best Practices

1. **Security**
   - ใช้ strong passwords สำหรับ MongoDB
   - Enable SSL/TLS สำหรับ production
   - Regular security updates

2. **Performance**
   - Monitor resource usage
   - Setup proper logging
   - Use CDN สำหรับ static assets

3. **Reliability**
   - Setup health checks
   - Implement proper error handling
   - Regular backups

4. **Monitoring**
   - Setup log aggregation
   - Monitor application metrics
   - Setup alerts

---

**Happy Deploying! 🚀**
