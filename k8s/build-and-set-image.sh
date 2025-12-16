#!/bin/bash

# Script to build multi-arch image and set it to deployment
# Usage: ./build-and-set-image.sh <version>
# Example: ./build-and-set-image.sh 1.1.1

set -e

# Configuration
IMAGE_NAME="baanlomnow"
VERSION="${1:-1.1.1}"
REGISTRY="asia-southeast1-docker.pkg.dev"
PROJECT_ID="project-14a6d9ab-7aaf-49a0-92d"
REPOSITORY="baanlomnow-repository"
REGION="asia-southeast1"
DEPLOYMENT_NAME="baanlomnow-app"
NAMESPACE="baanlomnow"

# Full image path
IMAGE_PATH="${REGISTRY}/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}:${VERSION}"

echo "🚀 Building and Deploying Image Version ${VERSION}"
echo "=============================================="
echo ""

# Step 1: Build multi-arch image
echo "📦 Step 1: Building multi-architecture image..."
bash k8s/build-multi-arch.sh ${VERSION}

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "✅ Build completed successfully!"
echo ""

# Step 2: Set image to deployment
echo "🚀 Step 2: Setting image to deployment..."
bash k8s/set-image.sh ${VERSION}

if [ $? -ne 0 ]; then
    echo "❌ Deployment failed!"
    exit 1
fi

echo ""
echo "🎉 All done! Image ${VERSION} has been built and deployed."
echo ""
echo "📋 Summary:"
echo "   - Image: ${IMAGE_PATH}"
echo "   - Deployment: ${DEPLOYMENT_NAME}"
echo "   - Namespace: ${NAMESPACE}"
echo ""
echo "🔍 Verify with:"
echo "   kubectl get pods -n ${NAMESPACE}"
echo "   kubectl describe deployment ${DEPLOYMENT_NAME} -n ${NAMESPACE}"

