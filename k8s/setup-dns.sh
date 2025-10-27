#!/bin/bash

# Script to setup DNS for GKE Ingress

set -e

# Configuration
ZONE_NAME="baanlomnow-zone"
DNS_NAME="baanlomnow.com"
INGRESS_IP="34.117.127.211"
TTL=300

echo "🌐 Setting up DNS for GKE Ingress"
echo "===================================="
echo "Zone: ${ZONE_NAME}"
echo "Domain: ${DNS_NAME}"
echo "Ingress IP: ${INGRESS_IP}"
echo ""

# Get actual Ingress IP from cluster
echo "📍 Getting Ingress IP from cluster..."
ACTUAL_IP=$(kubectl get ingress baanlomnow-ingress -n baanlomnow -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")
if [ -z "$ACTUAL_IP" ]; then
    ACTUAL_IP=$INGRESS_IP
    echo "⚠️  Could not get IP from cluster, using: ${ACTUAL_IP}"
else
    echo "✅ Found IP: ${ACTUAL_IP}"
fi

# Check if zone exists
if ! gcloud dns managed-zones describe ${ZONE_NAME} &>/dev/null; then
    echo "📝 Creating DNS zone..."
    gcloud dns managed-zones create ${ZONE_NAME} \
      --dns-name=${DNS_NAME} \
      --description="DNS zone for ${DNS_NAME}" \
      --visibility=public
    
    echo "✅ Zone created successfully!"
else
    echo "✅ Zone already exists"
fi

# Get nameservers
echo ""
echo "🔍 Current nameservers:"
gcloud dns managed-zones describe ${ZONE_NAME} --format="value(nameServers)"

# Create transaction
echo ""
echo "📝 Adding DNS records..."
gcloud dns record-sets transaction start --zone=${ZONE_NAME}

# Add A record for root domain
echo "  Adding A record..."
gcloud dns record-sets transaction add ${ACTUAL_IP} \
  --name=${DNS_NAME} \
  --ttl=${TTL} \
  --type=A \
  --zone=${ZONE_NAME} \
  --quiet || true  # Ignore if exists

# Add CNAME for www
echo "  Adding CNAME record for www..."
gcloud dns record-sets transaction add ${DNS_NAME}. \
  --name=www.${DNS_NAME} \
  --ttl=${TTL} \
  --type=CNAME \
  --zone=${ZONE_NAME} \
  --quiet || true  # Ignore if exists

# Execute transaction
gcloud dns record-sets transaction execute --zone=${ZONE_NAME}

echo ""
echo "✅ DNS records added successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Copy the nameservers above"
echo "2. Update nameservers in your domain registrar:"
echo "   - Login to your registrar (Namecheap, GoDaddy, etc.)"
echo "   - Go to DNS/Nameservers settings"
echo "   - Update to Google Cloud DNS nameservers"
echo ""
echo "3. Wait for DNS propagation (5-60 minutes)"
echo ""
echo "4. Test DNS resolution:"
echo "   dig ${DNS_NAME} A"
echo "   curl http://${DNS_NAME}/api/health"
echo ""
echo "🔍 To view nameservers:"
echo "   gcloud dns managed-zones describe ${ZONE_NAME} --format='value(nameServers)'"

