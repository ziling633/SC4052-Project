# 🚀 PHASE 1 COMPLETE - Quick Start Guide

## ✅ What We've Built

### Backend (Fully Working)
- ✅ **POST /api/v1/report** - Submit crowd reports
- ✅ **GET /api/v1/canteens/status** - Fetch all canteen statuses
- ✅ **GET /api/v1/canteens/{id}** - Fetch single canteen details  
- ✅ **Firebase Firestore** - 8 canteens + reports database
- ✅ **Routes** - reports.py, canteens.py with CORS
- ✅ **Models** - Pydantic schemas for validation

### Frontend (Connected)
- ✅ **script-api-connected.js** - Fully branded API client
- ✅ **API functions** - submitReport(), fetchAllCanteensStatus()
- ✅ **UI rendering** - Cards, campus map, analytics dashboard
- ✅ **Auto-refresh** - Updates every 30 seconds
- ✅ **Form handling** - Submit reports directly to backend

---

## 🎯 How to Test Locally

### Terminal 1: Start Backend

```bash
cd /Users/Kavya/Documents/GitHub/SC4052-Project/backend

# Method A: Direct Python (recommended for first test)
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# OR Method B: Using main.py
python main.py
```

**Expected output:**
```
✅ Firebase initialized successfully
🔗 Frontend URL: http://localhost:5173
INFO:     Uvicorn running on http://0.0.0.0:8000
```

✅ **Backend is live at:** `http://localhost:8000`
📚 **API Docs:** `http://localhost:8000/docs`

---

### Terminal 2: Start Frontend

```bash
cd /Users/Kavya/Documents/GitHub/SC4052-Project/frontend

npm run dev
```

**Expected output:**
```
> ntu-crowd-mvp@1.0.0 dev
> vite

  VITE v5.4.21  ready in 123 ms

  ➜  Local:   http://localhost:5173/
```

✅ **Frontend is live at:** `http://localhost:5173`

---

## 🧪 End-to-End Testing

### 1. Open Frontend
- Open browser → `http://localhost:5173`
- You should see the **Campus-Flow Dashboard** landing page
- Check browser console (F12) for any errors

### 2. View Dashboard
- Click "View Crowd Status" or navigate to Dashboard tab
- Should see all **8 NTU canteens** with their statuses
- Should see **Campus Map** with dots for each canteen
- Should see **Admin Analytics** section

### 3. Submit a Report
- Go to "Report Crowd Status" tab
- Select a canteen (e.g., "North Spine Food Court")
- Select crowd level (Low, Medium, or High)
- Click "Submit Report"
- ✅ Should see success message
- Dashboard should refresh and show updated data

### 4. Verify Data Flow
- Check backend logs - should see report saved
- Refresh dashboard - crowd status should update
- Try multiple reports - confidence should increase

### 5. Test API Directly (Optional)
```bash
# In Terminal 3, test endpoints directly:

# Test health check
curl http://localhost:8000/api/v1/health

# Get all canteens status
curl http://localhost:8000/api/v1/canteens/status | jq

# Submit a report
curl -X POST http://localhost:8000/api/v1/report \
  -H "Content-Type: application/json" \
  -d '{
    "canteen_id": "1",
    "crowd_level": "High"
  }'

# Get single canteen
curl http://localhost:8000/api/v1/canteens/1 | jq
```

---

## 🐛 Troubleshooting

### Frontend shows "Cannot GET /"
- Make sure backend is running on port 8000
- Check CORS settings in `backend/main.py`

### API calls fail with 404
- Check `API_BASE` in `frontend/script-api-connected.js` (should be `http://localhost:8000/api/v1`)
- Verify backend routes are loaded: visit `http://localhost:8000/docs`

### "Firebase: The default Firebase app does not exist"
- Make sure `backend/firebase-key.json` exists
- Check `.env` has `FIREBASE_CREDENTIALS=firebase-key.json`

### Port 8000 already in use
```bash
# Find and kill process on port 8000
lsof -i :8000
kill -9 <PID>
```

---

## 📊 Files Created/Modified

```
backend/
├── main.py                    ← Updated (FastAPI app + CORS)
├── database.py               ← Created (Firebase client)
├── models.py                 ← Created (Pydantic schemas)
├── requirements.txt          ← Updated (FastAPI, Firebase)
├── .env                      ← Created (Firebase config)
├── firebase-key.json         ← ⚠️ Secret (in .gitignore)
├── setup_collections.py      ← Created (init Firestore)
├── test_endpoints.py         ← Created (local tests)
└── routes/
    ├── reports.py           ← Created (POST /report)
    ├── canteens.py          ← Created (GET endpoints)
    └── __init__.py

frontend/
├── index.html               ← Updated (new script tag)
├── script-api-connected.js  ← Created (API client)
├── script.js                ← Old (kept for reference)
├── style.css                ← Unchanged
└── package.json             ← Unchanged

.gitignore                    ← Updated (firebase-key.json)
```

---

## ✨ Phase 1 Summary

### What Works
- ✅ Database with 8 canteens + real reports
- ✅ REST API with 3 endpoints (all tested)
- ✅ Frontend connects to backend
- ✅ Real-time dashboard with crowd status
- ✅ Form submissions saved to Firebase
- ✅ Auto-refresh every 30 seconds
- ✅ CORS enabled for local development

### Ready for Phase 2
- Rate limiting system
- Crowd aggregation algorithm
- Staleness logic
- Advanced analytics

---

## 🎓 What You've Learned

1. **Backend Architecture**: FastAPI with Firebase
2. **API Design**: Pydantic models + validation
3. **Database**: Firestore collections + queries
4. **Frontend-Backend Integration**: REST API consumption
5. **Testing**: Local testing before deployment

---

## 🚀 Next Steps

### Option A: Test Locally (Recommended)
1. Follow the "How to Test Locally" section above
2. Submit a few test reports
3. Verify data flows end-to-end

### Option B: Deploy to Production
- Follow `DEPLOYMENT_GUIDE.md`
- Deploy backend to Vercel/Azure/Google Cloud
- Deploy frontend to Vercel
- Update frontend API_BASE URL

### Option C: Start Phase 2
- Implement crowd aggregation algorithm
- Add rate limiting (3 reports/user/5min)
- Follow `PHASE_2_AGGREGATION.md`

---

## 📞 Need Help?

- API Docs: `http://localhost:8000/docs` (interactive SwaggerUI)
- Backend logs show request/response details
- Browser console (F12) shows frontend errors
- Check `PHASE_1_CORE_API.md` for detailed specifications

---

**You now have a fully working Campus-Flow system! 🎉**
