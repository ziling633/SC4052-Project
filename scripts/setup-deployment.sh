#!/bin/bash

# Campus Flow Deployment Setup Script
# This script sets up everything needed to deploy to Vercel and Google Cloud

set -e

echo "🚀 Campus Flow Deployment Setup"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "\n${YELLOW}1️⃣  Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found. Install from https://www.docker.com/products/docker-desktop${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker is installed${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Install from https://nodejs.org${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js is installed${NC}"

if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 not found. Install from https://www.python.org${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Python 3 is installed${NC}"

# Test Docker build
echo -e "\n${YELLOW}2️⃣  Testing Docker build for backend...${NC}"
if docker build -t campus-flow-api:test -f backend/Dockerfile backend/ 2>/dev/null; then
    echo -e "${GREEN}✓ Docker build successful${NC}"
else
    echo -e "${RED}❌ Docker build failed. Check your Dockerfile${NC}"
    exit 1
fi

# Test frontend build
echo -e "\n${YELLOW}3️⃣  Testing frontend build...${NC}"
cd frontend
if npm run build &>/dev/null; then
    echo -e "${GREEN}✓ Frontend build successful${NC}"
else
    echo -e "${RED}⚠️  Frontend build failed (this might be okay if it's due to missing env vars)${NC}"
fi
cd ..

# Set up GitHub secrets file
echo -e "\n${YELLOW}4️⃣  Creating GitHub secrets template...${NC}"
cat > .github/SECRETS_TEMPLATE.env << 'EOF'
# GitHub Actions Secrets - Add these to your repository
# Go to: Settings → Secrets and variables → Actions → New repository secret

# Vercel Secrets
VERCEL_TOKEN=your_vercel_token_here
VERCEL_ORG_ID=your_vercel_org_id_here
VERCEL_PROJECT_ID=your_vercel_frontend_project_id_here

# Google Cloud Secrets
GCP_PROJECT_ID=your_gcp_project_id_here
GCP_SA_KEY=your_gcp_service_account_key_json_here (base64 encoded)

# Optional Slack Notifications
SLACK_WEBHOOK_URL=your_slack_webhook_url_here (optional)
EOF
echo -e "${GREEN}✓ Created .github/SECRETS_TEMPLATE.env${NC}"

# Create environment configuration template
echo -e "\n${YELLOW}5️⃣  Creating environment configuration templates...${NC}"
cat > frontend/.env.vercel.example << 'EOF'
# Vercel Environment Variables
NEXT_PUBLIC_API_URL=https://your-backend-domain.run.app
FIREBASE_API_KEY=your_firebase_api_key_here
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain_here
FIREBASE_PROJECT_ID=your_firebase_project_id_here
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket_here
FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id_here
FIREBASE_APP_ID=your_firebase_app_id_here
EOF
echo -e "${GREEN}✓ Created frontend/.env.vercel.example${NC}"

cat > backend/.env.production.example << 'EOF'
# Google Cloud Production Environment
ENV=production
FIREBASE_CREDENTIALS=/secrets/firebase
PYTHONUNBUFFERED=TRUE
EOF
echo -e "${GREEN}✓ Created backend/.env.production.example${NC}"

echo -e "\n${GREEN}✅ Setup Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Set up Vercel account: https://vercel.com"
echo "2. Set up Google Cloud account: https://cloud.google.com"
echo "3. Add GitHub secrets from .github/SECRETS_TEMPLATE.env"
echo "4. Run: ./scripts/deploy-local.sh (to test locally with Docker)"
echo "5. Push to main branch to trigger automated deployment"
echo ""
echo "For detailed deployment instructions, see DEPLOYMENT_INSTRUCTIONS.md"
