# 🚀 Deployment & Containerization Guide

**Focus:** Docker containerization and deployment options

> For step-by-step deployment instructions, see [DEPLOYMENT_INSTRUCTIONS.md](./DEPLOYMENT_INSTRUCTIONS.md). For quick setup, see [DEPLOYMENT_QUICK_START.md](./DEPLOYMENT_QUICK_START.md).

---

## 📋 Quick Decision Flow

```
Are you deploying for the first time?
    ├─ YES → Start with Vercel (easiest, free tier)
    │
    └─ NO → Choose your platform:
        ├─ Vercel (Easiest, free, serverless)
        ├─ Azure (Enterprise, good for learning)
        ├─ Google Cloud (Flexible, pay-as-you-go)
        └─ Heroku (Deprecated - not recommended)
```

---

## 📦 Part 1: Dockerization

### Why Docker?

- **Consistency:** Same environment everywhere
- **Isolation:** No version conflicts
- **Scalability:** Easy to deploy multiple instances
- **CI/CD:** Automates testing and deployment

### Prerequisites

- Docker Desktop installed (docker.com)
- Docker account (optional, for Docker Hub)

### Step 1: Create Dockerfile

**File:** `backend/Dockerfile`

```dockerfile
# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy requirements
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')" || exit 1

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Step 2: Create .dockerignore

**File:** `backend/.dockerignore`

```
__pycache__
*.pyc
*.pyo
.env
.env.local
.git
.gitignore
.venv
venv
*.log
logs/
.pytest_cache
.coverage
.DS_Store
node_modules/
```

### Step 3: Build Docker Image Locally

```bash
cd backend

# Build image
docker build -t campus-flow-api:latest .

# List images
docker images

# Should output something like:
# REPOSITORY          TAG       IMAGE ID      SIZE
# campus-flow-api     latest    abc123def456  542MB
```

### Step 4: Test Docker Image Locally

```bash
# Run container
docker run -p 8000:8000 \
  -e FIREBASE_CREDENTIALS=/app/credentials.json \
  -v $(pwd)/credentials.json:/app/credentials.json \
  campus-flow-api:latest

# Test in another terminal
curl http://localhost:8000/health

# Should return: {"status": "ok"}
```

### Step 5: Push to Docker Hub (Optional)

```bash
# Login to Docker
docker login

# Tag image with your username
docker tag campus-flow-api:latest YOUR_USERNAME/campus-flow-api:latest

# Push to Docker Hub
docker push YOUR_USERNAME/campus-flow-api:latest

# Can now pull from anywhere:
# docker pull YOUR_USERNAME/campus-flow-api:latest
```

### Step 6: Docker Compose for Local Development

**File:** `docker-compose.yml`

```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    container_name: campus-flow-redis
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
    container_name: campus-flow-api
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
    container_name: campus-flow-frontend
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
    environment:
      - VITE_API_URL=http://localhost:8000
    command: npm run dev

volumes:
  redis_data:
    driver: local
```

**Use Docker Compose:**

```bash
# Start all services
docker-compose up

# View logs
docker-compose logs -f api
docker-compose logs -f frontend

# Stop all services
docker-compose down

# Remove all data
docker-compose down -v
```

---

## ☁️ Part 2: Frontend Deployment to Vercel

### Why Vercel?

- Free tier for frontend
- Automatic deployments from GitHub
- 0-config for Next.js, Vite
- Global CDN
- Serverless functions (bonus)

### Step 1: Prepare Project

```bash
# Make sure frontend builds locally
cd frontend
npm run build

# Should create dist/ folder
ls dist/
```

### Step 2: Create Vercel Account

1. Go to vercel.com
2. Click "Sign Up"
3. Use GitHub account (recommended)
4. Authorize Vercel

### Step 3: Import Project

1. Dashboard → "Add New" → "Project"
2. Select your GitHub repo "SC4052-Project"
3. Configure:
   - **Framework:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

### Step 4: Set Environment Variables

In Vercel Dashboard:

1. Go to Project Settings → Environment Variables
2. Add:
   ```
   VITE_API_URL=https://your-backend-api.com
   ```

### Step 5: Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Get URL: `https://your-project.vercel.app`

### Step 6: Custom Domain (Optional)

1. Settings → Domains
2. Add your custom domain
3. Update DNS settings with Vercel instructions

---

## 🔵 Part 3a: Backend Deployment to Vercel

### Pros
- Same provider as frontend
- Free tier available
- Simple GitHub integration
- Global distribution

