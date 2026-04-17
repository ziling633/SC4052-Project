# Phase 5: Deployment & Production Ready

**Duration:** 2 weeks  
**Goal:** Deploy to production with Docker + cloud platform  
**Priority Level:** 🟠 VALUE-ADD - Goes live!

---

## 📋 Phase Overview

In Phase 5, you'll make your system **production-ready and deployed**:

- ✅ Containerize with Docker
- ✅ Deploy frontend to Vercel
- ✅ Deploy backend to cloud (Vercel, Azure, Google Cloud)
- ✅ Set up CI/CD pipeline
- ✅ Add monitoring and analytics
- ✅ Documentation for production

**By end of Phase 5:** System is live on the web, monitoring active, updates automated

---

## 🎯 Objectives

1. **Containerization**
   - Docker setup for backend
   - Docker Compose for local dev
   - Production-ready image

2. **Deployment Strategies**
   - Frontend → Vercel (easiest)
   - Backend → Multiple options (Vercel/Azure/Google Cloud)
   - Database → Firebase (already set up)
   - Caching → Redis Cloud/ElastiCache

3. **CI/CD Pipeline**
   - GitHub Actions for automated tests
   - Automated deployment on push
   - Environment management

4. **Monitoring**
   - Error tracking (Sentry)
   - Performance monitoring (DataDog)
   - Log aggregation

---

## 📝 Detailed Tasks

### Checkpoint 5.1: Containerization (Days 1-3)

#### Task 5.1.1: Create Dockerfile
**Status:** ⬜ Not Started

**Create:** `backend/Dockerfile`

```dockerfile
# Stage 1: Build
FROM python:3.11-slim as builder

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Stage 2: Runtime
FROM python:3.11-slim

WORKDIR /app

# Copy from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages

# Copy app code
COPY . .

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# Run app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Create:** `backend/.dockerignore`

```
__pycache__
*.pyc
*.pyo
.env
.git
.gitignore
.venv
venv
*.log
logs/
.pytest_cache
.coverage
.DS_Store
```

**Build & Test Locally:**

```bash
# Build image
docker build -t campus-flow-api:latest .

# Run container
docker run -p 8000:8000 \
  -e FIREBASE_CREDENTIALS=/app/credentials.json \
  -v $(pwd)/credentials.json:/app/credentials.json \
  campus-flow-api:latest

# Test it
curl http://localhost:8000/health
```

**Verification:**
- [ ] Docker image builds successfully
- [ ] Container starts without errors
- [ ] API endpoints respond
- [ ] Health check passes

**Deliverable:**
```
✅ Dockerfile created
✅ Local Docker testing working
✅ Image optimized (multi-stage)
```

---

#### Task 5.1.2: Docker Compose for Development
**Status:** ⬜ Not Started

**Create:** `docker-compose.yml`

```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

  api:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - FIREBASE_CREDENTIALS=/app/credentials.json
      - ENV=development
    volumes:
      - ./backend:/app
      - ./credentials.json:/app/credentials.json
    depends_on:
      redis:
        condition: service_healthy
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --reload

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
    environment:
      - VITE_API_URL=http://localhost:8000
    command: npm run dev

volumes:
  redis_data:
```

**Use it:**

```bash
# Start all services
docker-compose up

# View logs
docker-compose logs -f api

# Stop
docker-compose down
```

**Verification:**
- [ ] Redis runs in container
- [ ] API connects to Redis
- [ ] Frontend connects to API
- [ ] All services healthy

---

### Checkpoint 5.2: Frontend Deployment to Vercel (Days 4-6)

#### Task 5.2.1: Deploy to Vercel
**Status:** ⬜ Not Started

**Steps:**

1. **Create Vercel Account**
   - Go to vercel.com
   - Sign up with GitHub
   - Authorize Vercel

2. **Push to GitHub** (if not already)
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/SC4052-Project
   git push origin main
   ```

3. **Import Project in Vercel**
   - Go to vercel.com/dashboard
   - Click "Add New..." → "Project"
   - Select GitHub repo "SC4052-Project"
   - Configure:
     - Framework: Vite
     - Root Directory: `frontend`
     - Build Command: `npm run build`
     - Output Directory: `dist`

