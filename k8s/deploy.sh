#!/bin/bash

# Winterhouse GKE Deployment Script
# This script deploys the Winterhouse application to Google Kubernetes Engine

set -e

# Configuration
PROJECT_ID="your-project-id"
CLUSTER_NAME="baanlomnow-cluster"
ZONE="asia-southeast1-a"
NAMESPACE="baanlomnow"
IMAGE_NAME="gcr.io/${PROJECT_ID}/baanlomnow"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Winterhouse GKE Deployment${NC}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl is not installed. Please install it first.${NC}"
    exit 1
fi

# Set project
echo -e "${YELLOW}📋 Setting project to ${PROJECT_ID}${NC}"
gcloud config set project ${PROJECT_ID}

# Enable required APIs
echo -e "${YELLOW}🔧 Enabling required APIs${NC}"
gcloud services enable container.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Create GKE cluster if it doesn't exist
echo -e "${YELLOW}🏗️  Creating GKE cluster${NC}"
if ! gcloud container clusters describe ${CLUSTER_NAME} --zone=${ZONE} &> /dev/null; then
    gcloud container clusters create ${CLUSTER_NAME} \
        --zone=${ZONE} \
        --num-nodes=3 \
        --enable-autoscaling \
        --min-nodes=1 \
        --max-nodes=10 \
        --machine-type=e2-medium \
        --enable-autorepair \
        --enable-autoupgrade \
        --disk-size=20GB \
        --disk-type=pd-standard
else
    echo -e "${GREEN}✅ Cluster ${CLUSTER_NAME} already exists${NC}"
fi

# Get cluster credentials
echo -e "${YELLOW}🔑 Getting cluster credentials${NC}"
gcloud container clusters get-credentials ${CLUSTER_NAME} --zone=${ZONE}

# Build and push Docker image
echo -e "${YELLOW}🐳 Building and pushing Docker image${NC}"
docker build -t ${IMAGE_NAME}:latest .
docker push ${IMAGE_NAME}:latest

# Create namespace
echo -e "${YELLOW}📁 Creating namespace${NC}"
kubectl apply -f k8s/namespace.yaml

# Apply MongoDB
echo -e "${YELLOW}🍃 Deploying MongoDB${NC}"
kubectl apply -f k8s/mongodb.yaml

# Wait for MongoDB to be ready
echo -e "${YELLOW}⏳ Waiting for MongoDB to be ready${NC}"
kubectl wait --for=condition=ready pod -l app=mongodb -n ${NAMESPACE} --timeout=300s

# Apply ConfigMap and Secrets
echo -e "${YELLOW}🔐 Applying ConfigMap and Secrets${NC}"
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml

# Apply application deployment
echo -e "${YELLOW}🚀 Deploying application${NC}"
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

# Wait for application to be ready
echo -e "${YELLOW}⏳ Waiting for application to be ready${NC}"
kubectl wait --for=condition=ready pod -l app=baanlomnow -n ${NAMESPACE} --timeout=300s

# Apply Ingress
echo -e "${YELLOW}🌐 Applying Ingress${NC}"
kubectl apply -f k8s/managed-certificate.yaml
kubectl apply -f k8s/ingress.yaml

# Get external IP
echo -e "${YELLOW}🔍 Getting external IP${NC}"
EXTERNAL_IP=$(kubectl get ingress baanlomnow-ingress -n ${NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
if [ -z "$EXTERNAL_IP" ]; then
    echo -e "${YELLOW}⏳ External IP is still being assigned. Please wait...${NC}"
    echo -e "${YELLOW}You can check the status with: kubectl get ingress baanlomnow-ingress -n ${NAMESPACE}${NC}"
else
    echo -e "${GREEN}✅ External IP: ${EXTERNAL_IP}${NC}"
fi

# Show deployment status
echo -e "${GREEN}📊 Deployment Status:${NC}"
kubectl get pods -n ${NAMESPACE}
kubectl get services -n ${NAMESPACE}
kubectl get ingress -n ${NAMESPACE}

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${YELLOW}📝 Next steps:${NC}"
echo -e "1. Update your DNS to point to the external IP: ${EXTERNAL_IP}"
echo -e "2. Update the domain in k8s/ingress.yaml and k8s/managed-certificate.yaml"
echo -e "3. Reapply the ingress and certificate configurations"
echo -e "4. Monitor the deployment with: kubectl get pods -n ${NAMESPACE}"
echo -e "5. View logs with: kubectl logs -f deployment/baanlomnow-app -n ${NAMESPACE}"
