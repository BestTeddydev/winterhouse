#!/bin/bash

# Baanlomnow Secrets Management Script
# This script helps manage secrets for the Baanlomnow GKE deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔐 Baanlomnow Secrets Management${NC}"

# Function to encode to base64
encode_base64() {
    echo -n "$1" | base64
}

# Function to decode from base64
decode_base64() {
    echo -n "$1" | base64 -d
}

# Function to create secrets interactively
create_secrets() {
    echo -e "${YELLOW}📝 Creating secrets interactively...${NC}"
    
    # MongoDB
    read -p "Enter MongoDB URI: " MONGODB_URI
    read -s -p "Enter MongoDB Root Password: " MONGODB_ROOT_PASSWORD
    echo
    
    # NextAuth
    read -s -p "Enter NextAuth Secret: " NEXTAUTH_SECRET
    echo
    
    # Google Cloud
    read -p "Enter Google Cloud Project ID: " GOOGLE_CLOUD_PROJECT_ID
    read -p "Enter Google Cloud Storage Bucket: " GOOGLE_CLOUD_STORAGE_BUCKET
    
    # Payment Gateways
    read -s -p "Enter Stripe Secret Key: " STRIPE_SECRET_KEY
    echo
    
    # Email Service
    read -s -p "Enter Resend API Key: " RESEND_API_KEY
    echo
    
    # LINE Integration
    read -s -p "Enter LINE Channel Secret: " LINE_CHANNEL_SECRET
    echo
    read -s -p "Enter LINE Channel Access Token: " LINE_CHANNEL_ACCESS_TOKEN
    echo
    
    # Create secrets.yaml
    cat > k8s/secrets.yaml << EOF
apiVersion: v1
kind: Secret
metadata:
  name: baanlomnow-secrets
  namespace: baanlomnow
type: Opaque
data:
  MONGODB_URI: $(encode_base64 "$MONGODB_URI")
  MONGODB_ROOT_PASSWORD: $(encode_base64 "$MONGODB_ROOT_PASSWORD")
  NEXTAUTH_SECRET: $(encode_base64 "$NEXTAUTH_SECRET")
  GOOGLE_CLOUD_PROJECT_ID: $(encode_base64 "$GOOGLE_CLOUD_PROJECT_ID")
  GOOGLE_CLOUD_STORAGE_BUCKET: $(encode_base64 "$GOOGLE_CLOUD_STORAGE_BUCKET")
  STRIPE_SECRET_KEY: $(encode_base64 "$STRIPE_SECRET_KEY")
  RESEND_API_KEY: $(encode_base64 "$RESEND_API_KEY")
  LINE_CHANNEL_SECRET: $(encode_base64 "$LINE_CHANNEL_SECRET")
  LINE_CHANNEL_ACCESS_TOKEN: $(encode_base64 "$LINE_CHANNEL_ACCESS_TOKEN")
EOF
    
    echo -e "${GREEN}✅ Secrets file created: k8s/secrets.yaml${NC}"
}

# Function to update configmap
update_configmap() {
    echo -e "${YELLOW}📝 Updating ConfigMap...${NC}"
    
    read -p "Enter your domain (e.g., baanlomnow.com): " DOMAIN
    read -p "Enter Stripe Public Key: " STRIPE_PUBLIC_KEY
    read -p "Enter LINE Channel ID: " LINE_CHANNEL_ID
    
    # Update configmap.yaml
    cat > k8s/configmap.yaml << EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: baanlomnow-config
  namespace: baanlomnow
data:
  NODE_ENV: "production"
  NEXT_TELEMETRY_DISABLED: "1"
  PORT: "3000"
  HOSTNAME: "0.0.0.0"
  MONGODB_URI: "mongodb://mongodb-service:27017/baanlomnow"
  NEXTAUTH_URL: "https://${DOMAIN}"
  NEXTAUTH_SECRET: "your-nextauth-secret"
  GOOGLE_CLOUD_PROJECT_ID: "your-project-id"
  GOOGLE_CLOUD_STORAGE_BUCKET: "your-bucket-name"
  STRIPE_PUBLIC_KEY: "${STRIPE_PUBLIC_KEY}"
  STRIPE_SECRET_KEY: "your-stripe-secret-key"
  RESEND_API_KEY: "your-resend-api-key"
  LINE_CHANNEL_ID: "${LINE_CHANNEL_ID}"
  LINE_CHANNEL_SECRET: "your-line-channel-secret"
  LINE_CHANNEL_ACCESS_TOKEN: "your-line-channel-access-token"
EOF
    
    echo -e "${GREEN}✅ ConfigMap updated: k8s/configmap.yaml${NC}"
}

