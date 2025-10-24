#!/bin/bash

# Winterhouse GKE Testing Script
# This script tests the deployed Winterhouse application

set -e

# Configuration
NAMESPACE="baanlomnow"
SERVICE_NAME="baanlomnow-service"
INGRESS_NAME="baanlomnow-ingress"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Starting Winterhouse GKE Testing${NC}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${YELLOW}🔍 Checking prerequisites...${NC}"
if ! command_exists kubectl; then
    echo -e "${RED}❌ kubectl is not installed${NC}"
    exit 1
fi

if ! command_exists curl; then
    echo -e "${RED}❌ curl is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Test 1: Check namespace
echo -e "${YELLOW}📁 Testing namespace...${NC}"
if kubectl get namespace ${NAMESPACE} >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Namespace '${NAMESPACE}' exists${NC}"
else
    echo -e "${RED}❌ Namespace '${NAMESPACE}' not found${NC}"
    exit 1
fi

# Test 2: Check pods
echo -e "${YELLOW}🔄 Testing pods...${NC}"
PODS=$(kubectl get pods -n ${NAMESPACE} --no-headers | wc -l)
if [ $PODS -gt 0 ]; then
    echo -e "${GREEN}✅ Found ${PODS} pods in namespace${NC}"
    
    # Check pod status
    RUNNING_PODS=$(kubectl get pods -n ${NAMESPACE} --field-selector=status.phase=Running --no-headers | wc -l)
    echo -e "${BLUE}📊 Running pods: ${RUNNING_PODS}/${PODS}${NC}"
    
    # Show pod details
    kubectl get pods -n ${NAMESPACE}
else
    echo -e "${RED}❌ No pods found in namespace${NC}"
    exit 1
fi

# Test 3: Check services
echo -e "${YELLOW}🌐 Testing services...${NC}"
if kubectl get service ${SERVICE_NAME} -n ${NAMESPACE} >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Service '${SERVICE_NAME}' exists${NC}"
    
    # Get service details
    SERVICE_IP=$(kubectl get service ${SERVICE_NAME} -n ${NAMESPACE} -o jsonpath='{.spec.clusterIP}')
    SERVICE_PORT=$(kubectl get service ${SERVICE_NAME} -n ${NAMESPACE} -o jsonpath='{.spec.ports[0].port}')
    echo -e "${BLUE}📊 Service IP: ${SERVICE_IP}:${SERVICE_PORT}${NC}"
else
    echo -e "${RED}❌ Service '${SERVICE_NAME}' not found${NC}"
fi

# Test 4: Check ingress
echo -e "${YELLOW}🚪 Testing ingress...${NC}"
if kubectl get ingress ${INGRESS_NAME} -n ${NAMESPACE} >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Ingress '${INGRESS_NAME}' exists${NC}"
    
    # Get external IP
    EXTERNAL_IP=$(kubectl get ingress ${INGRESS_NAME} -n ${NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")
    if [ -n "$EXTERNAL_IP" ]; then
        echo -e "${BLUE}📊 External IP: ${EXTERNAL_IP}${NC}"
    else
        echo -e "${YELLOW}⚠️  External IP not yet assigned${NC}"
    fi
else
    echo -e "${RED}❌ Ingress '${INGRESS_NAME}' not found${NC}"
fi

# Test 5: Health check
echo -e "${YELLOW}🏥 Testing health endpoint...${NC}"
HEALTH_POD=$(kubectl get pods -n ${NAMESPACE} -l app=baanlomnow --field-selector=status.phase=Running -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")

if [ -n "$HEALTH_POD" ]; then
    echo -e "${BLUE}📊 Testing health on pod: ${HEALTH_POD}${NC}"
    
    # Port forward for testing
    kubectl port-forward pod/${HEALTH_POD} 3000:3000 -n ${NAMESPACE} &
    PORT_FORWARD_PID=$!
    
    # Wait for port forward to be ready
    sleep 5
    
    # Test health endpoint
    if curl -f -s http://localhost:3000/api/health >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Health endpoint is responding${NC}"
    else
        echo -e "${RED}❌ Health endpoint is not responding${NC}"
    fi
    
    # Kill port forward
    kill $PORT_FORWARD_PID 2>/dev/null || true
else
    echo -e "${RED}❌ No running baanlomnow pods found${NC}"
fi

# Test 6: Database connectivity
echo -e "${YELLOW}🍃 Testing MongoDB connectivity...${NC}"
MONGODB_POD=$(kubectl get pods -n ${NAMESPACE} -l app=mongodb --field-selector=status.phase=Running -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")

if [ -n "$MONGODB_POD" ]; then
    echo -e "${BLUE}📊 Testing MongoDB on pod: ${MONGODB_POD}${NC}"
    
    # Test MongoDB connection
    if kubectl exec ${MONGODB_POD} -n ${NAMESPACE} -- mongosh --eval "db.runCommand('ping')" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ MongoDB is responding${NC}"
    else
        echo -e "${RED}❌ MongoDB is not responding${NC}"
    fi
else
    echo -e "${RED}❌ No running MongoDB pods found${NC}"
fi

# Test 7: Resource usage
echo -e "${YELLOW}📊 Testing resource usage...${NC}"
kubectl top pods -n ${NAMESPACE} 2>/dev/null || echo -e "${YELLOW}⚠️  Metrics server not available${NC}"

# Test 8: Logs check
echo -e "${YELLOW}📝 Checking recent logs...${NC}"
APP_POD=$(kubectl get pods -n ${NAMESPACE} -l app=baanlomnow --field-selector=status.phase=Running -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")

if [ -n "$APP_POD" ]; then
    echo -e "${BLUE}📊 Recent logs from ${APP_POD}:${NC}"
    kubectl logs ${APP_POD} -n ${NAMESPACE} --tail=10
else
    echo -e "${RED}❌ No running baanlomnow pods found for log check${NC}"
fi

# Summary
echo -e "${GREEN}🎉 Testing completed!${NC}"
echo -e "${BLUE}📋 Summary:${NC}"
echo -e "  • Namespace: ${NAMESPACE}"
echo -e "  • Total Pods: ${PODS}"
echo -e "  • Running Pods: ${RUNNING_PODS}"
echo -e "  • Service: ${SERVICE_NAME}"
echo -e "  • Ingress: ${INGRESS_NAME}"

if [ -n "$EXTERNAL_IP" ]; then
    echo -e "  • External IP: ${EXTERNAL_IP}"
    echo -e "${YELLOW}🌐 You can access your application at: http://${EXTERNAL_IP}${NC}"
fi

echo -e "${YELLOW}📝 Useful commands:${NC}"
echo -e "  • View pods: kubectl get pods -n ${NAMESPACE}"
echo -e "  • View logs: kubectl logs -f deployment/baanlomnow-app -n ${NAMESPACE}"
echo -e "  • Scale app: kubectl scale deployment baanlomnow-app --replicas=3 -n ${NAMESPACE}"
echo -e "  • Delete deployment: kubectl delete -f k8s/ -n ${NAMESPACE}"
