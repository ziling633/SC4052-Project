# 🚀 DEPLOYMENT INSTRUCTIONS: Vercel + Google Cloud

Complete step-by-step guide to deploy Campus Flow to production.

---

## 📋 Overview

Your deployment architecture:
- **Frontend**: Vercel (serverless, global CDN)
- **Backend**: Google Cloud Run (containerized API, pay-as-you-go)
- **Database**: Firebase (already configured)
- **CI/CD**: GitHub Actions (automatic deployment on push to `main`)

---

## ⚙️ PHASE 1: Local Setup & Testing

### Step 1: Make Scripts Executable
```bash
chmod +x scripts/*.sh
# OR
bash scripts/make-executable.sh
```

### Step 2: Test Locally with Docker
```bash
bash scripts/deploy-local.sh
```

This will:
- Start backend API at `http://localhost:8000`
- Start frontend at `http://localhost:3000`
- Verify everything builds correctly

Check the services are working:
```bash
# In another terminal
curl http://localhost:8000/health
curl http://localhost:3000
```

Stop local deployment:
```bash
docker-compose down
```

---

## 🌐 PHASE 2: Deploy Frontend to Vercel

### Step 1: Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up"
3. Sign in with GitHub (recommended)
4. Authorize Vercel access to your repositories

### Step 2: Run Vercel Deploy Script
```bash
bash scripts/deploy-vercel.sh
```

This will:
- Authenticate you with Vercel
- Build your Next.js application
- Deploy to production

**You'll get a URL like:** `https://yourproject.vercel.app`

### Step 3: Add Vercel GitHub Integration (Optional but Recommended)
1. Dashboard → Projects → Select your project
2. Settings → Git
3. Connect to GitHub → your SC4052-Project repository
4. Sets up automatic deployment on every push to `main`

