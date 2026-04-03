# Phase 1: Core Data & API Setup

**Duration:** 2 weeks  
**Goal:** Get database + basic API working so frontend can submit and fetch real data  
**Priority Level:** 🔴 CRITICAL - Everything depends on this

---

## 📋 Phase Overview

In Phase 1, you'll build the **foundation** of your backend:

- ✅ Set up database schema (Canteens + Reports tables)
- ✅ Implement 3 basic REST endpoints
- ✅ Local testing with Postman/curl
- ✅ Connect frontend to working backend

**By end of Phase 1:** Frontend can submit reports → Backend stores them → Frontend displays them

---

## 🎯 Objectives

1. **Database Design & Setup**
   - Choose database platform (Firebase Firestore recommended for quick start)
   - Design and create Canteens table
   - Design and create Reports table
   - Set up basic indexes

2. **API Endpoints** (3 endpoints minimum)
   - POST `/api/v1/report` - Submit crowd report
   - GET `/api/v1/canteens/status` - Fetch all canteen statuses
   - GET `/api/v1/canteens/{id}` - Fetch single canteen details

3. **Validation & Error Handling**
   - Input validation for POST requests
   - Error responses (400, 500, etc.)
   - Logging setup

4. **Local Integration Testing**
   - Frontend can post reports
   - Frontend can fetch statuses
   - Data persists in database

---

## 📝 Detailed Tasks & Checkpoints

### Checkpoint 1.1: Database Setup (Days 1-2)

#### Task 1.1.1: Choose & Initialize Database
**Status:** ⬜ Not Started

**Steps:**
1. Create Firebase project (or AWS DynamoDB, Azure Cosmos DB)
2. Create Firestore database
3. Generate service account credentials
4. Save credentials securely in `.env` file

**Deliverable:**
```
✅ Firebase project created
✅ Firestore database initialized
✅ Service account credentials saved
✅ Connection string tested
```

**Testing:**
```bash
# Test connection with simple script
python -c "from firebase_admin import db; print('Connected!')"
```

---

#### Task 1.1.2: Create Canteens Table
**Status:** ⬜ Not Started

**Schema:**
```python
Canteens Collection {
  canteen_id: string (primary key, e.g., "1")
  name: string (e.g., "North Spine Food Court")
  location: string (e.g., "North")
  lat: number (e.g., 1.3456)
  lng: number (e.g., 103.6789)
  created_at: timestamp
}
```

**Steps:**
1. Create collection "canteens"
2. Insert 8 sample canteen documents:
   - North Spine Food Court
   - The Deck Food Court
   - Canteen 11
   - Canteen 13
   - Food Paradise (North Hill)
   - Canteen 16
   - Canteen 18
   - Canteen 9

**Code:**
```python
from firebase_admin import firestore

db = firestore.client()

canteens_data = [
    {"name": "North Spine Food Court", "location": "North", "lat": 1.3456, "lng": 103.6789},
    {"name": "The Deck Food Court", "location": "Central", "lat": 1.3467, "lng": 103.6800},
    # ... add all 8
]

for i, canteen in enumerate(canteens_data, start=1):
    db.collection("canteens").document(str(i)).set(canteen)
    print(f"✅ Inserted canteen {i}: {canteen['name']}")
```

**Verification:**
- [ ] All 8 canteens visible in Firebase Console
- [ ] Each has correct lat/lng
- [ ] Query returns all 8 documents

**Deliverable:**
```
✅ Canteens collection created
✅ 8 sample canteens inserted
✅ Firestore Console shows data
```

---

#### Task 1.1.3: Create Reports Table
**Status:** ⬜ Not Started

**Schema:**
```python
Reports Collection {
  report_id: string (auto-generated, e.g., "R001")
  canteen_id: string (foreign key, e.g., "1")
  crowd_level: string (enum: "Low", "Medium", "High")
  timestamp: timestamp (server timestamp)
  source: string (enum: "manual", "vision-ai")
  image_url: string (nullable, e.g., "gs://...")
  user_id: string (optional, e.g., "user123")
}
```