4. **Environment Variables** (in Vercel Dashboard)
   ```
   VITE_API_URL=https://campus-flow-api-prod.vercel.app
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Get production URL (e.g., `https://sc4052-project.vercel.app`)

**Verification:**
- [ ] Frontend builds successfully
- [ ] Frontend accessible at Vercel URL
- [ ] API calls work (once backend deployed)

**Deliverable:**
```
✅ Frontend deployed to Vercel
✅ Live at production URL
✅ Environment configured
```

---

### Checkpoint 5.3: Backend Deployment (Days 7-10)

#### Option A: Deploy to Vercel (Recommended First Time)

**Steps:**

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Create `vercel.json`** in backend:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "main.py",
         "use": "@vercel/python"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "main.py"
       }
     ],
     "env": {
       "FIREBASE_CREDENTIALS": "@firebase_credentials",
       "REDIS_HOST": "@redis_host"
     }
   }
   ```

3. **Deploy**
   ```bash
   cd backend
   vercel deploy --prod
   ```

4. **Set Environment Variables in Vercel Dashboard**
   - Go to Project Settings → Environment Variables
   - Add `FIREBASE_CREDENTIALS`, `REDIS_HOST`, etc.

---

#### Option B: Deploy to Azure
**Status:** ⬜ Not Started

**Steps:**

1. **Create Azure Account** - azure.microsoft.com

2. **Create App Service**
   - Resource Group: Create new
   - App Service Plan: B1 (cheap)
   - Runtime: Python 3.11
   - OS: Linux

3. **Deploy via GitHub**
   - Go to Deployment Center
   - Select GitHub
   - Authorize and select repo
   - Select `backend` folder
   - Deployment happens automatically

**Verification:**
- [ ] App Service created
- [ ] GitHub connected
- [ ] Auto-deploy working
- [ ] API accessible

---

#### Option C: Deploy to Google Cloud
**Status:** ⬜ Not Started

**Steps:**

1. **Create Google Account** - console.cloud.google.com

2. **Enable APIs**
   - Cloud Run
   - Container Registry
   - Firebase Admin

3. **Deploy via gcloud CLI**
   ```bash
   # Install gcloud
   curl https://sdk.cloud.google.com | bash
   
   # Login
   gcloud auth login
   
   # Create Cloud Run service
   gcloud run deploy campus-flow-api \
     --source backend/ \
     --platform managed \
     --region us-central1 \
     --memory 512Mi \
     --cpu 1
   ```

4. **Set Environment Variables**
   ```bash
   gcloud run services update campus-flow-api \
     --set-env-vars="FIREBASE_CREDENTIALS=${CREDENTIALS_JSON}"
   ```

---

### Checkpoint 5.4: Redis Cloud Setup (Days 11)

#### Task 5.4.1: Setup Redis in Cloud
**Status:** ⬜ Not Started

**Option A: Redis Cloud (Easiest)**

**Steps:**

1. Go to rediscloud.com
2. Sign up for free account
3. Create database
   - 30MB free tier
   - EU or US region
4. Get connection string
5. Update `.env`:
   ```
   REDIS_HOST=redis-xxxxx.rediscloud.com
   REDIS_PORT=xxxxx
   REDIS_PASSWORD=your_password
   ```

**Option B: AWS ElastiCache**

1. Go to AWS console
2. Search "ElastiCache"
3. Create cache cluster
   - Engine: Redis
   - Instance type: cache.t3.micro (free tier)
4. Get endpoint
5. Update `.env`

---

### Checkpoint 5.5: CI/CD Pipeline (Days 12-13)

#### Task 5.5.1: GitHub Actions
**Status:** ⬜ Not Started

**Create:** `.github/workflows/test.yml`

```yaml
name: Tests & Deployment

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        cd backend
        pip install -r requirements.txt
        pip install pytest
    
    - name: Run tests
      run: |
        cd backend
        pytest tests/ -v

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy frontend to Vercel
      env:
        VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
      run: |
        npm i -g vercel
        vercel deploy --prod --token $VERCEL_TOKEN
    
    - name: Deploy backend
      # Depends on your platform (Vercel, Azure, Google Cloud)
      run: |
        # Your deployment command here
        echo "Deploying backend..."
