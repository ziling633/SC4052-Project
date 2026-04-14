# Production environment checklist
# Copy and complete before deployment

## Cloud Setup
- [ ] Google Cloud project created
- [ ] Vercel account created
- [ ] Firebase project configured
- [ ] GitHub repository connected to Vercel
- [ ] GitHub repository connected to Google Cloud

## Backend (Google Cloud Run)
- [ ] Docker image builds locally: `docker build -f backend/Dockerfile backend/`
- [ ] Firebase credentials file secured in /secrets/
- [ ] Backend API health check working: `curl http://localhost:8000/health`
- [ ] CORS configuration updated in backend/cors.json
- [ ] Environment variables set in Cloud Run console
- [ ] Custom domain configured (optional)
- [ ] Monitoring alerts set up
- [ ] Backup strategy documented

## Frontend (Vercel)
- [ ] Frontend builds locally: `cd frontend && npm run build`
- [ ] Environment variables set in Vercel console
- [ ] NEXT_PUBLIC_API_URL points to Cloud Run backend
- [ ] Custom domain configured (optional)
- [ ] Analytics enabled
- [ ] Preview deployments working

## CI/CD (GitHub Actions)
- [ ] GitHub secrets added:
  - [ ] VERCEL_TOKEN
  - [ ] VERCEL_ORG_ID
  - [ ] VERCEL_PROJECT_ID
  - [ ] GCP_PROJECT_ID
  - [ ] GCP_SA_KEY
- [ ] Deploy workflow tested on feature branch
- [ ] All tests passing
- [ ] Notifications configured (Slack optional)

## Security
- [ ] No `.env` files committed to git
- [ ] Firebase security rules reviewed
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] Firebase credentials in /secrets/ (not in repo)
- [ ] GitHub Actions secrets are encrypted
- [ ] Database backups enabled
- [ ] HTTPS enforced on both frontend and backend

## Database & Cache
- [ ] Firebase Firestore collections exist and have correct structure
- [ ] Firestore security rules deployed
- [ ] Firestore backups enabled
- [ ] Performance indexes created for frequently queried collections

## Testing
- [ ] Backend unit tests passing
- [ ] Frontend builds without errors
- [ ] API endpoints tested in production URL
- [ ] End-to-end flow tested
- [ ] Error handling verified
- [ ] Performance acceptable

## Monitoring & Alerts
- [ ] Cloud Run error logs monitored
- [ ] Vercel analytics checked
- [ ] Uptime monitoring configured
- [ ] Email alerts set up for errors
- [ ] Regular log reviews scheduled

## Documentation
- [ ] DEPLOYMENT_INSTRUCTIONS.md up to date
- [ ] README.md includes deployment info
- [ ] Team knows how to debug in production
- [ ] Runbook for common issues created

## Go-Live
- Date: __________
- Who's deploying: __________
- Rollback plan: __________
- Support contact: __________

## Post-Deployment
- [ ] Monitor logs for 24 hours
- [ ] Check user feedback
- [ ] Verify all features working
- [ ] Performance metrics acceptable
- [ ] Team notified of deployment
