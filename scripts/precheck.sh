#!/bin/bash

# Production Deployment Pre-check Script
# Verify everything is ready before deployment

echo "🔍 Pre-Deployment Health Check"
echo "=============================="

ERRORS=0

# Check 1: Git status
echo -n "Checking git status... "
if git status --porcelain | grep -q "^??"; then
    echo "⚠️  Untracked files present"
fi

if git status --porcelain | grep -q ".env"; then
    echo "❌ ERROR: .env files detected in git"
    ERRORS=$((ERRORS + 1))
else
    echo "✓"
fi

# Check 2: Backend tests
echo -n "Running backend tests... "
cd backend
if python -m pytest test_endpoints.py -q 2>/dev/null; then
    echo "✓"
else
    echo "⚠️  Tests failed or not found"
fi
cd ..

# Check 3: Frontend build
echo -n "Testing frontend build... "
cd frontend
if npm run build > /dev/null 2>&1; then
    echo "✓"
else
    echo "❌ Frontend build failed"
    ERRORS=$((ERRORS + 1))
fi
cd ..

# Check 4: Docker images
echo -n "Checking Docker images... "
if docker build -t campus-flow-api:test -f backend/Dockerfile backend/ > /dev/null 2>&1; then
    echo "✓"
else
    echo "❌ Docker build failed"
    ERRORS=$((ERRORS + 1))
fi

# Check 5: Environment files
echo -n "Checking required files... "
FILES_NEEDED=(
    ".github/workflows/deploy.yml"
    "backend/Dockerfile"
    "frontend/Dockerfile"
    "docker-compose.yml"
    "DEPLOYMENT_INSTRUCTIONS.md"
)

MISSING=0
for file in "${FILES_NEEDED[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing: $file"
        MISSING=$((MISSING + 1))
        ERRORS=$((ERRORS + 1))
    fi
done

if [ $MISSING -eq 0 ]; then
    echo "✓"
fi

# Summary
echo ""
if [ $ERRORS -eq 0 ]; then
    echo "✅ Pre-deployment check PASSED"
    echo ""
    echo "Ready to deploy! Run:"
    echo "  bash scripts/deploy-vercel.sh  (for frontend)"
    echo "  bash scripts/deploy-gcloud.sh  (for backend)"
    exit 0
else
    echo "❌ Pre-deployment check FAILED ($ERRORS issues found)"
    exit 1
fi
