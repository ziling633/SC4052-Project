#!/bin/bash

# Vercel Deployment Script
# Deploy frontend to Vercel

set -e

echo "🚀 Deploying to Vercel"
echo "====================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check prerequisites
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Installing Vercel CLI...${NC}"
    npm install -g vercel
fi

# Change to frontend directory
cd frontend

echo -e "\n${YELLOW}Authenticating with Vercel...${NC}"
vercel login

echo -e "\n${YELLOW}Pulling project configuration...${NC}"
vercel pull --yes

echo -e "\n${YELLOW}Building project...${NC}"
vercel build

echo -e "\n${YELLOW}Deploying to production...${NC}"
DEPLOY_URL=$(vercel deploy --prebuilt --prod)

echo -e "\n${GREEN}✅ Deployment Complete!${NC}"
echo "Frontend URL: $DEPLOY_URL"
echo ""
echo "Environment variables to set in Vercel console:"
echo "  NEXT_PUBLIC_API_URL = your-backend-api.run.app"

cd ..
