#!/bin/bash

# Google Cloud Deployment Script
# Deploy backend to Google Cloud Run

set -e

echo "☁️  Deploying to Google Cloud Run"
echo "=================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check prerequisites
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI not installed${NC}"
    echo "Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not installed${NC}"
    exit 1
fi

# Get project ID
echo -e "\n${YELLOW}Setting up Google Cloud...${NC}"
read -p "Enter your GCP Project ID: " PROJECT_ID

# Authenticate with Google Cloud
echo -e "${YELLOW}Authenticating with Google Cloud...${NC}"
gcloud auth login
gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "${YELLOW}Enabling required APIs...${NC}"
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com

# Build and push Docker image
echo -e "\n${YELLOW}Building Docker image...${NC}"
cd backend
docker build -t gcr.io/$PROJECT_ID/campus-flow-api:latest -f Dockerfile .

echo -e "${YELLOW}Configuring Docker authentication...${NC}"
gcloud auth configure-docker

echo -e "${YELLOW}Pushing image to Container Registry...${NC}"
docker push gcr.io/$PROJECT_ID/campus-flow-api:latest

# Deploy to Cloud Run
echo -e "\n${YELLOW}Deploying to Cloud Run...${NC}"
gcloud run deploy campus-flow-api \
  --image gcr.io/$PROJECT_ID/campus-flow-api:latest \
  --platform managed \
  --region us-central1 \
  --memory 512Mi \
  --cpu 1 \
  --allow-unauthenticated \
  --timeout 3600 \
  --max-instances 100

# Get the service URL
echo -e "\n${YELLOW}Retrieving service URL...${NC}"
SERVICE_URL=$(gcloud run services describe campus-flow-api --region us-central1 --format='value(status.url)')

echo -e "\n${GREEN}✅ Deployment Complete!${NC}"
echo "Backend URL: $SERVICE_URL"
echo ""
echo "Next steps:"
echo "1. Add environment variables in Cloud Run console"
echo "2. Update frontend NEXT_PUBLIC_API_URL: $SERVICE_URL"
echo "3. Deploy frontend to Vercel"

cd ..