**Steps:**
1. Create collection "reports"
2. Create a few sample reports for testing
3. Add composite index for queries: (canteen_id, timestamp)

**Code:**
```python
# Sample report insertion
report_data = {
    "canteen_id": "1",
    "crowd_level": "High",
    "timestamp": firestore.SERVER_TIMESTAMP,
    "source": "manual",
    "user_id": "test_user"
}

doc_ref = db.collection("reports").document()
doc_ref.set(report_data)
print(f"✅ Report inserted: {doc_ref.id}")
```

**Verification:**
- [ ] Reports collection exists in Firebase Console
- [ ] Sample reports inserted
- [ ] Composite index created (canteen_id + timestamp)
- [ ] Query by canteen_id returns correct reports

**Deliverable:**
```
✅ Reports collection created
✅ Composite index set up
✅ Sample reports inserted
```

**⏭️ Move to Checkpoint 1.2 when:**
- Both collections created ✅
- Both have sample data ✅
- Indexes configured ✅

---

### Checkpoint 1.2: Basic API Setup (Days 3-5)

#### Task 1.2.1: Project Structure & Dependencies
**Status:** ⬜ Not Started

**Folder Structure:**
```
backend/
├── main.py                 # FastAPI app
├── requirements.txt        # Dependencies
├── .env.example           # Environment template
├── .env                   # (Hidden) API keys
├── models.py              # Pydantic schemas
├── database.py            # Firebase connection
├── routes/
│   ├── __init__.py
│   ├── reports.py         # POST /report
│   └── canteens.py        # GET /canteens
└── utils/
    ├── __init__.py
    └── validators.py      # Input validation
```

**Steps:**
1. Update `requirements.txt`:
```
fastapi==0.104.1
uvicorn==0.24.0
firebase-admin==6.2.0
python-dotenv==1.0.0
pydantic==2.5.0
```

2. Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

3. Create `.env` file:
```
FIREBASE_CREDENTIALS=path/to/firebase-key.json
DATABASE_URL=firestore
ENV=development
```

**Verification:**
- [ ] All packages installed
- [ ] `.env` configured
- [ ] `python -c "import firebase_admin"` works

**Deliverable:**
```
✅ Project structure set up
✅ Dependencies installed
✅ .env configured
```

---

#### Task 1.2.2: Implement POST `/api/v1/report`
**Status:** ⬜ Not Started

**Endpoint:**
```
POST /api/v1/report
Content-Type: application/json

{
  "canteen_id": "1",
  "crowd_level": "High",
  "source": "manual" (optional)
}
```

**Response (Success):**
```json
{
  "status": "success",
  "message": "Report submitted successfully",
  "report_id": "R12345",
  "timestamp": "2026-04-03T12:31:00Z"
}
```

**Response (Error):**
```json
{
  "status": "error",
  "message": "Invalid crowd_level. Must be 'Low', 'Medium', or 'High'",
  "code": 400
}
```

**Code:** (`routes/reports.py`)
```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from firebase_admin import firestore
from datetime import datetime

router = APIRouter(prefix="/api/v1")
db = firestore.client()

class ReportRequest(BaseModel):
    canteen_id: str
    crowd_level: str
    source: str = "manual"

@router.post("/report", status_code=201)
def submit_report(request: ReportRequest):
    # Validate crowd_level
    valid_levels = ["Low", "Medium", "High"]
    if request.crowd_level not in valid_levels:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid crowd_level. Must be one of {valid_levels}"
        )
    
    # Validate canteen_id exists
    canteen = db.collection("canteens").document(request.canteen_id).get()
    if not canteen.exists:
        raise HTTPException(
            status_code=404,
            detail=f"Canteen {request.canteen_id} not found"
        )
    
    # Create report
    report_data = {
        "canteen_id": request.canteen_id,
        "crowd_level": request.crowd_level,
        "source": request.source,
        "timestamp": firestore.SERVER_TIMESTAMP,
        "user_id": "test_user"  # TODO: Get from auth
    }
    
    doc_ref = db.collection("reports").document()
    doc_ref.set(report_data)
    
    return {
        "status": "success",
        "message": "Report submitted successfully",
        "report_id": doc_ref.id,
        "timestamp": datetime.now().isoformat() + "Z"
    }
```

