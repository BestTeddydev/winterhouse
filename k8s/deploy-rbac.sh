#!/bin/bash

# Deploy RBAC and Service Account Configuration
# This script applies the necessary RBAC permissions for the Node Service Account

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔐 Deploying RBAC Configuration${NC}"
echo "===================================="
echo ""

# Apply namespace first (if not exists)
echo -e "${YELLOW}📁 Checking namespace...${NC}"
kubectl apply -f namespace.yaml

echo ""
echo -e "${YELLOW}🔐 Applying RBAC configuration...${NC}"
kubectl apply -f rbac.yaml

echo ""
echo -e "${GREEN}✅ RBAC configuration applied successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Verifying ServiceAccount...${NC}"
kubectl get serviceaccount baanlomnow-sa -n baanlomnow

echo ""
echo -e "${GREEN}✅ Deploy RBAC completed!${NC}"
echo ""
echo -e "${YELLOW}💡 Next step: Apply deployment with ServiceAccount${NC}"
echo "   kubectl apply -f deployment.yaml"