```

**Setup Secrets:**
1. Go to GitHub repo → Settings → Secrets
2. Add `VERCEL_TOKEN`
3. Add other credentials

**Verification:**
- [ ] Tests run on each push
- [ ] Deployment automatic on main branch
- [ ] Failures block deployment

---

### Checkpoint 5.6: Monitoring & Alerts (Day 14)

#### Task 5.6.1: Add Error Tracking (Sentry)
**Status:** ⬜ Not Started

**Setup Sentry:**

1. Go to sentry.io
2. Create account
3. Create project → Python
4. Get DSN

**Update:** `requirements.txt`
```
sentry-sdk==1.4.0
```

**Update:** `backend/main.py`
```python
import sentry_sdk

sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    environment=os.getenv("ENV", "development"),
    traces_sample_rate=0.1
)
```

**Verification:**
- [ ] Errors logged to Sentry
- [ ] Email alerts on errors
- [ ] Can view error trends

---

## ✅ Phase 5 Success Criteria

- [ ] Dockerfile created and tested locally
- [ ] Docker Compose working
- [ ] Frontend deployed to Vercel
- [ ] Backend deployed (Vercel/Azure/Google Cloud)
- [ ] Redis setup in cloud
- [ ] CI/CD pipelines working
- [ ] Error tracking active
- [ ] Environment variables configured
- [ ] Monitoring alerts working
- [ ] API calls between frontend↔backend work
- [ ] No hardcoded secrets in repo
- [ ] Documentation complete

---

## 🚀 Production Checklist

**Before Going Live:**

- [ ] All tests passing
- [ ] No console errors in production
- [ ] HTTPS enabled everywhere
- [ ] Rate limiting working
- [ ] Database backups configured
- [ ] Monitoring alerts set up
- [ ] Error recovery tested
- [ ] Load testing completed
- [ ] Security review done
- [ ] Documentation updated
- [ ] Runbook created for troubleshooting

---

## 📊 Architecture

### Development
```
Frontend (npm run dev)
    ↓
Backend (python main.py)
    ↓
Firebase + Local Redis
```

### Production
```
Frontend (Vercel)
    ↓
Backend (Vercel/Azure/Google Cloud)
    ↓
Firebase + Redis Cloud + Monitoring
```

---

## 🔗 Production URLs

Update these after deployment:

- Frontend: `https://your-domain.vercel.app`
- Backend API: `https://api.your-domain.vercel.app`
- Admin Panel: `https://admin.your-domain.vercel.app`

---

## 💡 Post-Deployment

1. **Monitor Metrics**
   - API latency
   - Database usage
   - Error rate
   - Cache hit rate

2. **User Feedback**
   - Collect feedback
   - Monitor for bugs
   - Track usage patterns

3. **Iterate**
   - Roll out improvements
   - A/B test changes
   - Optimize performance

---

## 🎓 For Your Professor

**In your final presentation**, mention:

1. ✅ System deployed to production
2. ✅ Containerized with Docker
3. ✅ CI/CD pipeline automated
4. ✅ Error tracking & monitoring active
5. ✅ Cloud-native serverless architecture
6. ✅ Scalable to handle peak loads
7. ✅ Real-time data processing
8. ✅ Dual-utility XaaS model

**This demonstrates:**
- Professional DevOps knowledge
- Cloud architecture understanding
- Production-ready mindset
- Enterprise-grade practices

---

**Phase 5 Status:** 🔴 Not Started  
**Last Updated:** 2026-04-03

---

## ⏭️ You're Done!

Congratulations! Your backend is now:

✅ Fully functional  
✅ Production deployed  
✅ Monitored and resilient  
✅ Scalable and optimized  
✅ Production-grade

Now write your report and prepare your presentation! 🎉