**Updated main.py:**
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import reports, canteens

app = FastAPI(title="Campus-Flow-as-a-Service API")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(reports.router)
app.include_router(canteens.router)

@app.get("/health")
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

**Testing:**
```bash
# Start server
python main.py

# Test endpoint (in another terminal)
curl -X POST http://localhost:8000/api/v1/report \
  -H "Content-Type: application/json" \
  -d '{"canteen_id":"1", "crowd_level":"High"}'
```

**Verification:**
- [ ] Server starts without errors
- [ ] POST request returns 201 Created
- [ ] Report appears in Firebase
- [ ] Invalid data returns 400 error
- [ ] Missing canteen returns 404 error

**Deliverable:**
```
✅ POST /report working
✅ Data persists in Firebase
✅ Error handling implemented
✅ CORS configured
```

---

#### Task 1.2.3: Implement GET `/api/v1/canteens/status`
**Status:** ⬜ Not Started

**Endpoint:**
```
GET /api/v1/canteens/status
```

**Response:**
```json
{
  "data": [
    {
      "canteen_id": "1",
      "name": "North Spine Food Court",
      "current_status": "High",
      "confidence": 0.0,
      "last_updated": "2026-04-03T12:31:00Z",
      "report_count": 1
    },
    {
      "canteen_id": "2",
      "name": "The Deck Food Court",
      "current_status": "Unknown",
      "confidence": 0.0,
      "last_updated": null,
      "report_count": 0
    }
  ],
  "timestamp": "2026-04-03T12:34:00Z"
}
```

**For Phase 1, use simple logic:**
- No aggregation yet
- Just show the latest report's crowd level
- If no reports → "Unknown"
- Confidence always 0.0 for now (will add in Phase 2)

**Code:** (`routes/canteens.py`)
```python
from fastapi import APIRouter
from firebase_admin import firestore
from datetime import datetime

router = APIRouter(prefix="/api/v1")
db = firestore.client()

@router.get("/canteens/status")
def get_canteen_status():
    # Fetch all canteens
    canteens = db.collection("canteens").stream()
    
    result = []
    
    for canteen_doc in canteens:
        canteen = canteen_doc.to_dict()
        canteen_id = canteen_doc.id
        
        # Get latest report for this canteen
        latest_report = (
            db.collection("reports")
            .where("canteen_id", "==", canteen_id)
            .order_by("timestamp", direction=firestore.Query.DESCENDING)
            .limit(1)
            .stream()
        )
        
        report_data = None
        for report_doc in latest_report:
            report_data = report_doc.to_dict()
            break
        
        # Build response
        status_info = {
            "canteen_id": canteen_id,
            "name": canteen.get("name", "Unknown"),
            "current_status": report_data.get("crowd_level", "Unknown") if report_data else "Unknown",
            "confidence": 0.0,  # TODO: Calculate in Phase 2
            "last_updated": report_data.get("timestamp").isoformat() + "Z" if report_data and report_data.get("timestamp") else None,
            "report_count": len(list(db.collection("reports").where("canteen_id", "==", canteen_id).stream()))
        }
        
        result.append(status_info)
    
    return {
        "data": result,
        "timestamp": datetime.now().isoformat() + "Z"
    }
```

**Testing:**
```bash
curl http://localhost:8000/api/v1/canteens/status | python -m json.tool
```

**Verification:**
- [ ] Returns all 8 canteens
- [ ] Shows correct latest status
- [ ] Shows "Unknown" for canteens with no reports
- [ ] Report count is accurate

**Deliverable:**
```
✅ GET /canteens/status working
✅ Returns all canteens with status
✅ Shows "Unknown" correctly
```

