# Phase 3: Vision Pipeline & Advanced Analytics

**Duration:** 1 week  
**Goal:** AI image upload + peak hour analysis  
**Priority Level:** 🟠 VALUE-ADD - Impresses professors

---

## 📋 Phase Overview

In Phase 3, you'll add the **AI integration** and **analytics**:

- ✅ POST `/api/v1/vision-report` - Image upload endpoint
- ✅ Vision API integration (Google Cloud or mock)
- ✅ GET `/api/v1/admin/analytics` - Peak hours + trends
- ✅ Peak hour detection algorithm
- ✅ Trend analysis (current vs historical)

**By end of Phase 3:** Students can upload images, backend detects crowd, shows analytics

---

## 🎯 Objectives

1. **Vision Pipeline**
   - Image upload handling
   - Cloud storage (Firebase Storage)
   - Vision API integration or mock
   - Create report from detection automatically

2. **Analytics Endpoints**
   - Peak hour detection (which hour is busiest)
   - Trend detection (busier/quieter than usual)
   - Time-range filtering (hour/day/week)

---

## 📝 Detailed Tasks

### Checkpoint 3.1: Vision Pipeline Setup (Days 1-3)

#### Task 3.1.1: Create POST `/api/v1/vision-report` Endpoint
**Status:** ⬜ Not Started

**File:** `backend/routes/vision.py`

```python
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from firebase_admin import storage
from logic.crowd_calculation import map_people_count_to_level
import asyncio
import uuid

router = APIRouter(prefix="/api/v1")
db = firestore.client()
bucket = storage.bucket()

@router.post("/vision-report", status_code=201)
async def submit_vision_report(
    image: UploadFile = File(...),
    canteen_id: str = Form(...)
):
    """
    Upload image and get AI-detected crowd level.
    
    Args:
        image: Image file (jpg/png)
        canteen_id: Canteen ID
    
    Returns:
        {
            "status": "success",
            "detected_crowd_level": "High",
            "people_count": 22,
            "confidence": 0.89,
            "report_id": "R123"
        }
    """
    
    # Validate canteen
    canteen = db.collection("canteens").document(canteen_id).get()
    if not canteen.exists:
        raise HTTPException(status_code=404, detail="Canteen not found")
    
    # Generate file name
    file_id = str(uuid.uuid4())
    filename = f"canteen_{canteen_id}_{file_id}.jpg"
    
    try:
        # Upload to Firebase Storage
        print(f"Uploading image: {filename}")
        blob = bucket.blob(f"vision-reports/{filename}")
        
        # Read image data
        image_data = await image.read()
        blob.upload_from_string(image_data, content_type=image.content_type)
        
        # Get image URL
        image_url = f"gs://your-bucket-name/vision-reports/{filename}"
        
        # Run vision detection
        people_count, detection_confidence = await run_vision_detection(image_data)
        
        # Map to crowd level
        crowd_level = map_people_count_to_level(people_count)
        
        # Create report
        report_data = {
            "canteen_id": canteen_id,
            "crowd_level": crowd_level,
            "source": "vision-ai",
            "image_url": image_url,
            "timestamp": firestore.SERVER_TIMESTAMP,
            "vision_metadata": {
                "people_count": people_count,
                "detection_confidence": detection_confidence,
                "file_name": filename
            },
            "user_id": "vision_system"
        }
        
        doc_ref = db.collection("reports").document()
        doc_ref.set(report_data)
        
        return {
            "status": "success",
            "message": "Image analyzed successfully",
            "detected_crowd_level": crowd_level,
            "people_count": people_count,
            "confidence": detection_confidence,
            "report_id": doc_ref.id
        }
    
    except Exception as e:
        print(f"Vision processing error: {e}")
        # Fallback: just store image, ask user for manual level
        raise HTTPException(
            status_code=500,
            detail="Vision processing failed. Please try manual report."
        )
```

**Verification:**
- [ ] Endpoint handles image upload
- [ ] Image stored in Firebase Storage
- [ ] Report created in database
- [ ] Returns report_id

**Deliverable:**
```
✅ POST /vision-report endpoint created
✅ Image upload working
✅ Report creation working
```

---

#### Task 3.1.2: Implement Vision Detection (Mock First)
**Status:** ⬜ Not Started

**File:** `backend/services/vision_service.py`