### Cons
- Cold starts (5-10s first request)
- Limited execution time (10s)
- Limited Python ecosystem

### Steps

1. **Create `vercel.json`** in backend:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "main.py",
      "use": "@vercel/python",
      "config": {
        "maxLambdaSize": "50mb"
      }
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
    "REDIS_HOST": "@redis_host",
    "REDIS_PORT": "@redis_port",
    "ENV": "@env"
  }
}
```

2. **Install Vercel CLI:**
```bash
npm install -g vercel
```

3. **Deploy:**
```bash
cd backend
vercel deploy --prod
```

4. **Set Secrets in Vercel:**
```bash
vercel env add FIREBASE_CREDENTIALS
vercel env add REDIS_HOST
vercel env add REDIS_PORT
```

5. **Get API URL:**
   - Dashboard → Deployments
   - Copy URL (e.g., `https://api.your-project.vercel.app`)

6. **Update Frontend:**
   - Update `VITE_API_URL` in frontend `.env`

---

## 🔵 Part 3b: Backend Deployment to Azure

### Pros
- Enterprise-grade
- Good free tier (12 months)
- Excellent for learning
- Integration with Office 365

### Cons
- More complex setup
- Steeper learning curve

### Steps

1. **Create Azure Account**
   - azure.microsoft.com
   - Sign up (free account, $200 credit)

2. **Create Resource Group**
   ```bash
   az login
   az group create --name campus-flow-rg --location eastus
   ```

3. **Create App Service Plan**
   ```bash
   az appservice plan create \
     --name campus-flow-plan \
     --resource-group campus-flow-rg \
     --sku B1 \
     --is-linux
   ```

4. **Create Web App**
   ```bash
   az webapp create \
     --resource-group campus-flow-rg \
     --plan campus-flow-plan \
     --name campus-flow-api \
     --runtime "PYTHON|3.11"
   ```

5. **Configure GitHub Deployment**
   - Portal → App Service → Deployment Center
   - Select GitHub
   - Authorize and select repo
   - Select `main` branch
   - Save (auto-deployment starts)

6. **Set Environment Variables**
   - Configuration → Application Settings
   - Add:
     ```
     FIREBASE_CREDENTIALS=<your-credentials>
     REDIS_HOST=<redis-host>
     ENV=production
     ```

7. **Get URL**
   - Portal → Overview
   - Default domain: `https://campus-flow-api.azurewebsites.net`

---

## 🟢 Part 3c: Backend Deployment to Google Cloud

### Pros
- Flexible pricing
- Generous free tier
- Powerful tools
- Global scale

### Cons
- Most complex setup
- Requires credits for some services

### Steps

1. **Setup Google Cloud**
   ```bash
   # Install gcloud CLI
   curl https://sdk.cloud.google.com | bash
   
   # Authenticate
   gcloud auth login
   
   # Create project
   gcloud projects create campus-flow --name="Campus Flow"
   gcloud config set project campus-flow
   ```

2. **Enable APIs**
   ```bash
   gcloud services enable run.googleapis.com
   gcloud services enable containerregistry.googleapis.com
   ```

3. **Create `backend/docker/Dockerfile`** (same as before)

4. **Deploy to Cloud Run**
   ```bash
   cd backend
   
   gcloud run deploy campus-flow-api \
     --source . \
     --platform managed \
     --region us-central1 \
     --memory 512Mi \
     --cpu 1 \
     --allow-unauthenticated
   ```

5. **Set Environment Variables**
   ```bash
   gcloud run services update campus-flow-api \
     --set-env-vars="FIREBASE_CREDENTIALS=/secrets/firebase" \
     --region us-central1
   ```

6. **Get URL**
   - Output will show: `https://campus-flow-api-xxxxx.run.app`

---

## 🗄️ Part 4: Database & Cache Setup

### Firebase (Already Set Up)

✅ You're done - using Firebase Firestore

### Redis in Cloud

**Option A: Redis Cloud (Recommended)**

1. rediscloud.com
2. Sign up (free 30MB)
3. Create database
4. Get connection string
5. Add to backend `.env`:
   ```
   REDIS_HOST=redis-xxxxx.rediscloud.com
   REDIS_PORT=xxxxx
   REDIS_PASSWORD=your_password
   ```

**Option B: AWS ElastiCache**

1. console.aws.amazon.com
2. ElastiCache → Create cache cluster
3. Engine: Redis
4. Instance type: cache.t3.micro (free tier)
5. Get endpoint

