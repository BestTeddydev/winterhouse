#!/bin/bash

# Script to build and push Docker image to Google Artifact Registry

set -e

# Configuration
PROJECT_ID="project-14a6d9ab-7aaf-49a0-92d"
REGION="asia-southeast1"
REPOSITORY="baanlomnow-repository"
IMAGE_NAME="baanlomnow"
IMAGE_TAG="1.0"
IMAGE_PATH="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}:${IMAGE_TAG}"

echo "🚀 Building and pushing to Google Artifact Registry..."
echo "📍 Project: ${PROJECT_ID}"
echo "📍 Region: ${REGION}"
echo "📍 Repository: ${REPOSITORY}"
echo "📍 Image: ${IMAGE_NAME}:${IMAGE_TAG}"
echo ""

# Authenticate with Artifact Registry
echo "🔐 Authenticating with Artifact Registry..."
gcloud auth configure-docker ${REGION}-docker.pkg.dev --quiet

# Build the Docker image
echo "🔨 Building Docker image..."
docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .

# Tag the image for Artifact Registry
echo "🏷️  Tagging image..."
docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${IMAGE_PATH}

# Push the image to Artifact Registry
echo "📤 Pushing image to Artifact Registry..."
docker push ${IMAGE_PATH}

echo ""
echo "✅ Successfully pushed image to Artifact Registry!"
echo "📍 Image: ${IMAGE_PATH}"
echo ""
echo "🎯 Next steps:"
echo "   1. Update Kubernetes deployment:"
echo "      kubectl apply -f k8s/deployment.yaml"
echo "   2. Verify the deployment:"
echo "      kubectl rollout status deployment/baanlomnow-app -n baanlomnow"