**⏭️ Move to Checkpoint 1.3 when:**
- Both endpoints working ✅
- Data flowing database → API → response ✅
- Basic error handling in place ✅

---

### Checkpoint 1.3: Frontend Integration (Days 6-10)

#### Task 1.3.1: Update Frontend API URLs
**Status:** ⬜ Not Started

**File:** `frontend/script.js`

**Changes:**
```javascript
// Old (localhost storage only)
// const API_BASE = null;

// New (connect to backend)
const API_BASE = "http://localhost:8000";

// Update report submission
reportForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const canteen = canteenSelect.value;
    const level = crowdLevelInput.value;
    
    if (!canteen || !level) {
        formFeedback.textContent = 'Please select both canteen and level.';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/v1/report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                canteen_id: canteen,
                crowd_level: level,
                source: 'manual'
            })
        });
        
        if (!response.ok) throw new Error('API error');
        
        const data = await response.json();
        formFeedback.textContent = '✅ Report submitted!';
        reportForm.reset();
        
        // Refresh dashboard
        fetchCanteenStatus();
    } catch (error) {
        formFeedback.textContent = '❌ Submission failed. Check console.';
        console.error(error);
    }
});

// Fetch dashboard data
async function fetchCanteenStatus() {
    try {
        const response = await fetch(`${API_BASE}/api/v1/canteens/status`);
        if (!response.ok) throw new Error('Failed to fetch');
        
        const data = await response.json();
        renderDashboard(data.data);
    } catch (error) {
        console.error('Dashboard error:', error);
        formFeedback.textContent = '❌ Failed to load dashboard';
    }
}
```

**Verification:**
- [ ] Frontend connects to backend
- [ ] No CORS errors
- [ ] Reports save to database
- [ ] Dashboard updates

**Deliverable:**
```
✅ Frontend API integration complete
✅ Reports flow: Frontend → Backend → Database
```

---

#### Task 1.3.2: End-to-End Test
**Status:** ⬜ Not Started

**Manual Testing Checklist:**

1. Start Backend:
```bash
cd backend
python main.py
# Should see: "Uvicorn running on http://0.0.0.0:8000"
```

2. Start Frontend:
```bash
cd frontend
npm run dev
# Should see: "Local: http://localhost:5173"
```

3. Test Flow:
   - [ ] Open http://localhost:5173 in browser
   - [ ] Navigate to "Submit Report"
   - [ ] Select a canteen and crowd level
   - [ ] Click "Submit Report"
   - [ ] See success message
   - [ ] Go to Dashboard
   - [ ] See updated crowd level for that canteen
   - [ ] Check Firebase Console → Reports collection → New report exists

4. Test Multiple Reports:
   - [ ] Submit 3 reports for same canteen
   - [ ] Check Firebase shows all 3
   - [ ] Dashboard shows latest one

5. Test Error Handling:
   - [ ] Stop backend server
   - [ ] Try to submit report → Should see error
   - [ ] Restart backend → Should work again

**Deliverable:**
```
✅ End-to-end flow working
✅ Frontend ↔ Backend ↔ Database
✅ Error recovery working
```

**⏭️ Move to Checkpoint 1.4 when:**
- E2E test passed ✅
- All CRUD operations working ✅
- No console errors ✅

---

### Checkpoint 1.4: Documentation & Cleanup (Days 11-14)

#### Task 1.4.1: API Documentation
**Status:** ⬜ Not Started

**Create:** `backend/API_DOCUMENTATION.md`

```markdown
# Campus-Flow API - Phase 1 Documentation

## Base URL
`http://localhost:8000`

## Endpoints

### 1. Submit Report
- **Method:** POST
- **URL:** `/api/v1/report`
- **Request Body:**
  ```json
  {
    "canteen_id": "1",
    "crowd_level": "High",
    "source": "manual"
  }
  ```
- **Response (201):**
  ```json
  {
    "status": "success",
    "report_id": "R123",
    "message": "Report submitted"
  }
  ```
- **Errors:** 400 (invalid data), 404 (canteen not found)

