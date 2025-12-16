#!/bin/bash

# Script to set deployment image to a specific version
# Usage: ./set-image.sh <version>
# Example: ./set-image.sh 1.1.1

set -e

# Configuration
IMAGE_NAME="baanlomnow"
VERSION="${1:-1.1.1}"
REGISTRY="asia-southeast1-docker.pkg.dev"
PROJECT_ID="project-14a6d9ab-7aaf-49a0-92d"
REPOSITORY="baanlomnow-repository"
DEPLOYMENT_NAME="baanlomnow-app"
NAMESPACE="baanlomnow"

# Full image path
IMAGE_PATH="${REGISTRY}/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}:${VERSION}"

echo "🚀 Setting deployment image..."
echo "📍 Deployment: ${DEPLOYMENT_NAME}"
echo "📦 Namespace: ${NAMESPACE}"
echo "🖼️  Image: ${IMAGE_PATH}"
echo "🏷️  Version: ${VERSION}"
echo ""

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed or not in PATH"
    exit 1
fi

# Check if image exists in Artifact Registry
echo "🔍 Checking if image exists in Artifact Registry..."
if ! gcloud artifacts docker images list \
    "${REGISTRY}/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}" \
    --filter="tags:${VERSION}" \
    --format="value(package)" &> /dev/null; then
    echo "⚠️  Warning: Image ${IMAGE_PATH} may not exist in Artifact Registry"
    echo "💡 You may need to build and push the image first:"
    echo "   bash k8s/build-multi-arch.sh ${VERSION}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Set the image
echo ""
echo "🔄 Updating deployment image..."
kubectl set image deployment/${DEPLOYMENT_NAME} \
    ${DEPLOYMENT_NAME}=${IMAGE_PATH} \
    -n ${NAMESPACE}

echo ""
echo "✅ Image updated successfully!"
echo ""
echo "📊 Monitoring rollout status..."
kubectl rollout status deployment/${DEPLOYMENT_NAME} -n ${NAMESPACE} --timeout=5m

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "🔍 Verify with:"
echo "   kubectl get pods -n ${NAMESPACE}"
echo "   kubectl describe deployment ${DEPLOYMENT_NAME} -n ${NAMESPACE}"

