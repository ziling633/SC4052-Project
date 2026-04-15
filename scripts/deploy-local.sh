#!/bin/bash

# Local Deployment Test Script
# Test deployment locally using Docker and Docker Compose

set -e

echo "🐳 Testing Local Deployment with Docker"
echo "======================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    exit 1
fi

echo -e "\n${YELLOW}Starting Docker Compose...${NC}"

# Stop any existing containers
docker compose down 2>/dev/null || true

# Build images
echo -e "${YELLOW}Building Docker images...${NC}"
docker compose build

# Start services
echo -e "${YELLOW}Starting services...${NC}"
docker compose up -d

# Wait for services to be ready
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
sleep 5

# Check backend health
echo -e "\n${YELLOW}Testing backend health...${NC}"
if curl -f http://localhost:8000/health &>/dev/null; then
    echo -e "${GREEN}✓ Backend is healthy${NC}"
else
    echo "⚠️  Backend health check failed (might still be starting)"
fi

# Display service URLs
echo -e "\n${GREEN}Services are running:${NC}"
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:8000"
echo "  API Docs:  http://localhost:8000/docs"
echo ""
echo "View logs:"
echo "  Backend:   docker compose logs -f api"
echo "  Frontend:  docker compose logs -f frontend"
echo ""
echo "Stop services:"
echo "  docker compose down"
