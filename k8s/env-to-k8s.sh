#!/bin/bash

# 🔐 Environment Variables to Kubernetes Secrets Converter
# Script สำหรับแปลง .env เป็น k8s secrets พร้อม base64 encoding

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔐 Converting .env to Kubernetes Secrets${NC}"

# Function to encode to base64
encode_base64() {
    echo -n "$1" | base64
}

# Function to check if .env file exists
check_env_file() {
    if [ -f ".env" ]; then
        echo -e "${GREEN}✅ Found .env file${NC}"
        return 0
    elif [ -f ".env.local" ]; then
        echo -e "${GREEN}✅ Found .env.local file${NC}"
        return 0
    else
        echo -e "${RED}❌ No .env or .env.local file found${NC}"
        echo -e "${YELLOW}Please create .env file with your environment variables${NC}"
        return 1
    fi
}

# Function to create secrets from .env file
create_secrets_from_env() {
    echo -e "${YELLOW}📝 Creating secrets from .env file...${NC}"
    
    # Check if .env file exists
    if ! check_env_file; then
        return 1
    fi
    
    # Load .env file
    if [ -f ".env" ]; then
        source .env
    elif [ -f ".env.local" ]; then
        source .env.local
    fi
    
    # Create secrets.yaml
    cat > secrets.yaml << EOF
apiVersion: v1
kind: Secret
metadata:
  name: baanlomnow-secrets
  namespace: baanlomnow
type: Opaque
data:
EOF
    
    # List of environment variables to include in secrets
    secret_vars=(
        "MONGODB_URI"
        "MONGODB_ROOT_PASSWORD"
        "NEXTAUTH_SECRET"
        "GOOGLE_CLOUD_PROJECT_ID"
        "GOOGLE_CLOUD_STORAGE_BUCKET"
        "STRIPE_SECRET_KEY"
        "RESEND_API_KEY"
        "LINE_CHANNEL_SECRET"
        "LINE_CHANNEL_ACCESS_TOKEN"
        "LINE_ADMIN_USER_ID"
    )
    
    # Process each environment variable
    for var_name in "${secret_vars[@]}"; do
        var_value="${!var_name}"
        
        if [ -n "$var_value" ]; then
            encoded_value=$(encode_base64 "$var_value")
            echo "  ${var_name}: ${encoded_value}" >> secrets.yaml
            echo -e "${GREEN}✅ ${var_name}${NC}"
        else
            echo -e "${YELLOW}⚠️  ${var_name} - not set${NC}"
        fi
    done
    
    echo -e "${GREEN}✅ Secrets file created: secrets.yaml${NC}"
}

# Function to create configmap from .env file
create_configmap_from_env() {
    echo -e "${YELLOW}📝 Creating configmap from .env file...${NC}"
    
    # Load .env file
    if [ -f ".env" ]; then
        source .env
    elif [ -f ".env.local" ]; then
        source .env.local
    fi
    
    # Get domain from NEXTAUTH_URL or use default
    DOMAIN="${NEXTAUTH_URL:-https://baanlomnow.com}"
    if [[ "$DOMAIN" == http* ]]; then
        DOMAIN=$(echo "$DOMAIN" | sed 's|https\?://||')
    fi
    
    # Create configmap.yaml
    cat > configmap.yaml << EOF
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
  STRIPE_PUBLIC_KEY: "${STRIPE_PUBLIC_KEY:-your-stripe-public-key}"
  STRIPE_SECRET_KEY: "your-stripe-secret-key"
  RESEND_API_KEY: "your-resend-api-key"
  LINE_CHANNEL_ID: "${LINE_CHANNEL_ID:-your-line-channel-id}"
  LINE_CHANNEL_SECRET: "your-line-channel-secret"
  LINE_CHANNEL_ACCESS_TOKEN: "your-line-channel-access-token"
EOF
    
    echo -e "${GREEN}✅ ConfigMap file created: configmap.yaml${NC}"
}