### 2. Get Canteen Status
- **Method:** GET
- **URL:** `/api/v1/canteens/status`
- **Response (200):**
  ```json
  {
    "data": [...],
    "timestamp": "2026-04-03..."
  }
  ```

### 3. Health Check
- **Method:** GET
- **URL:** `/health`
- **Response:** `{"status": "ok"}`
```

**Deliverable:**
```
✅ API documentation created
✅ Examples provided
✅ Error codes documented
```

---

#### Task 1.4.2: Setup Instructions
**Status:** ⬜ Not Started

**Create:** `backend/SETUP.md`

```markdown
# Backend Setup Guide

## Prerequisites
- Python 3.9+
- Firebase account

## Installation

1. Clone repo and navigate:
```bash
cd backend
```

2. Set up environment:
```bash
cp .env.example .env
# Edit .env with your Firebase credentials
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run server:
```bash
python main.py
```

Server should be at `http://localhost:8000`

## Testing

### Using Postman
1. Import HTTP calls from `API_DOCUMENTATION.md`
2. Test each endpoint

### Using curl
```bash
curl -X POST http://localhost:8000/api/v1/report \
  -H "Content-Type: application/json" \
  -d '{"canteen_id":"1", "crowd_level":"High"}'
```

## Troubleshooting

**CORS Error?**
- Make sure frontend URL is in CORS list in `main.py`

**Firebase connection error?**
- Check `.env` file has correct credentials
- Verify Firebase project exists

**Port 8000 already in use?**
- Change port: `uvicorn main:app --port 8001`
```

**Deliverable:**
```
✅ Setup guide created
✅ Troubleshooting guide added
✅ Clear instructions for others
```

---

## 🧪 Testing Strategy for Phase 1

### Unit Tests
```python
# tests/test_endpoints.py
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_submit_report():
    response = client.post("/api/v1/report", json={
        "canteen_id": "1",
        "crowd_level": "High"
    })
    assert response.status_code == 201
    assert response.json()["status"] == "success"

def test_invalid_crowd_level():
    response = client.post("/api/v1/report", json={
        "canteen_id": "1",
        "crowd_level": "Invalid"
    })
    assert response.status_code == 400
```

**Run tests:**
```bash
pip install pytest
pytest tests/
```

---

## ✅ Phase1 Success Criteria

- [ ] Database schema created (Canteens + Reports)
- [ ] 8 sample canteens in database
- [ ] POST `/api/v1/report` endpoint working
- [ ] GET `/api/v1/canteens/status` endpoint working
- [ ] Frontend can submit reports
- [ ] Frontend can fetch canteen status
- [ ] Data persists in Firebase
- [ ] Error handling in place
- [ ] CORS configured
- [ ] Documentation complete
- [ ] E2E test passed locally
- [ ] No console errors

---

## 🎯 Deliverables Checklist

- [ ] **Codebase**
  - [ ] `main.py` with FastAPI setup
  - [ ] `routes/reports.py` - POST endpoint
  - [ ] `routes/canteens.py` - GET endpoint
  - [ ] `models.py` - Pydantic schemas
  - [ ] `.env` configured
  - [ ] `requirements.txt` updated

- [ ] **Database**
  - [ ] Firebase project created
  - [ ] Canteens collection with 8 documents
  - [ ] Reports collection initialized
  - [ ] Composite index created

- [ ] **Documentation**
  - [ ] `API_DOCUMENTATION.md` created
  - [ ] `SETUP.md` created
  - [ ] Deployment plan started

- [ ] **Testing**
  - [ ] Manual E2E test passed
  - [ ] All endpoints tested with curl/Postman
  - [ ] Error scenarios tested

---

## ⏭️ Next Phase

When Phase 1 is complete, proceed to **Phase 2: Aggregation Logic & Rate Limiting**

In Phase 2, you'll add:
- Crowd calculation algorithm (averaging multiple reports)
- Confidence scoring
- Staleness logic
- Rate limiting

---

**Phase 1 Status:** 🔴 Not Started  
**Last Updated:** 2026-04-03
