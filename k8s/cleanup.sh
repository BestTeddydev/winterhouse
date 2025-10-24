#!/bin/bash

# Winterhouse GKE Cleanup Script
# This script removes the Winterhouse application from GKE

set -e

# Configuration
NAMESPACE="baanlomnow"
CLUSTER_NAME="baanlomnow-cluster"
ZONE="asia-southeast1-a"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${RED}🗑️  Starting Winterhouse GKE Cleanup${NC}"

# Function to confirm deletion
confirm_deletion() {
    echo -e "${YELLOW}⚠️  This will delete ALL Winterhouse resources from GKE!${NC}"
    echo -e "${YELLOW}⚠️  This action cannot be undone!${NC}"
    echo
    read -p "Are you sure you want to continue? (yes/no): " CONFIRM
    
    if [ "$CONFIRM" != "yes" ]; then
        echo -e "${GREEN}✅ Cleanup cancelled${NC}"
        exit 0
    fi
}

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Confirm deletion
confirm_deletion

# Get cluster credentials
echo -e "${YELLOW}🔑 Getting cluster credentials${NC}"
gcloud container clusters get-credentials ${CLUSTER_NAME} --zone=${ZONE}

# Delete application resources
echo -e "${YELLOW}🚀 Deleting application resources...${NC}"
kubectl delete -f k8s/deployment.yaml --ignore-not-found=true
kubectl delete -f k8s/service.yaml --ignore-not-found=true
kubectl delete -f k8s/ingress.yaml --ignore-not-found=true
kubectl delete -f k8s/managed-certificate.yaml --ignore-not-found=true

# Delete MongoDB
echo -e "${YELLOW}🍃 Deleting MongoDB...${NC}"
kubectl delete -f k8s/mongodb.yaml --ignore-not-found=true

# Delete secrets and configmap
echo -e "${YELLOW}🔐 Deleting secrets and configmap...${NC}"
kubectl delete -f k8s/secrets.yaml --ignore-not-found=true
kubectl delete -f k8s/configmap.yaml --ignore-not-found=true

# Wait for pods to terminate
echo -e "${YELLOW}⏳ Waiting for pods to terminate...${NC}"
kubectl wait --for=delete pod -l app=baanlomnow -n ${NAMESPACE} --timeout=60s 2>/dev/null || true
kubectl wait --for=delete pod -l app=mongodb -n ${NAMESPACE} --timeout=60s 2>/dev/null || true

# Delete namespace
echo -e "${YELLOW}📁 Deleting namespace...${NC}"
kubectl delete -f k8s/namespace.yaml --ignore-not-found=true

# Wait for namespace to be deleted
echo -e "${YELLOW}⏳ Waiting for namespace to be deleted...${NC}"
kubectl wait --for=delete namespace ${NAMESPACE} --timeout=60s 2>/dev/null || true

# Optional: Delete the entire cluster
echo -e "${YELLOW}🤔 Do you want to delete the entire GKE cluster?${NC}"
echo -e "${YELLOW}This will delete ALL resources in the cluster!${NC}"
read -p "Delete cluster? (yes/no): " DELETE_CLUSTER

if [ "$DELETE_CLUSTER" = "yes" ]; then
    echo -e "${YELLOW}🏗️  Deleting GKE cluster...${NC}"
    gcloud container clusters delete ${CLUSTER_NAME} --zone=${ZONE} --quiet
    
    echo -e "${GREEN}✅ GKE cluster deleted${NC}"
else
    echo -e "${BLUE}📊 Cluster preserved. You can delete it manually with:${NC}"
    echo -e "${BLUE}   gcloud container clusters delete ${CLUSTER_NAME} --zone=${ZONE}${NC}"
fi

# Optional: Delete static IP
echo -e "${YELLOW}🤔 Do you want to delete the static IP address?${NC}"
read -p "Delete static IP? (yes/no): " DELETE_IP

if [ "$DELETE_IP" = "yes" ]; then
    echo -e "${YELLOW}🌐 Deleting static IP...${NC}"
    gcloud compute addresses delete baanlomnow-ip --global --quiet 2>/dev/null || echo -e "${YELLOW}⚠️  Static IP not found or already deleted${NC}"
    
    echo -e "${GREEN}✅ Static IP deleted${NC}"
else
    echo -e "${BLUE}📊 Static IP preserved. You can delete it manually with:${NC}"
    echo -e "${BLUE}   gcloud compute addresses delete baanlomnow-ip --global${NC}"
fi

# Show cleanup status
echo -e "${GREEN}🎉 Cleanup completed!${NC}"
echo -e "${BLUE}📋 Summary:${NC}"
echo -e "  • Application resources: Deleted"
echo -e "  • MongoDB: Deleted"
echo -e "  • Secrets and ConfigMap: Deleted"
echo -e "  • Namespace: Deleted"

if [ "$DELETE_CLUSTER" = "yes" ]; then
    echo -e "  • GKE Cluster: Deleted"
else
    echo -e "  • GKE Cluster: Preserved"
fi

if [ "$DELETE_IP" = "yes" ]; then
    echo -e "  • Static IP: Deleted"
else
    echo -e "  • Static IP: Preserved"
fi

echo -e "${YELLOW}📝 Useful commands for verification:${NC}"
echo -e "  • Check namespaces: kubectl get namespaces"
echo -e "  • Check clusters: gcloud container clusters list"
echo -e "  • Check static IPs: gcloud compute addresses list --global"
echo -e "  • Check all resources: kubectl get all --all-namespaces"
