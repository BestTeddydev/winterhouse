#!/bin/bash

# 🚨 Quick Fix for Kubernetes Image Pull Error
# Script to resolve the immediate deployment issue

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${RED}🚨 Kubernetes Image Pull Error - Quick Fix${NC}"
echo "=============================================="

# Configuration
PROJECT_ID="baanlomnow-project"
IMAGE_NAME="baanlomnow"
NAMESPACE="baanlomnow"

echo -e "${YELLOW}🔍 Current Issue:${NC}"
echo "Kubernetes is trying to pull image: gcr.io/${PROJECT_ID}/${IMAGE_NAME}:latest"
echo "But this image doesn't exist in Google Container Registry"
echo ""

echo -e "${BLUE}🛠️  Solution Options:${NC}"
echo ""

echo -e "${GREEN}Option 1: Build and Push Image to GCR${NC}"
echo "1. Build Docker image locally"
echo "2. Push to Google Container Registry"
echo "3. Deploy to Kubernetes"
echo ""

echo -e "${GREEN}Option 2: Use Local Image (Development)${NC}"
echo "1. Build image locally"
echo "2. Load into kind/minikube cluster"
echo "3. Deploy to Kubernetes"
echo ""

echo -e "${GREEN}Option 3: Use Public Registry${NC}"
echo "1. Push to Docker Hub"
echo "2. Update deployment to use Docker Hub image"
echo "3. Deploy to Kubernetes"
echo ""

# Function to check if gcloud is configured
check_gcloud() {
    if ! command -v gcloud &> /dev/null; then
        echo -e "${RED}❌ gcloud CLI not found${NC}"
        return 1
    fi
    
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        echo -e "${RED}❌ Not authenticated with Google Cloud${NC}"
        return 1
    fi
    
    return 0
}

# Function to build and push to GCR
build_and_push_gcr() {
    echo -e "${YELLOW}🔨 Building Docker image...${NC}"
    docker build -t gcr.io/${PROJECT_ID}/${IMAGE_NAME}:latest .
    
    echo -e "${YELLOW}📤 Pushing to Google Container Registry...${NC}"
    gcloud auth configure-docker --quiet
    docker push gcr.io/${PROJECT_ID}/${IMAGE_NAME}:latest
    
    echo -e "${GREEN}✅ Image pushed successfully!${NC}"
}

# Function to deploy to Kubernetes
deploy_to_k8s() {
    echo -e "${YELLOW}🚀 Deploying to Kubernetes...${NC}"
    
    # Apply the deployment
    kubectl apply -f k8s/deployment.yaml
    
    # Wait for deployment
    kubectl rollout status deployment/baanlomnow-app -n ${NAMESPACE} --timeout=300s
    
    echo -e "${GREEN}✅ Deployment successful!${NC}"
}

# Function to show status
show_status() {
    echo -e "${BLUE}📊 Deployment Status:${NC}"
    kubectl get pods -n ${NAMESPACE}
    echo ""
    echo -e "${BLUE}📋 Pod Logs:${NC}"
    kubectl logs -l app=baanlomnow -n ${NAMESPACE} --tail=20
}

# Main execution
case "${1:-help}" in
    "gcr")
        if check_gcloud; then
            build_and_push_gcr
            deploy_to_k8s
            show_status
        else
            echo -e "${RED}❌ Google Cloud setup required for GCR option${NC}"
            echo "Please run: gcloud auth login"
            exit 1
        fi
        ;;
    "local")
        echo -e "${YELLOW}🔨 Building local image...${NC}"
        docker build -t ${IMAGE_NAME}:latest .
        echo -e "${GREEN}✅ Local image built!${NC}"
        echo -e "${YELLOW}⚠️  Note: You need to load this image into your Kubernetes cluster${NC}"
        echo "For kind: kind load docker-image ${IMAGE_NAME}:latest"
        echo "For minikube: minikube image load ${IMAGE_NAME}:latest"
        ;;
    "dockerhub")
        echo -e "${YELLOW}🔨 Building image for Docker Hub...${NC}"
        docker build -t your-dockerhub-username/${IMAGE_NAME}:latest .
        echo -e "${YELLOW}📤 Pushing to Docker Hub...${NC}"
        docker push your-dockerhub-username/${IMAGE_NAME}:latest
        echo -e "${GREEN}✅ Image pushed to Docker Hub!${NC}"
        echo -e "${YELLOW}⚠️  Note: Update deployment.yaml to use your Docker Hub image${NC}"
        ;;
    "status")
        show_status
        ;;
    "logs")
        kubectl logs -l app=baanlomnow -n ${NAMESPACE} --tail=50 -f
        ;;
    "help")
        echo -e "${BLUE}🚨 Kubernetes Image Pull Error - Quick Fix${NC}"
        echo -e "${YELLOW}Usage: $0 [command]${NC}"
        echo ""
        echo -e "${GREEN}Commands:${NC}"
        echo -e "  gcr       - Build and push to Google Container Registry (recommended)"
        echo -e "  local     - Build local image for kind/minikube"
        echo -e "  dockerhub - Build and push to Docker Hub"
        echo -e "  status    - Show deployment status"
        echo -e "  logs      - Show application logs"
        echo -e "  help      - Show this help message"
        echo ""
        echo -e "${YELLOW}Quick Fix Steps:${NC}"
        echo "1. Run: $0 gcr"
        echo "2. Wait for deployment to complete"
        echo "3. Check status: $0 status"
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo "Use '$0 help' for available commands"
        exit 1
        ;;
esac
