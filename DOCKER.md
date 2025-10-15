# 🐳 Docker Setup Guide - Winterhouse

คู่มือการใช้งาน Docker สำหรับโปรเจกต์ Winterhouse

## 📋 เนื้อหา

- [ความต้องการของระบบ](#ความต้องการของระบบ)
- [Quick Start](#quick-start)
- [Development Mode](#development-mode)
- [Production Mode](#production-mode)
- [คำสั่งที่ใช้บ่อย](#คำสั่งที่ใช้บ่อย)
- [Services](#services)
- [Troubleshooting](#troubleshooting)

---

## ความต้องการของระบบ

- Docker Engine 20.10+
- Docker Compose 2.0+
- อย่างน้อย 2GB RAM
- อย่างน้อย 5GB disk space

### ติดตั้ง Docker

**macOS:**
```bash
brew install --cask docker
```

**Ubuntu:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

**Windows:**
- ดาวน์โหลด [Docker Desktop](https://www.docker.com/products/docker-desktop)

---

## Quick Start

### 1. เตรียม Environment Variables

```bash
# คัดลอกไฟล์ตัวอย่าง
cp .env.docker .env

# แก้ไขไฟล์ .env
nano .env
```

### 2. เริ่มต้นใช้งาน

```bash
# Build และเริ่ม services ทั้งหมด
docker-compose up -d

# ดู logs
docker-compose logs -f app
```

### 3. เข้าถึงแอปพลิเคชัน

- **Application**: http://localhost:3000
- **Prisma Studio**: http://localhost:5555
- **pgAdmin**: http://localhost:5050 (เมื่อเปิด debug profile)

### 4. สร้าง Admin User

```bash
# เข้าสู่ Prisma Studio
open http://localhost:5555

# หรือใช้ psql
docker-compose exec db psql -U postgres -d winterhouse
```

---

## Development Mode

### เริ่มต้นใช้งาน

```bash
# เริ่ม services ทั้งหมด
docker-compose up -d

# ดู logs แบบ real-time
docker-compose logs -f app

# หยุด services
docker-compose down
```

### Hot Reload

โค้ดจะ reload อัตโนมัติเมื่อแก้ไขไฟล์ เนื่องจากมี volume mount:
```yaml
volumes:
  - .:/app  # โค้ดทั้งหมด
  - /app/node_modules  # ยกเว้น node_modules
  - /app/.next  # ยกเว้น .next
```

### เข้าถึง Container

```bash
# เข้าสู่ app container
docker-compose exec app sh

# เข้าสู่ database container
docker-compose exec db psql -U postgres -d winterhouse

# รัน Prisma commands
docker-compose exec app npx prisma studio
docker-compose exec app npx prisma db push
docker-compose exec app npx prisma migrate dev
```

### รัน Prisma Studio

```bash
# วิธีที่ 1: ใช้ service ที่มีอยู่แล้ว
docker-compose up -d prisma-studio
open http://localhost:5555

# วิธีที่ 2: รันใน app container
docker-compose exec app npx prisma studio --port 5555 --browser none
```

### รัน pgAdmin (Database GUI)

```bash
# เริ่ม pgAdmin
docker-compose --profile debug up -d pgadmin

# เข้าถึงที่
open http://localhost:5050

# Login:
# Email: admin@winterhouse.local
# Password: admin

# เชื่อมต่อกับ database:
# Host: db
# Port: 5432
# Username: postgres
# Password: postgres
# Database: winterhouse
```

---

## Production Mode

### เตรียมไฟล์ Environment

```bash
# สร้าง .env สำหรับ production
cp .env.docker .env.production

# แก้ไขค่าให้เหมาะกับ production
nano .env.production
```

### Build และ Deploy

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# เริ่ม services
docker-compose -f docker-compose.prod.yml up -d

# ดู logs
docker-compose -f docker-compose.prod.yml logs -f
```

### SSL/HTTPS Setup

1. **วาง SSL Certificates**:
```bash
mkdir -p nginx/ssl
# คัดลอก cert.pem และ key.pem ไปที่ nginx/ssl/
```

2. **Uncomment HTTPS config** ใน `nginx/nginx.conf`

3. **Restart Nginx**:
```bash
docker-compose -f docker-compose.prod.yml restart nginx
```

### Health Checks

```bash
# ตรวจสอบสถานะ containers
docker-compose -f docker-compose.prod.yml ps

# ตรวจสอบ health ของแอป
curl http://localhost:3000/api/health
```

---

## คำสั่งที่ใช้บ่อย

### Container Management

```bash
# เริ่ม services
docker-compose up -d

# หยุด services
docker-compose down

# Restart services
docker-compose restart

# ดูสถานะ
docker-compose ps

# ดู logs
docker-compose logs -f [service_name]

# ลบทุกอย่างรวม volumes (ข้อมูลจะหายทั้งหมด!)
docker-compose down -v
```

### Database Operations

```bash
# Backup database
docker-compose exec db pg_dump -U postgres winterhouse > backup.sql

# Restore database
cat backup.sql | docker-compose exec -T db psql -U postgres winterhouse

# Connect to database
docker-compose exec db psql -U postgres winterhouse

# Reset database (ข้อมูลจะหายทั้งหมด!)
docker-compose exec app npx prisma migrate reset
```

### Prisma Commands

```bash
# Generate Prisma Client
docker-compose exec app npx prisma generate

# Push schema to database
docker-compose exec app npx prisma db push

# Create migration
docker-compose exec app npx prisma migrate dev --name migration_name

# Apply migrations
docker-compose exec app npx prisma migrate deploy

# Open Prisma Studio
docker-compose exec app npx prisma studio
```

### Maintenance

```bash
# ดู disk usage
docker system df

# ลบ unused images
docker image prune -a

# ลบ unused volumes
docker volume prune

# ลบทุกอย่าง (ระวัง!)
docker system prune -a --volumes
```

---

## Services

### 📦 Services ที่มี

| Service | Port | Description |
|---------|------|-------------|
| **app** | 3000 | Next.js Application |
| **db** | 5432 | PostgreSQL Database |
| **prisma-studio** | 5555 | Prisma Database GUI |
| **pgadmin** | 5050 | pgAdmin (debug profile) |
| **nginx** | 80, 443 | Reverse Proxy (production) |

### Environment Variables

ดู `.env.docker` สำหรับรายการ variables ทั้งหมด

**สำคัญ:**
- `DATABASE_URL`: เปลี่ยน host เป็น `db` แทน `localhost`
- `NEXTAUTH_URL`: ตั้งตาม domain ของคุณ
- `NEXTAUTH_SECRET`: สร้างใหม่ด้วย `openssl rand -base64 32`

---

## Troubleshooting

### ปัญหา: Port already in use

```bash
# ดู process ที่ใช้ port
lsof -i :3000
lsof -i :5432

# Kill process
kill -9 <PID>

# หรือเปลี่ยน port ใน docker-compose.yml
ports:
  - "3001:3000"  # เปลี่ยนจาก 3000:3000
```

### ปัญหา: Database connection failed

```bash
# ตรวจสอบว่า database container ทำงานอยู่
docker-compose ps db

# ดู logs ของ database
docker-compose logs db

# Restart database
docker-compose restart db

# ตรวจสอบ DATABASE_URL ใน .env
# ต้องเป็น postgresql://postgres:password@db:5432/winterhouse
```

### ปัญหา: Prisma Client ไม่ update

```bash
# Generate Prisma Client ใหม่
docker-compose exec app npx prisma generate

# Restart app
docker-compose restart app

# หรือ rebuild
docker-compose up -d --build app
```

### ปัญหา: Out of memory

```bash
# เพิ่ม memory limit ใน docker-compose.yml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 2G

# หรือเพิ่ม Docker Desktop memory allocation
# Docker Desktop → Preferences → Resources → Memory
```

### ปัญหา: Changes ไม่ reflect

```bash
# Rebuild containers
docker-compose up -d --build

# ลบ .next cache
docker-compose exec app rm -rf .next

# Restart
docker-compose restart app
```

### ปัญหา: Permission denied

```bash
# ตรวจสอบ file permissions
ls -la

# แก้ไข ownership (ใช้ระวัง!)
sudo chown -R $USER:$USER .

# หรือใช้ root user (ไม่แนะนำ)
docker-compose exec -u root app sh
```

### ดู Detailed Logs

```bash
# All services
docker-compose logs -f --tail=100

# Specific service
docker-compose logs -f --tail=100 app

# Save logs to file
docker-compose logs > logs.txt
```

---

## 🚀 Production Deployment

### Using Docker on VPS

```bash
# 1. Clone repository
git clone <repo-url>
cd winterhouse

# 2. Setup environment
cp .env.docker .env
nano .env

# 3. Start production services
docker-compose -f docker-compose.prod.yml up -d

# 4. Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Using Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.prod.yml winterhouse

# Check services
docker stack services winterhouse

# Check logs
docker service logs winterhouse_app
```

### CI/CD Integration

ดูตัวอย่าง GitHub Actions workflow:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Copy files to server
        uses: appleboy/scp-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          source: "."
          target: "/app/winterhouse"
      
      - name: Deploy with docker-compose
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /app/winterhouse
            docker-compose -f docker-compose.prod.yml pull
            docker-compose -f docker-compose.prod.yml up -d
```

---

## 📚 เพิ่มเติม

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Docker Documentation](https://nextjs.org/docs/deployment#docker-image)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)

---

## 💡 Tips

1. **Use .dockerignore**: ลด build time และ image size
2. **Multi-stage builds**: ใช้ใน Dockerfile สำหรับ production
3. **Volume mounting**: ใช้ในการ development สำหรับ hot reload
4. **Health checks**: ตรวจสอบสถานะ containers
5. **Resource limits**: ตั้ง memory และ CPU limits
6. **Logging**: ใช้ centralized logging ใน production
7. **Backup**: Backup database เป็นประจำ

---

**Happy Dockerizing! 🐳**

