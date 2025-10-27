#!/bin/bash

# Script to build and push multi-architecture Docker images
# Supports both AMD64 and ARM64

set -e

# Configuration
IMAGE_NAME="baanlomnow"
IMAGE_TAG="${1:-1.0.1}"  # Accept version as first argument, default to 1.0.1
REGISTRY="asia-southeast1-docker.pkg.dev"
PROJECT_ID="project-14a6d9ab-7aaf-49a0-92d"
REPOSITORY="baanlomnow-repository"
REGION="asia-southeast1"

# Full image path
IMAGE_PATH="${REGISTRY}/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}:${IMAGE_TAG}"

echo "🏗️  Building multi-architecture Docker image..."
echo "📍 Image: ${IMAGE_PATH}"
echo "🏷️  Tag: ${IMAGE_TAG}"
echo "🔧 Architectures: linux/amd64, linux/arm64"
echo ""

# Check if buildx is available
if ! docker buildx version &> /dev/null; then
    echo "❌ docker buildx is not available. Installing..."
    # docker buildx comes with Docker Desktop
    # For Linux, you might need to install it separately
    exit 1
fi

# Create and use a builder instance
echo "🔧 Creating buildx builder..."
docker buildx create --name multiarch --use 2>/dev/null || docker buildx use multiarch
docker buildx inspect --bootstrap

# Authenticate with Artifact Registry
echo ""
echo "🔐 Authenticating with Artifact Registry..."
gcloud auth configure-docker ${REGION}-${REGISTRY} --quiet

# Build and push multi-arch image
echo ""
echo "🔨 Building and pushing multi-architecture image..."
echo "This may take several minutes..."
echo ""

docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --push \
  --tag ${IMAGE_PATH} \
  --file Dockerfile \
  .

echo ""
echo "✅ Multi-architecture image built and pushed successfully!"
echo ""
echo "📋 Image details:"
echo "   - AMD64: ${IMAGE_PATH} (linux/amd64)"
echo "   - ARM64: ${IMAGE_PATH} (linux/arm64)"
echo ""
echo "🔍 Verify with:"
echo "   gcloud artifacts docker images list ${REGION}-${REGISTRY}/${PROJECT_ID}/${REPOSITORY}"

