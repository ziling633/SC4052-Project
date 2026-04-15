#!/bin/bash

# Render Deployment Script
# Deploy FastAPI backend to Render.com

set -e

echo "🚀 Deploying to Render"
echo "====================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

cd backend

echo -e "\n${YELLOW}1. Create render.yaml configuration...${NC}"

cat > render.yaml << 'EOF'
services:
  - type: web
    name: campus-flow-api
    env: python
    plan: free
    buildCommand: "pip install -r requirements.txt"
    startCommand: "uvicorn main:app --host 0.0.0.0 --port 8000"
    envVars:
      - key: PYTHON_VERSION
        value: 3.11
      - key: ENV
        value: production
EOF

echo -e "${GREEN}✓ Created render.yaml${NC}"

echo -e "\n${YELLOW}2. Instructions to deploy:${NC}"
echo ""
echo "1. Go to https://render.com"
echo "2. Sign up with GitHub"
echo "3. Click 'New +' → 'Web Service'"
echo "4. Select your 'SC4052-Project' repository"
echo "5. Select branch 'main'"
echo "6. Configure:"
echo "   - Name: campus-flow-api"
echo "   - Environment: Python 3"
echo "   - Build Command: pip install -r requirements.txt"
echo "   - Start Command: uvicorn main:app --host 0.0.0.0 --port 8000"
echo "   - Plan: Free"
echo "7. Click 'Create Web Service'"
echo "8. Wait 2-3 minutes for deployment"
echo ""
echo -e "${GREEN}✓ Your backend will be deployed!${NC}"
echo ""
echo "You'll get a URL like: https://campus-flow-api-xxxxx.onrender.com"
echo ""
echo "Then update your frontend with this URL!"

cd ..