**Option A: Mock Detection (Recommended for Phase 3)**
```python
import random

async def run_vision_detection(image_data: bytes) -> tuple:
    """
    Mock vision detection.
    Returns: (people_count, confidence)
    """
    # For demo: use file size to generate "random" count
    file_size = len(image_data)
    
    # Generate count between 0-30
    people_count = (file_size % 31)
    
    # Confidence based on file size variations
    confidence = round(0.7 + (file_size % 30) / 100, 2)
    
    return people_count, confidence
```

**Option B: Google Cloud Vision API (Real)**
```python
from google.cloud import vision
import os

vision_client = vision.ImageAnnotatorClient()

async def run_vision_detection(image_data: bytes) -> tuple:
    """Real vision detection using Google Cloud Vision API."""
    
    image = vision.Image(content=image_data)
    
    try:
        # Object detection (counts people)
        response = vision_client.object_localization(image=image)
        
        # Count people objects
        people_count = sum(
            1 for obj in response.localized_objects
            if "person" in obj.name.lower()
        )
        
        # Get average confidence
        if response.localized_objects:
            avg_confidence = sum(
                obj.score for obj in response.localized_objects
            ) / len(response.localized_objects)
        else:
            avg_confidence = 0.0
        
        return people_count, round(avg_confidence, 2)
    
    except Exception as e:
        print(f"Vision API error: {e}")
        raise
```

**For Phase 3: Use mock. Can upgrade to real API later.**

**Verification:**
- [ ] Mock returns consistent results
- [ ] People count between 0-30
- [ ] Confidence 0.0-1.0

---

### Checkpoint 3.2: Analytics Endpoints (Days 4-5)

#### Task 3.2.1: Implement Peak Hour Detection
**Status:** ⬜ Not Started

**File:** `backend/logic/analytics.py`

```python
from datetime import datetime, timedelta
from collections import defaultdict
from firebase_admin import firestore

db = firestore.client()

def detect_peak_hours(canteen_id: str, days: int = 7) -> dict:
    """
    Detect peak hours for a canteen.
    
    Returns:
        {
            "peak_hour": 12,
            "peak_count": 127,
            "hourly_distribution": {"0": 5, "1": 3, ..., "12": 127, ..., "23": 8},
            "busiest_period": "12:00-13:00"
        }
    """
    
    # Get reports from last N days
    cutoff = datetime.now() - timedelta(days=days)
    
    reports = db.collection("reports").where(
        "canteen_id", "==", canteen_id
    ).where(
        "timestamp", ">=", cutoff
    ).stream()
    
    # Group by hour
    hourly_counts = defaultdict(int)
    
    for report_doc in reports:
        report = report_doc.to_dict()
        timestamp = report.get("timestamp")
        
        if timestamp:
            hour = timestamp.hour
            hourly_counts[hour] += 1
    
    # Find peak
    if not hourly_counts:
        return {
            "peak_hour": None,
            "peak_count": 0,
            "hourly_distribution": {},
            "message": "No data available"
        }
    
    peak_hour = max(hourly_counts, key=hourly_counts.get)
    peak_count = hourly_counts[peak_hour]
    
    # Create distribution with all hours (fill missing with 0)
    distribution = {str(h): hourly_counts.get(h, 0) for h in range(24)}
    
    return  {
        "peak_hour": peak_hour,
        "peak_count": peak_count,
        "busiest_period": f"{peak_hour:02d}:00-{(peak_hour+1)%24:02d}:00",
        "hourly_distribution": distribution
    }

def detect_trends(canteen_id: str) -> dict:
    """
    Compare current hour vs historical average.
    
    Returns:
        {
            "current_level": 2.8,
            "historical_avg": 2.2,
            "trend": "BUSIER_THAN_USUAL" | "NORMAL" | "QUIETER_THAN_USUAL",
            "delta": 0.6
        }
    """
    
    now = datetime.now()
    current_hour = now.hour
    
    # Get reports from current hour (last 1 hour)
    hour_ago = now - timedelta(hours=1)
    current_reports = db.collection("reports").where(
        "canteen_id", "==", canteen_id
    ).where(
        "timestamp", ">=", hour_ago
    ).stream()
    
    current_levels = []
    for report_doc in current_reports:
        report = report_doc.to_dict()
        level = report.get("crowd_level")
        current_levels.append(encode_level(level))
    
    current_avg = sum(current_levels) / len(current_levels) if current_levels else 0
    
    # Get historical average for this hour (past 4 weeks)
    four_weeks_ago = now - timedelta(weeks=4)
    historical_reports = db.collection("reports").where(
        "canteen_id", "==", canteen_id
    ).where(
        "timestamp", ">=", four_weeks_ago
    ).stream()
    
    historical_levels = []
    for report_doc in historical_reports:
        report = report_doc.to_dict()
        timestamp = report.get("timestamp")
        
        # Only include if same hour as current
        if timestamp and timestamp.hour == current_hour:
            level = report.get("crowd_level")
            historical_levels.append(encode_level(level))
    
    historical_avg = sum(historical_levels) / len(historical_levels) if historical_levels else 0
    
    # Calculate delta
    delta = current_avg - historical_avg
    
    # Determine trend
    if delta > 0.5:
        trend = "BUSIER_THAN_USUAL"
    elif delta < -0.5:
        trend = "QUIETER_THAN_USUAL"
    else:
        trend = "NORMAL"
    
    return {
        "current_level": round(current_avg, 2),
        "historical_avg": round(historical_avg, 2),
        "trend": trend,
        "delta": round(delta, 2),
        "samples_current": len(current_levels),
        "samples_historical": len(historical_levels)
    }
```