### Step 4: Set Vercel Environment Variables
In Vercel Dashboard:
1. Settings → Environment Variables
2. Add:
   ```
   NEXT_PUBLIC_API_URL = https://campus-flow-api-xxxxx.run.app
   ```
   (You'll get the backend URL after deploying to Google Cloud)

---

## 🔵 PHASE 3: Deploy Backend to Google Cloud

### Step 1: Create Google Cloud Account
1. Go to [cloud.google.com](https://cloud.google.com)
2. Click "Get Started" or "Sign In"
3. Create a new project

### Step 2: Install Google Cloud CLI
```bash
# macOS
brew install google-cloud-sdk

# Or follow: https://cloud.google.com/sdk/docs/install
```

### Step 3: Run Google Cloud Deploy Script
```bash
bash scripts/deploy-gcloud.sh
```

This will:
- Authenticate with Google Cloud
- Enable required APIs
- Build Docker image
- Push to Container Registry
- Deploy to Cloud Run
- Give you the backend URL

**You'll get a URL like:** `https://campus-flow-api-xxxxx.run.app`

### Step 4: Set Backend Environment Variables in Cloud Run
1. Cloud Console → Cloud Run
2. Click `campus-flow-api` service
3. Edit & Deploy New Revision
4. Under "Runtime settings" → Environment variables, add:
   ```
   ENV=production
   FIREBASE_CREDENTIALS={your firebase config}
   PYTHONUNBUFFERED=TRUE
   ```

### Step 5: (IMPORTANT) Update Frontend API URL
Now that you have the backend URL, update Vercel:
1. Vercel Dashboard → Your project
2. Settings → Environment Variables
3. Update `NEXT_PUBLIC_API_URL` to your Cloud Run URL
4. Redeploy frontend for changes to take effect

---

## 🔄 PHASE 4: Set Up GitHub Actions (Automated Deployment)

This ensures every push to `main` automatically deploys both frontend and backend.

### Step 1: Create GitHub Personal Access Token
1. GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Scopes: `repo`, `workflow`, `read:org`
4. Copy the token

### Step 2: Get Vercel Credentials
1. Vercel → Account Settings → Tokens
2. Create new token
3. Copy: `VERCEL_TOKEN`
4. Get your `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` from project settings

### Step 3: Get Google Cloud Credentials
```bash
# Create service account
gcloud iam service-accounts create github-deployer

# Get the email
gcloud iam service-accounts list | grep github-deployer

# Grant permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member=serviceAccount:github-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com \
  --role=roles/run.admin

# Create and download JSON key
gcloud iam service-accounts keys create key.json \
  --iam-account=github-deployer@YOUR_PROJECT_ID.iam.gserviceaccount.com

# Base64 encode (for GitHub secrets)
cat key.json | base64
```

### Step 4: Add GitHub Secrets
Go to your repository:
**Settings → Secrets and variables → Actions → New repository secret**

Add these secrets:
```
VERCEL_TOKEN              = [from Vercel]
VERCEL_ORG_ID             = [from Vercel]
VERCEL_PROJECT_ID         = [from Vercel]
GCP_PROJECT_ID            = [your GCP project ID]
GCP_SA_KEY                = [base64 encoded JSON from above]
```

### Step 5: Test CI/CD Pipeline
1. Make a small change to your code
2. Push to `main` branch
3. Go to **Actions** tab in GitHub
4. Watch the deployment workflow run
5. Check that both frontend and backend deploy successfully

---

## 🛡️ PHASE 5: Security & Production Checklist

### Before Going Live

- [ ] Firebase security rules are configured
  ```
  Cloud Console → Firestore → Rules → Review and deploy
  ```

- [ ] CORS is properly configured on backend
  ```
  Check backend/cors.json
  ```

- [ ] Environment variables are set (no `.env` in git)
  ```bash
  git status | grep .env  # Should be empty
  ```

- [ ] Database backups are enabled
  ```
  Firestore → Settings → Enable backups
  ```

- [ ] Monitoring is set up
  ```
  Cloud Console → Monitoring → Create uptime checks
  ```

- [ ] Custom domain is configured (optional)
  ```
  Vercel: Settings → Domains → Add custom domain
  GCP: Cloud Run → Service details → Add custom domain
  ```

---

## 🚨 Troubleshooting

### Backend won't start
```bash
# Check logs
docker logs campus-flow-api

# Or in Cloud Console
Cloud Run → campus-flow-api → Logs
```

### Frontend can't reach backend
```
Check NEXT_PUBLIC_API_URL is set correctly in Vercel
Make sure backend URL is accessible without /health endpoint
```

### GitHub Actions failing
```
Go to Actions → Failed workflow → Review logs
Check that all secrets are added correctly
```

### Docker image too large
```
Already optimized with python:3.11-slim
Check that .dockerignore includes all unnecessary files
```

---

## 📊 Monitoring & Logs

### View Backend Logs
```bash
# Cloud Run
gcloud run services describe campus-flow-api --region us-central1

# Or in Cloud Console
Cloud Run → campus-flow-api → Logs panel
```

### View Frontend Logs
```
Vercel Dashboard → Your project → Deployments → [Deployment] → Logs
```

### Set Up Alerts
```
Cloud Console → Monitoring → Alert policies → Create alerting policy
```

---

## 💰 Cost Estimation

**Vercel Frontend:**
- Free tier: 100 deployments/month
- Pro: $20/month

**Google Cloud Run Backend:**
- Free tier: 2M requests/month, 360K GB-seconds/month
- Pay-as-you-go: ~$0.00002776 per request (usually <$5/month for student projects)

**Firebase:**
- Free tier: 1GB storage, 50K reads/day
- Pay-as-you-go: After free tier

**Total Estimated Cost:** $0-5/month for typical student usage

---

## 🎯 Next Steps

1. ✅ Run `bash scripts/deploy-local.sh` to test locally
2. ✅ Deploy frontend: `bash scripts/deploy-vercel.sh`
3. ✅ Deploy backend: `bash scripts/deploy-gcloud.sh`
4. ✅ Update Vercel environment variable with backend URL
5. ✅ Set up GitHub Actions secrets for CI/CD
6. ✅ Test full deployment pipeline with a test commit

---

## 🆘 Need Help?

Check the troubleshooting section above or:
- Vercel Docs: https://vercel.com/docs
- Google Cloud Run: https://cloud.google.com/run/docs
- Firebase: https://firebase.google.com/docs
- GitHub Actions: https://docs.github.com/en/actions

---

**🎉 Your application is now production-ready!**
