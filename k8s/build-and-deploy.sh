#!/bin/bash

# 🚀 Winterhouse Kubernetes Build & Deploy Script
# Script สำหรับ build และ push Docker image ไปยัง Google Container Registry

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_ID="baanlomnow-project"
IMAGE_NAME="baanlomnow"
REGION="asia-southeast1"
CLUSTER_NAME="baanlomnow-cluster"
NAMESPACE="baanlomnow"

echo -e "${BLUE}🚀 Winterhouse Kubernetes Build & Deploy${NC}"
echo "=============================================="

# Function to check if gcloud is installed and authenticated
check_gcloud() {
    echo -e "${YELLOW}🔍 Checking Google Cloud setup...${NC}"
    
    if ! command -v gcloud &> /dev/null; then
        echo -e "${RED}❌ gcloud CLI not found. Please install it first.${NC}"
        echo "Visit: https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        echo -e "${RED}❌ Not authenticated with Google Cloud.${NC}"
        echo "Please run: gcloud auth login"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Google Cloud authentication verified${NC}"
}

# Function to check if kubectl is installed and configured
check_kubectl() {
    echo -e "${YELLOW}🔍 Checking kubectl setup...${NC}"
    
    if ! command -v kubectl &> /dev/null; then
        echo -e "${RED}❌ kubectl not found. Please install it first.${NC}"
        echo "Visit: https://kubernetes.io/docs/tasks/tools/"
        exit 1
    fi
    
    if ! kubectl cluster-info &> /dev/null; then
        echo -e "${RED}❌ kubectl not configured or cluster not accessible.${NC}"
        echo "Please configure kubectl for your cluster"
        exit 1
    fi
    
    echo -e "${GREEN}✅ kubectl configuration verified${NC}"
}

# Function to build Docker image
build_image() {
    echo -e "${YELLOW}🔨 Building Docker image...${NC}"
    
    # Build the image
    docker build -t gcr.io/${PROJECT_ID}/${IMAGE_NAME}:latest .
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Docker image built successfully${NC}"
    else
        echo -e "${RED}❌ Docker image build failed${NC}"
        exit 1
    fi
}

# Function to push image to GCR
push_image() {
    echo -e "${YELLOW}📤 Pushing image to Google Container Registry...${NC}"
    
    # Configure Docker to use gcloud as a credential helper
    gcloud auth configure-docker --quiet
    
    # Push the image
    docker push gcr.io/${PROJECT_ID}/${IMAGE_NAME}:latest
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Image pushed successfully${NC}"
    else
        echo -e "${RED}❌ Image push failed${NC}"
        exit 1
    fi
}

# Function to deploy to Kubernetes
deploy_to_k8s() {
    echo -e "${YELLOW}🚀 Deploying to Kubernetes...${NC}"
    
    # Apply namespace if it doesn't exist
    kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -
    
    # Apply secrets
    if [ -f "k8s/secrets.yaml" ]; then
        echo -e "${BLUE}📝 Applying secrets...${NC}"
        kubectl apply -f k8s/secrets.yaml
    else
        echo -e "${YELLOW}⚠️  secrets.yaml not found. Please create it first.${NC}"
    fi
    
    # Apply configmap
    if [ -f "k8s/configmap.yaml" ]; then
        echo -e "${BLUE}📝 Applying configmap...${NC}"
        kubectl apply -f k8s/configmap.yaml
    else
        echo -e "${YELLOW}⚠️  configmap.yaml not found. Please create it first.${NC}"
    fi
    
    # Apply MongoDB deployment
    if [ -f "k8s/mongodb.yaml" ]; then
        echo -e "${BLUE}📝 Applying MongoDB deployment...${NC}"
        kubectl apply -f k8s/mongodb.yaml
    fi
    
    # Apply service
    if [ -f "k8s/service.yaml" ]; then
        echo -e "${BLUE}📝 Applying service...${NC}"
        kubectl apply -f k8s/service.yaml
    fi
    
    # Apply deployment
    echo -e "${BLUE}📝 Applying application deployment...${NC}"
    kubectl apply -f k8s/deployment.yaml
    
    # Apply ingress
    if [ -f "k8s/ingress.yaml" ]; then
        echo -e "${BLUE}📝 Applying ingress...${NC}"
        kubectl apply -f k8s/ingress.yaml
    fi
    
    echo -e "${GREEN}✅ Kubernetes deployment completed${NC}"
}

