#!/bin/bash

# 🚀 Baanlomnow GKE Quick Deploy Script
# Script สำหรับ deploy แอปพลิเคชัน Baanlomnow บน GKE แบบง่าย

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Baanlomnow GKE Quick Deploy${NC}"

# Configuration
PROJECT_ID=""
CLUSTER_NAME="baanlomnow-cluster"
ZONE="asia-southeast1-a"
NAMESPACE="baanlomnow"

# Function to check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}🔍 Checking prerequisites...${NC}"
    
    if ! command -v gcloud &> /dev/null; then
        echo -e "${RED}❌ gcloud CLI is not installed${NC}"
        echo -e "${YELLOW}Please install: https://cloud.google.com/sdk/docs/install${NC}"
        exit 1
    fi
    
    if ! command -v kubectl &> /dev/null; then
        echo -e "${RED}❌ kubectl is not installed${NC}"
        echo -e "${YELLOW}Please install: gcloud components install kubectl${NC}"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed${NC}"
        echo -e "${YELLOW}Please install Docker first${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Prerequisites check passed${NC}"
}

# Function to get project ID
get_project_id() {
    if [ -z "$PROJECT_ID" ]; then
        echo -e "${YELLOW}📋 Please enter your Google Cloud Project ID:${NC}"
        read -p "Project ID: " PROJECT_ID
        
        if [ -z "$PROJECT_ID" ]; then
            echo -e "${RED}❌ Project ID is required${NC}"
            exit 1
        fi
    fi
    
    echo -e "${BLUE}📊 Using Project ID: ${PROJECT_ID}${NC}"
}

# Function to setup Google Cloud
setup_gcloud() {
    echo -e "${YELLOW}🔧 Setting up Google Cloud...${NC}"
    
    # Set project
    gcloud config set project ${PROJECT_ID}
    
    # Enable APIs
    gcloud services enable container.googleapis.com
    gcloud services enable containerregistry.googleapis.com
    gcloud services enable compute.googleapis.com
    
    # Configure Docker
    gcloud auth configure-docker
    
    echo -e "${GREEN}✅ Google Cloud setup completed${NC}"
}

# Function to create cluster
create_cluster() {
    echo -e "${YELLOW}🏗️  Creating GKE cluster...${NC}"
    
    if gcloud container clusters describe ${CLUSTER_NAME} --zone=${ZONE} &> /dev/null; then
        echo -e "${GREEN}✅ Cluster ${CLUSTER_NAME} already exists${NC}"
    else
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
            --disk-type=pd-standard \
            --enable-ip-alias
        
        echo -e "${GREEN}✅ Cluster created successfully${NC}"
    fi
    
    # Get credentials
    gcloud container clusters get-credentials ${CLUSTER_NAME} --zone=${ZONE}
}

# Function to create static IP
create_static_ip() {
    echo -e "${YELLOW}🌐 Creating static IP...${NC}"
    
    if gcloud compute addresses describe baanlomnow-ip --global &> /dev/null; then
        echo -e "${GREEN}✅ Static IP already exists${NC}"
    else
        gcloud compute addresses create baanlomnow-ip --global
        echo -e "${GREEN}✅ Static IP created${NC}"
    fi
    
    # Get IP
    EXTERNAL_IP=$(gcloud compute addresses describe baanlomnow-ip --global --format="value(address)")
    echo -e "${BLUE}📊 External IP: ${EXTERNAL_IP}${NC}"
}

# Function to build and push image
build_and_push_image() {
    echo -e "${YELLOW}🐳 Building and pushing Docker image...${NC}"
    
    # Build image
    docker build -t gcr.io/${PROJECT_ID}/baanlomnow:latest .
    
    # Push image
    docker push gcr.io/${PROJECT_ID}/baanlomnow:latest
    
    echo -e "${GREEN}✅ Image built and pushed successfully${NC}"
}

# Function to update configuration
update_configuration() {
    echo -e "${YELLOW}⚙️  Updating configuration...${NC}"
    
    # Update project ID in files
    sed -i "s/your-project-id/${PROJECT_ID}/g" k8s/deploy.sh
    sed -i "s/your-project-id/${PROJECT_ID}/g" k8s/deployment.yaml
    
    echo -e "${GREEN}✅ Configuration updated${NC}"
}

# Function to deploy application
deploy_application() {
    echo -e "${YELLOW}🚀 Deploying application...${NC}"
    
    # Create namespace
    kubectl apply -f k8s/namespace.yaml
    
    # Deploy MongoDB
    kubectl apply -f k8s/mongodb.yaml
    
    # Wait for MongoDB
    echo -e "${YELLOW}⏳ Waiting for MongoDB...${NC}"
    kubectl wait --for=condition=ready pod -l app=mongodb -n ${NAMESPACE} --timeout=300s
    
    # Deploy ConfigMap and Secrets
    kubectl apply -f k8s/configmap.yaml
    kubectl apply -f k8s/secrets.yaml
    
    # Deploy Application
    kubectl apply -f k8s/deployment.yaml
    kubectl apply -f k8s/service.yaml
    
    # Wait for Application
    echo -e "${YELLOW}⏳ Waiting for application...${NC}"
    kubectl wait --for=condition=ready pod -l app=baanlomnow -n ${NAMESPACE} --timeout=300s
    
    # Deploy Ingress
    kubectl apply -f k8s/managed-certificate.yaml
    kubectl apply -f k8s/ingress.yaml
    
    echo -e "${GREEN}✅ Application deployed successfully${NC}"
}

# Function to show status
show_status() {
    echo -e "${GREEN}📊 Deployment Status:${NC}"
    
    echo -e "${BLUE}Pods:${NC}"
    kubectl get pods -n ${NAMESPACE}
    
    echo -e "${BLUE}Services:${NC}"
    kubectl get services -n ${NAMESPACE}
    
    echo -e "${BLUE}Ingress:${NC}"
    kubectl get ingress -n ${NAMESPACE}
    
    # Get external IP
    EXTERNAL_IP=$(kubectl get ingress baanlomnow-ingress -n ${NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "Pending")
    
    echo -e "${BLUE}External IP: ${EXTERNAL_IP}${NC}"
    
    if [ "$EXTERNAL_IP" != "Pending" ]; then
        echo -e "${YELLOW}🌐 You can access your application at: http://${EXTERNAL_IP}${NC}"
        echo -e "${YELLOW}📝 Don't forget to update your DNS to point to this IP${NC}"
    fi
}

# Function to show next steps
show_next_steps() {
    echo -e "${GREEN}🎉 Deployment completed!${NC}"
    echo -e "${YELLOW}📝 Next steps:${NC}"
    echo -e "1. Update your DNS to point to the external IP"
    echo -e "2. Wait for SSL certificate to be ready (may take several minutes)"
    echo -e "3. Test your application"
    echo -e "4. Monitor logs: kubectl logs -f deployment/baanlomnow-app -n ${NAMESPACE}"
    echo -e "5. Scale if needed: kubectl scale deployment baanlomnow-app --replicas=5 -n ${NAMESPACE}"
}

# Main execution
main() {
    check_prerequisites
    get_project_id
    setup_gcloud
    create_cluster
    create_static_ip
    build_and_push_image
    update_configuration
    deploy_application
    show_status
    show_next_steps
}

# Run main function
main
