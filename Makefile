# Winterhouse Makefile
# Commands for easy Docker deployment

.PHONY: help dev prod build clean logs restart stop status health backup restore

# Default target
help: ## Show this help message
	@echo "Winterhouse Docker Deployment Commands"
	@echo "======================================"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Development commands
dev: ## Start development environment
	@echo "🚀 Starting development environment..."
	docker-compose up -d
	@echo "✅ Development environment started!"
	@echo "📱 Application: http://localhost:3000"
	@echo "🗄️  MongoDB: localhost:27017"
	@echo "🔧 Mongo Express: http://localhost:8081 (use --profile debug)"

dev-debug: ## Start development environment with debug tools
	@echo "🚀 Starting development environment with debug tools..."
	docker-compose --profile debug up -d
	@echo "✅ Development environment with debug tools started!"
	@echo "📱 Application: http://localhost:3000"
	@echo "🗄️  MongoDB: localhost:27017"
	@echo "🔧 Mongo Express: http://localhost:8081"

# Production commands
prod: ## Start production environment
	@echo "🏭 Starting production environment..."
	@if [ ! -f .env.prod ]; then \
		echo "❌ .env.prod file not found!"; \
		echo "Please create .env.prod file with production environment variables"; \
		exit 1; \
	fi
	docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
	@echo "✅ Production environment started!"
	@echo "🌐 Application: http://localhost:3000"
	@echo "🔒 Nginx: http://localhost:80"

# Build commands
build: ## Build all Docker images
	@echo "🔨 Building Docker images..."
	docker-compose build --no-cache
	@echo "✅ Docker images built!"

build-prod: ## Build production Docker images
	@echo "🔨 Building production Docker images..."
	docker-compose -f docker-compose.prod.yml build --no-cache
	@echo "✅ Production Docker images built!"

# Management commands
logs: ## Show application logs
	@echo "📋 Showing application logs..."
	docker-compose logs -f app

logs-all: ## Show all service logs
	@echo "📋 Showing all service logs..."
	docker-compose logs -f

logs-prod: ## Show production logs
	@echo "📋 Showing production logs..."
	docker-compose -f docker-compose.prod.yml logs -f app

restart: ## Restart development services
	@echo "🔄 Restarting development services..."
	docker-compose restart
	@echo "✅ Services restarted!"

restart-prod: ## Restart production services
	@echo "🔄 Restarting production services..."
	docker-compose -f docker-compose.prod.yml restart
	@echo "✅ Production services restarted!"

stop: ## Stop development services
	@echo "⏹️  Stopping development services..."
	docker-compose down
	@echo "✅ Development services stopped!"

stop-prod: ## Stop production services
	@echo "⏹️  Stopping production services..."
	docker-compose -f docker-compose.prod.yml down
	@echo "✅ Production services stopped!"

# Status and health commands
status: ## Show service status
	@echo "📊 Service Status:"
	@echo "=================="
	docker-compose ps

status-prod: ## Show production service status
	@echo "📊 Production Service Status:"
	@echo "============================="
	docker-compose -f docker-compose.prod.yml ps

health: ## Check application health
	@echo "🏥 Checking application health..."
	@curl -f http://localhost:3000/api/health && echo "✅ Application is healthy!" || echo "❌ Application health check failed!"

health-prod: ## Check production application health
	@echo "🏥 Checking production application health..."
	@curl -f http://localhost/health && echo "✅ Nginx is healthy!" || echo "❌ Nginx health check failed!"
	@curl -f http://localhost:3000/api/health && echo "✅ Application is healthy!" || echo "❌ Application health check failed!"

# Database commands
db-shell: ## Connect to MongoDB shell
	@echo "🗄️  Connecting to MongoDB shell..."
	docker exec -it winterhouse-db mongosh winterhouse

db-shell-prod: ## Connect to production MongoDB shell
	@echo "🗄️  Connecting to production MongoDB shell..."
	docker exec -it winterhouse-db-prod mongosh winterhouse

