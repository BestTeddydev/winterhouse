#!/bin/bash

# Complete Build and Deploy Script for Baanlomnow
# This script builds the Docker image and deploys it to Kubernetes

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Baanlomnow Build & Deploy Script${NC}"
echo "===================================="
echo ""

# Configuration
IMAGE_NAME="baanlomnow"
IMAGE_TAG="1.0"
NAMESPACE="baanlomnow"

# Ask user for deployment target
echo -e "${YELLOW}Select deployment target:${NC}"
echo "1) Local (Docker Desktop)"
echo "2) Google Kubernetes Engine (GKE) - Artifact Registry"
echo ""
read -p "Enter choice [1-2]: " choice

case $choice in
  1)
    echo -e "${GREEN}📦 Building Docker image for local deployment...${NC}"
    docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .
    
    echo -e "${GREEN}✅ Image built successfully!${NC}"
    echo ""
    echo -e "${YELLOW}📋 Next steps:${NC}"
    echo "1. Make sure MongoDB is running:"
    echo "   kubectl get pods -n ${NAMESPACE} | grep mongodb"
    echo ""
    echo "2. Apply deployment:"
    echo "   kubectl apply -f k8s/deployment.yaml"
    echo ""
    echo "3. Check status:"
    echo "   kubectl get pods -n ${NAMESPACE}"
    echo ""
    echo "4. Port forward to access:"
    echo "   kubectl port-forward service/baanlomnow-service 3000:80 -n ${NAMESPACE}"
    ;;
    
  2)
    echo -e "${GREEN}🏗️  Building Docker image for GKE deployment...${NC}"
    
    # Build the image
    docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .
    
    echo -e "${GREEN}📤 Pushing to Artifact Registry...${NC}"
    
    # Tag for Artifact Registry
    ARTIFACT_IMAGE="asia-southeast1-docker.pkg.dev/project-14a6d9ab-7aaf-49a0-92d/baanlomnow-repository/${IMAGE_NAME}:${IMAGE_TAG}"
    docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${ARTIFACT_IMAGE}
    
    # Authenticate with Artifact Registry
    gcloud auth configure-docker asia-southeast1-docker.pkg.dev --quiet
    
    # Push to Artifact Registry
    docker push ${ARTIFACT_IMAGE}
    
    echo -e "${GREEN}✅ Image pushed successfully!${NC}"
    echo ""
    echo -e "${YELLOW}📋 Next steps:${NC}"
    echo "1. Apply production deployment:"
    echo "   kubectl apply -f k8s/deployment.prod.yaml"
    echo ""
    echo "2. Check rollout status:"
    echo "   kubectl rollout status deployment/baanlomnow-app -n ${NAMESPACE}"
    echo ""
    echo "3. Verify pods:"
    echo "   kubectl get pods -n ${NAMESPACE}"
    ;;
    
  *)
    echo -e "${RED}❌ Invalid choice!${NC}"
    exit 1
    ;;
esac

echo ""
echo -e "${GREEN}✅ Build & Deploy completed successfully!${NC}"