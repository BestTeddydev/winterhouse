#!/bin/bash

# Script to update deployment configuration on cloud
# This applies the updated resource limits and health check probes

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Updating Deployment Configuration on Cloud${NC}"
echo "=============================================="
echo ""

NAMESPACE="baanlomnow"
DEPLOYMENT_FILE="k8s/deployment.prod.yaml"

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl is not installed or not in PATH${NC}"
    exit 1
fi

# Check if deployment file exists
if [ ! -f "$DEPLOYMENT_FILE" ]; then
    echo -e "${RED}❌ Deployment file not found: $DEPLOYMENT_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Current deployment configuration:${NC}"
echo "  - Memory requests: 256Mi"
echo "  - Memory limits: 768Mi"
echo "  - CPU requests: 100m"
echo "  - CPU limits: 500m"
echo "  - Liveness probe: initialDelay=60s, period=30s, timeout=10s, failureThreshold=3"
echo "  - Readiness probe: initialDelay=30s, period=10s, timeout=5s, failureThreshold=3"
echo ""

# Check current deployment status
echo -e "${BLUE}📊 Checking current deployment status...${NC}"
if kubectl get deployment baanlomnow-app -n $NAMESPACE &> /dev/null; then
    echo -e "${GREEN}✅ Deployment found${NC}"
    kubectl get deployment baanlomnow-app -n $NAMESPACE
    echo ""
else
    echo -e "${YELLOW}⚠️  Deployment not found. Will create new deployment.${NC}"
    echo ""
fi

# Ask for confirmation
echo -e "${YELLOW}⚠️  This will update the deployment configuration.${NC}"
echo -e "${YELLOW}   The pods will be restarted with new settings.${NC}"
echo ""
read -p "Continue? (y/N): " confirm

if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}❌ Cancelled${NC}"
    exit 0
fi

# Apply the deployment
echo ""
echo -e "${BLUE}🚀 Applying updated deployment configuration...${NC}"
kubectl apply -f $DEPLOYMENT_FILE

echo ""
echo -e "${BLUE}⏳ Waiting for rollout to complete...${NC}"
kubectl rollout status deployment/baanlomnow-app -n $NAMESPACE --timeout=300s

echo ""
echo -e "${GREEN}✅ Deployment updated successfully!${NC}"
echo ""

# Show updated deployment
echo -e "${BLUE}📊 Updated deployment status:${NC}"
kubectl get deployment baanlomnow-app -n $NAMESPACE
echo ""

# Show pods
echo -e "${BLUE}📦 Pod status:${NC}"
kubectl get pods -n $NAMESPACE -l app=baanlomnow,component=app
echo ""

# Show resource usage
echo -e "${BLUE}💻 Resource configuration:${NC}"
kubectl describe deployment baanlomnow-app -n $NAMESPACE | grep -A 10 "Resources:"
echo ""

# Show health check probes
echo -e "${BLUE}🏥 Health check probes:${NC}"
kubectl describe deployment baanlomnow-app -n $NAMESPACE | grep -A 15 "Liveness:"
kubectl describe deployment baanlomnow-app -n $NAMESPACE | grep -A 15 "Readiness:"
echo ""

echo -e "${GREEN}✅ All done!${NC}"
echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo "  - Monitor pod restarts: kubectl get pods -n $NAMESPACE -w"
echo "  - Check pod logs: kubectl logs -n $NAMESPACE -l app=baanlomnow,component=app --tail=50"
echo "  - View pod events: kubectl describe pod -n $NAMESPACE -l app=baanlomnow,component=app"