# Function to update ingress with domain from .env
update_ingress_with_domain() {
    echo -e "${YELLOW}📝 Updating ingress with domain from .env...${NC}"
    
    # Load .env file
    if [ -f ".env" ]; then
        source .env
    elif [ -f ".env.local" ]; then
        source .env.local
    fi
    
    # Get domain from NEXTAUTH_URL or use default
    DOMAIN="${NEXTAUTH_URL:-https://baanlomnow.com}"
    if [[ "$DOMAIN" == http* ]]; then
        DOMAIN=$(echo "$DOMAIN" | sed 's|https\?://||')
    fi
    
    # Update ingress.yaml
    cat > ingress.yaml << EOF
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
    cat > managed-certificate.yaml << EOF
apiVersion: networking.gke.io/v1
kind: ManagedCertificate
metadata:
  name: baanlomnow-ssl-cert
  namespace: baanlomnow
spec:
  domains:
    - ${DOMAIN}
    - www.${DOMAIN}
EOF
    
    echo -e "${GREEN}✅ Ingress updated with domain: ${DOMAIN}${NC}"
}

# Function to validate .env file
validate_env_file() {
    echo -e "${YELLOW}🔍 Validating .env file...${NC}"
    
    if ! check_env_file; then
        return 1
    fi
    
    # Load .env file
    if [ -f ".env" ]; then
        source .env
    elif [ -f ".env.local" ]; then
        source .env.local
    fi
    
    # Required variables
    required_vars=(
        "NEXTAUTH_SECRET"
        "LINE_CHANNEL_ID"
        "LINE_CHANNEL_SECRET"
        "LINE_CHANNEL_ACCESS_TOKEN"
    )
    
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            echo -e "${RED}❌ ${var} - MISSING!${NC}"
            missing_vars+=("$var")
        else
            echo -e "${GREEN}✅ ${var}${NC}"
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        echo -e "${RED}❌ Missing ${#missing_vars[@]} required variables${NC}"
        echo -e "${YELLOW}Please set these environment variables in your .env file:${NC}"
        for var in "${missing_vars[@]}"; do
            echo -e "  - ${var}"
        done
        return 1
    else
        echo -e "${GREEN}✅ All required environment variables are set${NC}"
        return 0
    fi
}

# Function to show help
show_help() {
    echo -e "${BLUE}🔐 Environment Variables to Kubernetes Secrets Converter${NC}"
    echo -e "${YELLOW}Usage: $0 [command]${NC}"
    echo
    echo -e "${GREEN}Commands:${NC}"
    echo -e "  secrets     - Create secrets from .env file"
    echo -e "  config      - Create configmap from .env file"
    echo -e "  ingress     - Update ingress with domain from .env"
    echo -e "  all         - Create all configurations from .env"
    echo -e "  validate    - Validate .env file"
    echo -e "  help        - Show this help message"
    echo
    echo -e "${YELLOW}Examples:${NC}"
    echo -e "  $0 secrets     # Create secrets only"
    echo -e "  $0 config      # Create configmap only"
    echo -e "  $0 ingress     # Update ingress only"
    echo -e "  $0 all         # Create all configurations"
    echo -e "  $0 validate    # Validate .env file"
    echo
    echo -e "${BLUE}Required .env variables:${NC}"
    echo -e "  NEXTAUTH_SECRET"
    echo -e "  LINE_CHANNEL_ID"
    echo -e "  LINE_CHANNEL_SECRET"
    echo -e "  LINE_CHANNEL_ACCESS_TOKEN"
    echo -e "  And more..."
}

# Main script logic
case "${1:-help}" in
    "secrets")
        create_secrets_from_env
        ;;
    "config")
        create_configmap_from_env
        ;;
    "ingress")
        update_ingress_with_domain
        ;;
    "all")
        validate_env_file && {
            create_secrets_from_env
            create_configmap_from_env
            update_ingress_with_domain
        }
        ;;
    "validate")
        validate_env_file
        ;;
    "help"|*)
        show_help
        ;;
esac

echo -e "${GREEN}🎉 Operation completed!${NC}"