**Option C: Google Memorystore**

1. console.cloud.google.com
2. Memorystore → Create instance
3. Redis, 1GB (free tier eligible)
4. Get IP and port

---

## 📋 Part 5: CI/CD Pipeline with GitHub Actions

### Why?

- Automatically test on pull requests
- Auto-deploy on push to main
- Never deploy broken code

### Setup

**File:** `.github/workflows/deploy.yml`

```yaml
name: Test & Deploy

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
        pip install -r requirements.txt pytest
    
    - name: Run tests
      run: |
        cd backend
        pytest tests/ -v

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy frontend to Vercel
      env:
        VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
        VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
        VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
      run: |
        npm install -g vercel
        vercel pull --yes --environment=production --token=$VERCEL_TOKEN
        vercel build --prod --token=$VERCEL_TOKEN
        vercel deploy --prebuilt --prod --token=$VERCEL_TOKEN

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    # For Vercel:
    - name: Deploy backend to Vercel
      env:
        VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
      run: |
        cd backend
        npm install -g vercel
        vercel deploy --prod --token=$VERCEL_TOKEN
```

### Add Secrets

GitHub → Repo Settings → Secrets:

1. `VERCEL_TOKEN` - Get from vercel.com/account/tokens
2. `VERCEL_ORG_ID` - From Vercel settings
3. `VERCEL_PROJECT_ID` - From Vercel project settings

---

## 🔒 Security Checklist

Before going live:

- [ ] No `.env` files committed to git
- [ ] Use `.gitignore` for secrets
- [ ] Rotate API keys regularly
- [ ] Use environment-specific configs
- [ ] Enable HTTPS everywhere
- [ ] Set CORS properly
- [ ] Add rate limiting
- [ ] Enable database backups
- [ ] Set up monitoring/alerts

---

## 📊 Final Architecture

```
┌─────────────────────────────────────────────┐
│    GitHub (Source Code)                     │
│    - Main branch triggers deployment        │
│    - Tests run automatically                │
└─────────────┬───────────────────────────────┘
              │
              ├─────────────────────┬──────────────────────┐
              ▼                     ▼                      ▼
        ┌─────────────────┐  ┌──────────────┐  ┌──────────────────┐
        │ Vercel/Azure/   │  │ Firebase     │  │ Redis Cloud/     │
        │ Google Cloud    │  │              │  │ ElastiCache      │
        │                 │  │ • Firestore  │  │                  │
        │ API Gateway     │  │ • Storage    │  │ • Cache Layer    │
        │ + Functions     │  │              │  │                  │
        └─────────────────┘  └──────────────┘  └──────────────────┘
              │                      ▲                      ▲
              └──────────────────────┼──────────────────────┘
                                     │
                         ┌───────────┴────────────┐
                         │                        │
                    ┌────▼────┐          ┌────────▼────┐
                    │ Frontend │          │  Monitoring │
                    │ (Vercel) │          │  (Sentry)   │
                    └──────────┘          └─────────────┘
```

---

## 🧪 Testing Before Launch

```bash
# 1. Local tests
cd backend && pytest tests/ -v

# 2. Docker test
docker build -t test-api:latest .
docker run -p 8000:8000 test-api:latest

# 3. Integration test
# Upload image locally
# Check Vision API
# Verify analytics

# 4. Load test
# Use Apache Bench or similar
ab -n 100 -c 10 http://localhost:8000/api/v1/canteens/status

# 5. Staging deployment
# Deploy to staging URL first
# Run same tests
# Get feedback

# 6. Production launch
# Deploy to production
# Monitor closely first 24h
```

---

## 🚨 Common Issues & Fixes

### "Port already in use"
```bash
# Kill process on port 8000
lsof -i :8000
kill -9 <PID>
```

### "CORS error in browser"
```python
# Check CORS settings in main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL")],
    allow_methods=["*"],
    allow_headers=["*"]
)
```

### "Firebase credentials not found"
```
# Make sure .env has path to credentials.json
# And file exists locally
# Credentials NOT pushed to git
```

### "Redis connection refused"
```bash
# Check Redis is running
redis-cli ping
# Should output: PONG
```

---

## 📞 Support & Resources

- Vercel Docs: vercel.com/docs
- Azure Docs: docs.microsoft.com
- Google Cloud Docs: cloud.google.com/docs
- Docker Docs: docs.docker.com
- GitHub Actions: github.com/actions

---

**You're Ready to Deploy! 🚀**

Choose your platform, follow the steps, and get your system live!