# Function to check deployment status
check_deployment() {
    echo -e "${YELLOW}🔍 Checking deployment status...${NC}"
    
    # Wait for deployment to be ready
    kubectl rollout status deployment/baanlomnow-app -n ${NAMESPACE} --timeout=300s
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Deployment is ready${NC}"
    else
        echo -e "${RED}❌ Deployment failed or timed out${NC}"
        echo -e "${YELLOW}📋 Checking pod status...${NC}"
        kubectl get pods -n ${NAMESPACE}
        echo -e "${YELLOW}📋 Checking pod logs...${NC}"
        kubectl logs -l app=baanlomnow -n ${NAMESPACE} --tail=50
        exit 1
    fi
}

# Function to show deployment info
show_info() {
    echo -e "${BLUE}📊 Deployment Information${NC}"
    echo "=========================="
    
    echo -e "${YELLOW}🌐 Services:${NC}"
    kubectl get services -n ${NAMESPACE}
    
    echo -e "\n${YELLOW}🚀 Deployments:${NC}"
    kubectl get deployments -n ${NAMESPACE}
    
    echo -e "\n${YELLOW}📦 Pods:${NC}"
    kubectl get pods -n ${NAMESPACE}
    
    echo -e "\n${YELLOW}🌍 Ingress:${NC}"
    kubectl get ingress -n ${NAMESPACE}
    
    echo -e "\n${YELLOW}🔗 External IP:${NC}"
    kubectl get ingress -n ${NAMESPACE} -o jsonpath='{.items[0].status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "Not available yet"
}

# Function to show logs
show_logs() {
    echo -e "${YELLOW}📋 Application Logs:${NC}"
    kubectl logs -l app=baanlomnow -n ${NAMESPACE} --tail=50
}

# Function to cleanup
cleanup() {
    echo -e "${YELLOW}🧹 Cleaning up local Docker images...${NC}"
    docker rmi gcr.io/${PROJECT_ID}/${IMAGE_NAME}:latest 2>/dev/null || true
    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

# Main execution
main() {
    case "${1:-all}" in
        "check")
            check_gcloud
            check_kubectl
            ;;
        "build")
            check_gcloud
            build_image
            ;;
        "push")
            check_gcloud
            push_image
            ;;
        "deploy")
            check_kubectl
            deploy_to_k8s
            ;;
        "status")
            check_kubectl
            show_info
            ;;
        "logs")
            check_kubectl
            show_logs
            ;;
        "all")
            check_gcloud
            check_kubectl
            build_image
            push_image
            deploy_to_k8s
            check_deployment
            show_info
            ;;
        "cleanup")
            cleanup
            ;;
        "help")
            echo -e "${BLUE}🚀 Winterhouse Kubernetes Build & Deploy${NC}"
            echo -e "${YELLOW}Usage: $0 [command]${NC}"
            echo ""
            echo -e "${GREEN}Commands:${NC}"
            echo -e "  check     - Check gcloud and kubectl setup"
            echo -e "  build     - Build Docker image only"
            echo -e "  push      - Push Docker image to GCR only"
            echo -e "  deploy    - Deploy to Kubernetes only"
            echo -e "  status    - Show deployment status"
            echo -e "  logs      - Show application logs"
            echo -e "  all       - Complete build, push, and deploy process"
            echo -e "  cleanup   - Clean up local Docker images"
            echo -e "  help      - Show this help message"
            echo ""
            echo -e "${YELLOW}Examples:${NC}"
            echo -e "  $0 all      # Complete deployment"
            echo -e "  $0 build    # Build image only"
            echo -e "  $0 deploy   # Deploy only"
            echo -e "  $0 status   # Check status"
            echo ""
            echo -e "${BLUE}Configuration:${NC}"
            echo -e "  PROJECT_ID: ${PROJECT_ID}"
            echo -e "  IMAGE_NAME: ${IMAGE_NAME}"
            echo -e "  REGION: ${REGION}"
            echo -e "  CLUSTER_NAME: ${CLUSTER_NAME}"
            echo -e "  NAMESPACE: ${NAMESPACE}"
            ;;
        *)
            echo -e "${RED}❌ Unknown command: $1${NC}"
            echo "Use '$0 help' for available commands"
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