# Function to update ingress with domain
update_ingress() {
    echo -e "${YELLOW}📝 Updating Ingress with domain...${NC}"
    
    read -p "Enter your domain (e.g., baanlomnow.com): " DOMAIN
    read -p "Enter your project ID: " PROJECT_ID
    
    # Update ingress.yaml
    cat > k8s/ingress.yaml << EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: baanlomnow-ingress
  namespace: baanlomnow
  annotations:
    kubernetes.io/ingress.class: "gce"
    kubernetes.io/ingress.global-static-ip-name: "baanlomnow-ip"
    networking.gke.io/managed-certificates: "baanlomnow-ssl-cert"
    kubernetes.io/ingress.allow-http: "false"
spec:
  rules:
  - host: ${DOMAIN}
    http:
      paths:
      - path: /*
        pathType: ImplementationSpecific
        backend:
          service:
            name: baanlomnow-service
            port:
              number: 80
EOF
    
    # Update managed-certificate.yaml
    cat > k8s/managed-certificate.yaml << EOF
apiVersion: networking.gke.io/v1
kind: ManagedCertificate
metadata:
  name: baanlomnow-ssl-cert
  namespace: baanlomnow
spec:
  domains:
    - ${DOMAIN}
EOF
    
    # Update deploy.sh with project ID
    sed -i "s/your-project-id/${PROJECT_ID}/g" k8s/deploy.sh
    
    echo -e "${GREEN}✅ Ingress updated with domain: ${DOMAIN}${NC}"
    echo -e "${GREEN}✅ Deploy script updated with project ID: ${PROJECT_ID}${NC}"
}

# Function to validate secrets
validate_secrets() {
    echo -e "${YELLOW}🔍 Validating secrets...${NC}"
    
    if [ ! -f "k8s/secrets.yaml" ]; then
        echo -e "${RED}❌ Secrets file not found: k8s/secrets.yaml${NC}"
        return 1
    fi
    
    # Check if secrets are base64 encoded
    echo -e "${BLUE}📊 Checking secret encoding...${NC}"
    
    # Extract and validate each secret
    
    for secret in "${SECRETS[@]}"; do
        VALUE=$(grep -A 1 "name: baanlomnow-secrets" k8s/secrets.yaml | grep -A 20 "data:" | grep "${secret}:" | cut -d' ' -f4)
        if [ -n "$VALUE" ]; then
            # Try to decode
            if echo "$VALUE" | base64 -d >/dev/null 2>&1; then
                echo -e "${GREEN}✅ ${secret} is properly encoded${NC}"
            else
                echo -e "${RED}❌ ${secret} is not properly base64 encoded${NC}"
            fi
        else
            echo -e "${RED}❌ ${secret} not found in secrets${NC}"
        fi
    done
}

# Function to show help
show_help() {
    echo -e "${BLUE}🔐 Baanlomnow Secrets Management${NC}"
    echo -e "${YELLOW}Usage: $0 [command]${NC}"
    echo
    echo -e "${GREEN}Commands:${NC}"
    echo -e "  create     - Create secrets interactively"
    echo -e "  config     - Update ConfigMap with public values"
    echo -e "  ingress    - Update Ingress with domain and project ID"
    echo -e "  validate   - Validate existing secrets"
    echo -e "  help       - Show this help message"
    echo
    echo -e "${YELLOW}Examples:${NC}"
    echo -e "  $0 create     # Create secrets interactively"
    echo -e "  $0 config     # Update ConfigMap"
    echo -e "  $0 ingress    # Update Ingress with domain"
    echo -e "  $0 validate   # Validate secrets"
}

# Main script logic
case "${1:-help}" in
    "create")
        create_secrets
        ;;
    "config")
        update_configmap
        ;;
    "ingress")
        update_ingress
        ;;
    "validate")
        validate_secrets
        ;;
    "help"|*)
        show_help
        ;;
esac

echo -e "${GREEN}🎉 Operation completed!${NC}"