# Backup and restore commands
backup: ## Backup MongoDB data
	@echo "💾 Creating MongoDB backup..."
	@mkdir -p backups
	docker exec winterhouse-db mongodump --out /data/backup/$(shell date +%Y%m%d_%H%M%S)
	docker cp winterhouse-db:/data/backup/$(shell date +%Y%m%d_%H%M%S) ./backups/
	@echo "✅ Backup created in ./backups/"

backup-prod: ## Backup production MongoDB data
	@echo "💾 Creating production MongoDB backup..."
	@mkdir -p backups
	docker exec winterhouse-db-prod mongodump --out /data/backup/$(shell date +%Y%m%d_%H%M%S)
	docker cp winterhouse-db-prod:/data/backup/$(shell date +%Y%m%d_%H%M%S) ./backups/
	@echo "✅ Production backup created in ./backups/"

# Cleanup commands
clean: ## Clean up unused Docker resources
	@echo "🧹 Cleaning up unused Docker resources..."
	docker system prune -f
	docker volume prune -f
	docker network prune -f
	@echo "✅ Cleanup completed!"

clean-all: ## Clean up all Docker resources (WARNING: removes all containers, images, volumes)
	@echo "⚠️  WARNING: This will remove ALL Docker resources!"
	@read -p "Are you sure? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	docker system prune -a -f --volumes
	@echo "✅ All Docker resources cleaned!"

# Update commands
update: ## Pull latest images and restart services
	@echo "🔄 Updating services..."
	docker-compose pull
	docker-compose up -d
	@echo "✅ Services updated!"

update-prod: ## Pull latest images and restart production services
	@echo "🔄 Updating production services..."
	docker-compose -f docker-compose.prod.yml pull
	docker-compose -f docker-compose.prod.yml up -d
	@echo "✅ Production services updated!"

# Monitoring commands
monitor: ## Show resource usage
	@echo "📊 Resource Usage:"
	@echo "=================="
	docker stats --no-stream

# SSL commands
ssl-setup: ## Setup SSL certificates (requires certificates in nginx/ssl/)
	@echo "🔒 Setting up SSL certificates..."
	@if [ ! -f nginx/ssl/cert.pem ] || [ ! -f nginx/ssl/key.pem ]; then \
		echo "❌ SSL certificates not found in nginx/ssl/"; \
		echo "Please place your certificates as:"; \
		echo "  - nginx/ssl/cert.pem"; \
		echo "  - nginx/ssl/key.pem"; \
		exit 1; \
	fi
	@echo "✅ SSL certificates found!"
	@echo "Please uncomment HTTPS configuration in nginx/nginx.conf and restart nginx"

# Quick setup commands
setup-dev: ## Quick development setup
	@echo "🚀 Setting up development environment..."
	@if [ ! -f .env ]; then \
		echo "📝 Creating .env file from .env.example..."; \
		cp .env.example .env; \
		echo "⚠️  Please edit .env file with your actual values"; \
	fi
	@echo "🔨 Building images..."
	docker-compose build
	@echo "🚀 Starting services..."
	docker-compose up -d
	@echo "✅ Development environment ready!"
	@echo "📱 Application: http://localhost:3000"

setup-prod: ## Quick production setup
	@echo "🏭 Setting up production environment..."
	@if [ ! -f .env.prod ]; then \
		echo "📝 Creating .env.prod file from .env.example..."; \
		cp .env.example .env.prod; \
		echo "⚠️  Please edit .env.prod file with your production values"; \
		exit 1; \
	fi
	@echo "🔨 Building production images..."
	docker-compose -f docker-compose.prod.yml build
	@echo "🚀 Starting production services..."
	docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
	@echo "✅ Production environment ready!"
	@echo "🌐 Application: http://localhost:3000"
	@echo "🔒 Nginx: http://localhost:80"