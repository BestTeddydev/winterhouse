#!/bin/bash

# Script to update Artifact Registry secret with latest access token

echo "🔐 Updating Artifact Registry secret..."

kubectl create secret docker-registry artifact-registry-json-key \
  --docker-server=asia-southeast1-docker.pkg.dev \
  --docker-username=oauth2accesstoken \
  --docker-password="$(gcloud auth print-access-token)" \
  --namespace=baanlomnow \
  --dry-run=client -o yaml | kubectl apply -f -

echo "✅ Secret updated successfully!"
