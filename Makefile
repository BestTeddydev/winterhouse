.PHONY: help dev prod stop restart logs clean build

# Default target
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

help: ## แสดงความช่วยเหลือ
	@echo "$(BLUE)Winterhouse - Docker Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-15s$(NC) %s\n", $$1, $$2}'

# Development commands
dev: ## เริ่ม development environment
	@echo "$(BLUE)🚀 Starting development environment...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)✅ Development environment started!$(NC)"
	@echo "$(YELLOW)App: http://localhost:3000$(NC)"
	@echo "$(YELLOW)Prisma Studio: http://localhost:5555$(NC)"
	@echo "$(YELLOW)Mongo Express: docker-compose --profile debug up -d mongo-express$(NC)"
	@echo "$(YELLOW)               http://localhost:8081 (admin/admin)$(NC)"

dev-build: ## Build และเริ่ม development environment
	@echo "$(BLUE)🔨 Building development environment...$(NC)"
	docker-compose up -d --build
	@echo "$(GREEN)✅ Done!$(NC)"

dev-logs: ## ดู logs ของ development
	docker-compose logs -f app

# Production commands
prod: ## เริ่ม production environment
	@echo "$(BLUE)🚀 Starting production environment...$(NC)"
	docker-compose -f docker-compose.prod.yml up -d
	@echo "$(GREEN)✅ Production environment started!$(NC)"

prod-build: ## Build production images
	@echo "$(BLUE)🔨 Building production images...$(NC)"
	docker-compose -f docker-compose.prod.yml build
	@echo "$(GREEN)✅ Build complete!$(NC)"

prod-logs: ## ดู logs ของ production
	docker-compose -f docker-compose.prod.yml logs -f

# Database commands
db-migrate: ## รัน database migrations
	docker-compose exec app npx prisma migrate deploy

db-push: ## Push schema to database
	docker-compose exec app npx prisma db push

db-studio: ## เปิด Prisma Studio
	@echo "$(BLUE)📊 Opening Prisma Studio...$(NC)"
	docker-compose up -d prisma-studio
	@echo "$(YELLOW)Prisma Studio: http://localhost:5555$(NC)"

db-backup: ## Backup database
	@echo "$(BLUE)💾 Creating database backup...$(NC)"
	docker-compose exec db mongodump --username admin --password admin123 --authenticationDatabase admin --db winterhouse --out /tmp/backup
	docker-compose exec db tar -czf /tmp/backup_$(shell date +%Y%m%d_%H%M%S).tar.gz -C /tmp backup
	docker cp winterhouse-db:/tmp/backup_$(shell date +%Y%m%d_%H%M%S).tar.gz .
	@echo "$(GREEN)✅ Backup created!$(NC)"

db-restore: ## Restore database from backup (Usage: make db-restore FILE=backup.tar.gz)
	@echo "$(BLUE)📥 Restoring database...$(NC)"
	docker cp $(FILE) winterhouse-db:/tmp/restore.tar.gz
	docker-compose exec db tar -xzf /tmp/restore.tar.gz -C /tmp
	docker-compose exec db mongorestore --username admin --password admin123 --authenticationDatabase admin --db winterhouse /tmp/backup/winterhouse
	@echo "$(GREEN)✅ Database restored!$(NC)"

db-reset: ## Reset database (WARNING: จะลบข้อมูลทั้งหมด!)
	@echo "$(RED)⚠️  WARNING: This will delete all data!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo ""; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose exec app npx prisma migrate reset --force; \
	fi

# General commands
stop: ## หยุด services ทั้งหมด
	@echo "$(YELLOW)🛑 Stopping all services...$(NC)"
	docker-compose down
	@echo "$(GREEN)✅ All services stopped$(NC)"

restart: ## Restart services
	@echo "$(BLUE)🔄 Restarting services...$(NC)"
	docker-compose restart
	@echo "$(GREEN)✅ Services restarted$(NC)"

logs: ## ดู logs ทั้งหมด
	docker-compose logs -f

ps: ## ดูสถานะ containers
	docker-compose ps

shell: ## เข้าสู่ app container shell
	docker-compose exec app sh

db-shell: ## เข้าสู่ database shell
	docker-compose exec db mongosh -u admin -p admin123 --authenticationDatabase admin winterhouse

# Cleanup commands
clean: ## ลบ containers และ volumes (WARNING: จะลบข้อมูลทั้งหมด!)
	@echo "$(RED)⚠️  WARNING: This will remove all containers and data!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo ""; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose down -v; \
		echo "$(GREEN)✅ Cleanup complete$(NC)"; \
	fi

clean-images: ## ลบ Docker images
	@echo "$(YELLOW)🗑️  Removing Docker images...$(NC)"
	docker-compose down --rmi all
	@echo "$(GREEN)✅ Images removed$(NC)"

prune: ## ลบ unused Docker resources
	@echo "$(YELLOW)🧹 Cleaning up Docker...$(NC)"
	docker system prune -f
	@echo "$(GREEN)✅ Cleanup complete$(NC)"

# Installation
install: ## ติดตั้งและเริ่มต้นใช้งานครั้งแรก
	@echo "$(BLUE)📦 Installing Winterhouse...$(NC)"
	@if [ ! -f .env ]; then \
		echo "$(YELLOW)Creating .env file...$(NC)"; \
		cp .env.docker .env; \
		echo "$(RED)⚠️  Please edit .env file before continuing!$(NC)"; \
		exit 1; \
	fi
	@echo "$(BLUE)Building containers...$(NC)"
	docker-compose build
	@echo "$(BLUE)Starting services...$(NC)"
	docker-compose up -d
	@echo "$(BLUE)Waiting for database...$(NC)"
	sleep 5
	@echo "$(BLUE)Running migrations...$(NC)"
	docker-compose exec app npx prisma db push
	@echo "$(GREEN)✅ Installation complete!$(NC)"
	@echo "$(YELLOW)App: http://localhost:3000$(NC)"
	@echo "$(YELLOW)Prisma Studio: http://localhost:5555$(NC)"

# Monitoring
health: ## ตรวจสอบสุขภาพของ services
	@echo "$(BLUE)🏥 Health Check$(NC)"
	@curl -s http://localhost:3000/api/health | python3 -m json.tool || echo "$(RED)❌ App is not healthy$(NC)"

stats: ## ดู resource usage
	docker stats --no-stream

# Update
update: ## อัพเดทโปรเจกต์
	@echo "$(BLUE)🔄 Updating project...$(NC)"
	git pull
	docker-compose build
	docker-compose up -d
	docker-compose exec app npx prisma migrate deploy
	@echo "$(GREEN)✅ Update complete!$(NC)"