**Verification:**
- [ ] Peak hour correctly identified
- [ ] Hourly distribution shows all 24 hours
- [ ] Trend calculation correct
- [ ] Handles missing data gracefully

---

#### Task 3.2.2: Create GET `/admin/analytics`
**Status:** ⬜ Not Started

**File:** `backend/routes/analytics.py`

```python
from fastapi import APIRouter, Query
from logic.analytics import detect_peak_hours, detect_trends
from logic.crowd_calculation import compute_crowd_status, apply_staleness_logic

router = APIRouter(prefix="/api/v1")
db = firestore.client()

@router.get("/admin/analytics")
def get_analytics(
    time_range: str = Query("hour", enum=["hour", "day", "week"]),
    canteen_id: str = Query(None)
):
    """
    Get analytics for canteen(s).
    
    Query Parameters:
        time_range: "hour", "day", or "week"
        canteen_id: optional, specific canteen
    
    Returns:
        {
            "time_range": "hour",
            "analytics": [
                {
                    "canteen_id": "1",
                    "name": "North Spine",
                    "current_status": "High",
                    "peak_hours": {...},
                    "trends": {...},
                    "recommendations": "..."
                }
            ]
        }
    """
    
    # Get canteens to analyze
    if canteen_id:
        canteen_docs = [db.collection("canteens").document(canteen_id).get()]
    else:
        canteen_docs = list(db.collection("canteens").stream())
    
    analytics = []
    
    for canteen_doc in canteen_docs:
        if not canteen_doc.exists:
            continue
        
        cid = canteen_doc.id
        canteen = canteen_doc.to_dict()
        
        # Current status
        status = compute_crowd_status(db, cid)
        status = apply_staleness_logic(status)
        
        # Analytics
        peak_data = detect_peak_hours(cid, days=7)
        trend_data = detect_trends(cid)
        
        # Generate recommendation
        recommendation = generate_recommendation(trend_data, peak_data)
        
        analytics.append({
            "canteen_id": cid,
            "name": canteen.get("name", "Unknown"),
            "current_status": status.get("status"),
            "confidence": status.get("confidence"),
            "peak_hours": peak_data,
            "trends": trend_data,
            "recommendation": recommendation
        })
    
    return {
        "time_range": time_range,
       "generated_at": datetime.now().isoformat() + "Z",
        "analytics": analytics
    }

def generate_recommendation(trends: dict, peaks: dict) -> str:
    """Generate actionable recommendation based on data."""
    
    trend = trends.get("trend")
    peak_hour = peaks.get("peak_hour")
    
    if trend == "BUSIER_THAN_USUAL":
        if peak_hour:
            return f"⚠️ Busier than usual right now. Peak is typically {peak_hour}:00-{(peak_hour+1)%24}:00"
        else:
            return "⚠️ Currently experiencing higher than normal crowds"
    
    elif trend == "QUIETER_THAN_USUAL":
        if peak_hour:
            return f"✅ Quieter than usual. Peak is typically {peak_hour}:00-{(peak_hour+1)%24}:00"
        else:
            return "✅ Lower than normal crowds. Good time to visit!"
    
    else:
        if peak_hour:
            return f"📊 Normal. Peak is typically {peak_hour}:00-{(peak_hour+1)%24}:00"
        else:
            return "📊 Average activity levels"
```

