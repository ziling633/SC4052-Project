# 🚀 DEPLOYMENT QUICK START

Your complete deployment toolkit is ready! Here's how to deploy Campus Flow to production.

---

## 📁 What's Been Created

```
✅ Docker Configuration
   ├── backend/Dockerfile         (Backend containerization)
   ├── backend/.dockerignore       (Docker build optimization)
   ├── frontend/Dockerfile         (Frontend containerization)
   └── frontend/.dockerignore      (Frontend build optimization)

✅ Local Development
   ├── docker-compose.yml          (Local testing with Docker)
   └── .env.docker                 (Local environment variables)

✅ Deployment Scripts
   ├── scripts/setup-deployment.sh (Initial setup)
   ├── scripts/deploy-local.sh     (Test locally)
   ├── scripts/deploy-vercel.sh    (Deploy frontend)
   ├── scripts/deploy-gcloud.sh    (Deploy backend)
   └── scripts/precheck.sh         (Verify readiness)

✅ Cloud Configuration
   ├── .gcloud/app.yaml            (Cloud Run configuration)
   ├── .gcloud/cloudbuild.yaml     (Automated builds)
   ├── .gcloud/deployment.yaml     (Kubernetes optional)
   └── frontend/vercel.json        (Vercel configuration)

✅ CI/CD Pipeline
   └── .github/workflows/deploy.yml (Automatic deployment on push)

✅ Documentation
   ├── DEPLOYMENT_INSTRUCTIONS.md  (Complete guide)
   └── .deployment-checklist.md    (Pre-launch checklist)
```

---

## 🎯 5-Minute Quick Start

### 1. Test Locally First
```bash
bash scripts/deploy-local.sh
```
Verify the app works at `http://localhost:3000` and `http://localhost:8000`

### 2. Deploy Frontend (Vercel)
```bash
bash scripts/deploy-vercel.sh
```
Gets you a URL like: `https://yourproject.vercel.app`

### 3. Deploy Backend (Google Cloud)
```bash
bash scripts/deploy-gcloud.sh
```
Gets you a URL like: `https://campus-flow-api-xxxxx.run.app`

### 4. Connect Frontend to Backend
Update in Vercel Dashboard:
- Settings → Environment Variables
- Set `NEXT_PUBLIC_API_URL` to your backend URL

### 5. Enable Automatic Deployment
Add GitHub secrets for CI/CD (see detailed guide below)

**That's it! 🎉**

---

## 📚 Full Deployment Guide

Read the complete guide: **[DEPLOYMENT_INSTRUCTIONS.md](./DEPLOYMENT_INSTRUCTIONS.md)**

Key sections:
- **Phase 1**: Local testing with Docker
- **Phase 2**: Frontend deployment to Vercel
- **Phase 3**: Backend deployment to Google Cloud Run
- **Phase 4**: Automated CI/CD with GitHub Actions
- **Phase 5**: Security & production checklist

---

## 🔧 Useful Commands

```bash
# Local development
docker-compose up                    # Start all services
docker-compose down                  # Stop all services
docker-compose logs -f api           # View backend logs
docker-compose logs -f frontend      # View frontend logs

# Google Cloud
gcloud run services list             # List deployed services
gcloud run services describe campus-flow-api --region us-central1
gcloud run services logs read campus-flow-api --region us-central1

# Vercel
vercel --help                        # Vercel CLI help
vercel deployments list              # See deployment history
```

---

## 🆘 Pre-Deployment Checklist

Before you deploy, run this check:
```bash
bash scripts/precheck.sh
```

Manual checklist (see `.deployment-checklist.md`):
- [ ] No `.env` files in git
- [ ] Firebase credentials configured
- [ ] Backend tests passing
- [ ] Frontend builds successfully
- [ ] Docker images build locally
- [ ] GitHub Actions secrets added

---

## 💾 Important Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Local dev environment |
| `backend/Dockerfile` | Backend container image |
| `frontend/Dockerfile` | Frontend container image |
| `.github/workflows/deploy.yml` | Automated deployment pipeline |
| `DEPLOYMENT_INSTRUCTIONS.md` | Complete deployment guide |
| `.deployment-checklist.md` | Pre-launch verification |

---

## 🌐 Architecture

```
┌─────────────────────┐
│   Vercel Frontend   │
│  (Next.js App)      │
│ vercel.app          │
└──────────┬──────────┘
           │ HTTPS
           │
           ↓
┌─────────────────────────────────┐
│  Google Cloud Run Backend       │
│  (FastAPI + Python)             │
│  run.app                        │
└─────────────────────┬───────────┘
                      │
           ┌──────────┼──────────┐
           ↓          ↓          ↓
      Firebase    Storage    Analytics
      (Realtime DB, Firestore, Auth)
```

---

## 📊 Monitoring

After deployment, monitor your applications:

**Frontend (Vercel):**
- Dashboard → Your Project → Analytics
- Deployments → View logs

**Backend (Google Cloud):**
```bash
gcloud run services describe campus-flow-api \
  --region us-central1 --format "value(status.observedGeneration)"
```

---

## 💰 Cost Estimation

- **Vercel**: $0-20/month (free tier available)
- **Google Cloud**: $0-10/month (generous free tier)
- **Firebase**: $0-5/month (free tier covers most use cases)
- **Total**: Usually **$0-5/month** for student projects

---

## 🔐 Security Reminders

✅ What's protected:
- Firebase credentials in secrets, not in code
- Environment variables managed by cloud platforms
- GitHub Actions uses encrypted secrets
- Docker images don't include sensitive files

⚠️ Always verify:
- No `.env` files committed to git
- CORS is properly configured
- Firebase rules are set for production
- Backups are enabled

---

## 🚨 Troubleshooting

### Issue: Backend won't connect to frontend
- [ ] Check `NEXT_PUBLIC_API_URL` in Vercel
- [ ] Verify backend is running: `curl https://your-backend.run.app/health`
- [ ] Check CORS configuration in `backend/cors.json`

### Issue: Docker build fails
- [ ] Ensure Python version matches (3.11)
- [ ] Check `requirements.txt` is valid
- [ ] Verify `.dockerignore` is correct

### Issue: GitHub Actions failing
- [ ] Verify all GitHub secrets are added correctly
- [ ] Check that Google Cloud service account key is properly base64 encoded
- [ ] Review workflow logs in GitHub Actions tab

### Issue: High costs on Google Cloud
- [ ] Check Cloud Run pricing settings
- [ ] Set `--max-instances` limit
- [ ] Enable Cloud Run to scale to zero when unused

---

## 📖 Additional Resources

- 📚 [Vercel Documentation](https://vercel.com/docs)
- 📚 [Google Cloud Run Guide](https://cloud.google.com/run/docs)
- 📚 [Firebase Documentation](https://firebase.google.com/docs)
- 📚 [GitHub Actions](https://docs.github.com/en/actions)
- 📚 [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

**Ready? Follow [DEPLOYMENT_INSTRUCTIONS.md](./DEPLOYMENT_INSTRUCTIONS.md) for the complete step-by-step guide!** 🚀