**Testing:**
```bash
# Get analytics for all canteens
curl http://localhost:8000/api/v1/admin/analytics

# Get analytics for specific canteen
curl http://localhost:8000/api/v1/admin/analytics?canteen_id=1

# Different time ranges
curl http://localhost:8000/api/v1/admin/analytics?time_range=day
curl http://localhost:8000/api/v1/admin/analytics?time_range=week
```

**Verification:**
- [ ] Returns peak hours
- [ ] Calculates trends correctly
- [ ] Generates recommendations
- [ ] Time-range filtering works

---

### Checkpoint 3.3: Frontend Vision Integration (Day 6-7)

#### Task 3.3.1: Update Frontend for Image Upload
**Status:** ⬜ Not Started

**Update:** `frontend/index.html` - Add image preview

```html
<div class="ai-hint" id="aiHint">
  Upload an image and AI will detect crowd level automatically.
</div>

<div id="imagePreview" class="image-preview" style="display: none;">
  <img id="previewImg" src="" alt="Preview" />
  <p>Preview</p>
</div>
```

**Update:** `frontend/script.js` - Handle image upload

```javascript
imageUpload.addEventListener('change', (event) => {
  const file = event.target.files[0];
  
  if (!file) {
    document.getElementById('imagePreview').style.display = 'none';
    return;
  }
  
  // Show preview
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('previewImg').src = e.target.result;
    document.getElementById('imagePreview').style.display = 'block';
  };
  reader.readAsDataURL(file);
  
  // Indicate processing will happen
  aiHint.textContent = '📸 Ready to upload. Click Submit Report.';
});

reportForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  
  const canteen = canteenSelect.value;
  const file = imageUpload.files[0];
  
  if (!canteen) {
    formFeedback.textContent = 'Please select a canteen.';
    return;
  }
  
  if (file) {
    // Upload with vision API
    await submitVisionReport(canteen, file);
  } else {
    // Manual submission
    await submitManualReport(canteen, crowdLevelInput.value);
  }
});

async function submitVisionReport(canteen_id, file) {
  aiHint.textContent = '🧠 Analyzing image...';
  aiHint.style.opacity = '0.7';
  
  try {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('canteen_id', canteen_id);
    
    const response = await fetch(`${API_BASE}/api/v1/vision-report`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) throw new Error('Vision processing failed');
    
    const data = await response.json();
    
    aiHint.textContent = `✅ AI Detected: ${data.detected_crowd_level}`;
    formFeedback.textContent = 'Report submitted!';
    
    reportForm.reset();
    document.getElementById('imagePreview').style.display = 'none';
    await fetchCanteenStatus();
    
  } catch (error) {
    aiHint.textContent = '❌ Vision processing failed. Submit manually.';
    console.error(error);
  }
}
```

**Verification:**
- [ ] Image preview shows when file selected
- [ ] Image upload sends to backend
- [ ] AI response received
- [ ] Report created in database

---

## ✅ Phase 3 Success Criteria

- [ ] POST `/api/v1/vision-report` working
- [ ] Image upload to Firebase Storage
- [ ] Vision detection (mock or real) working
- [ ] Report created from detection
- [ ] GET `/admin/analytics` endpoint working
- [ ] Peak hour detection accurate
- [ ] Trend detection working
- [ ] Frontend can upload images
- [ ] AI response shown to user
- [ ] Recommendations generated

---

## 🎯 Example Analytics Response

```json
{
  "analytics": [
    {
      "canteen_id": "1",
      "name": "North Spine Food Court",
      "current_status": "High",
      "confidence": 0.8,
      "peak_hours": {
        "peak_hour": 12,
        "peak_count": 127,
        "busiest_period": "12:00-13:00",
        "hourly_distribution": {...}
      },
      "trends": {
        "current_level": 2.8,
        "historical_avg": 2.2,
        "trend": "BUSIER_THAN_USUAL",
        "delta": 0.6
      },
      "recommendation": "⚠️ Busier than usual right now. Peak is typically 12:00-13:00"
    }
  ]
}
```

---

## ⏭️ Next Phase

When Phase 3 complete, proceed to **Phase 4: Caching & Failure Handling**

---

**Phase 3 Status:** 🔴 Not Started  
**Last Updated:** 2026-04-03
