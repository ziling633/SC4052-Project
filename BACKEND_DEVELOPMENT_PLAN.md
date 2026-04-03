# Campus-Flow-as-a-Service: Backend Development Plan

## 📋 Project Overview

**Campus-Flow-as-a-Service** is a dual-utility cloud-native platform that solves real-time crowd management on NTU campus by focusing on canteen queue monitoring.

### Dual Value Proposition

| Stakeholder | Value | Benefit |
|---|---|---|
| **Students (SaaS)** | Real-time canteen crowd dashboard | Avoid queues, plan meals smarter |
| **NTU Management (PaaS/Analytics)** | Spatial analytics & demand forecasting | Optimize vendor capacity, improve campus planning |

---

## 🏗️ System Architecture Layers

```
┌─────────────────────────────────────────┐
│  Layer 1: Data Collection (Frontend)    │
│  - Manual reports, image uploads        │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│  Layer 2: API Service (REST Gateway)    │
│  - POST /report, GET /canteens/status   │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│  Layer 3: Processing & Logic            │
│  - Aggregation, confidence scoring      │
│  - Staleness logic, status computation  │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│  Layer 4: Data & AI Pipeline            │
│  - Database (Firestore/DynamoDB)        │
│  - Vision API (crowd detection)         │
│  - Cloud Storage (images)               │
└─────────────────────────────────────────┘
```

---

## 📊 Data Models

### 1. Canteens Table

```python
Canteen {
    canteen_id: int (primary key)
    name: string
    location: string
    lat: float
    lng: float
}
```

**Example:**
| canteen_id | name | location | lat | lng |
|---|---|---|---|---|
| 1 | North Spine Food Court | North | 1.3456 | 103.6789 |
| 2 | The Deck Food Court | Central | 1.3467 | 103.6800 |
| 3 | Canteen 11 | South | 1.3450 | 103.6790 |

---

### 2. Reports Table

```python
Report {
    report_id: int (primary key)
    canteen_id: int (foreign key)
    crowd_level: string (enum: "Low", "Medium", "High")
    timestamp: datetime
    source: string (enum: "manual", "vision-ai")
    image_url: string (nullable)
    user_id: string (optional)
}
```

**Example:**
| report_id | canteen_id | crowd_level | timestamp | source | image_url |
|---|---|---|---|---|---|
| R001 | 1 | High | 2026-04-03 12:31:00 | manual | null |
| R002 | 1 | High | 2026-04-03 12:32:15 | vision-ai | s3://images/r002.jpg |
| R003 | 1 | Medium | 2026-04-03 12:33:45 | manual | null |

---

### 3. Computed Status (Derived, NOT Stored Permanently)

```python
ComputedStatus {
    canteen_id: int
    current_status: string ("Low", "Medium", "High", "Unknown")
    confidence: float (0.0 - 1.0)
    last_updated: datetime
}
```

**Example Output:**
```json
{
  "canteen_id": 1,
  "current_status": "High",
  "confidence": 0.73,
  "last_updated": "2026-04-03T12:33:45Z"
}
```

---

## 🔌 REST API Endpoints

### 1. Submit Report (Manual)

**POST** `/api/v1/report`

**Request:**
```json
{
  "canteen_id": 1,
  "crowd_level": "High",
  "source": "manual"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Report submitted successfully",
  "report_id": "R123"
}
```

**Status Code:** 201 Created

---

### 2. Get All Canteen Status

**GET** `/api/v1/canteens/status`

**Query Parameters (Optional):**
- `canteen_id`: filter by specific canteen
- `min_confidence`: only return confident statuses (e.g., 0.5)

**Response:**
```json
{
  "data": [
    {
      "canteen_id": 1,
      "name": "North Spine Food Court",
      "current_status": "High",
      "confidence": 0.73,
      "last_updated": "2026-04-03T12:33:45Z",
      "report_count": 5
    },
    {
      "canteen_id": 2,
      "name": "The Deck Food Court",
      "current_status": "Unknown",
      "confidence": 0.0,
      "last_updated": "2026-04-03T11:15:00Z",
      "report_count": 0
    }
  ],
  "timestamp": "2026-04-03T12:34:00Z"
}
```

**Status Code:** 200 OK

---

### 3. Get Single Canteen Details

**GET** `/api/v1/canteens/{canteen_id}`

**Response:**
```json
{
  "canteen_id": 1,
  "name": "North Spine Food Court",
  "location": "North",
  "current_status": "High",
  "confidence": 0.73,
  "recent_reports": [
    {
      "report_id": "R003",
      "crowd_level": "Medium",
      "timestamp": "2026-04-03T12:33:45Z",
      "source": "manual"
    },
    {
      "report_id": "R002",
      "crowd_level": "High",
      "timestamp": "2026-04-03T12:32:15Z",
      "source": "vision-ai"
    }
  ]
}
```

---

### 4. Upload Image (Vision AI Pipeline)

**POST** `/api/v1/vision-report`

**Request (multipart/form-data):**
```
- image: <binary file>
- canteen_id: 1
```

**Backend Flow:**
1. Receive image upload
2. Store in cloud storage (S3/Firebase)
3. Call Vision API to detect crowd
4. Map detection to crowd level (Low/Medium/High)
5. Create report entry automatically
6. Return detected status

**Response:**
```json
{
  "status": "success",
  "message": "Image analyzed successfully",
  "detected_crowd_level": "High",
  "people_count": 22,
  "confidence": 0.89,
  "report_id": "R124"
}
```

---

### 5. Get Dashboard Analytics (Admin)

**GET** `/api/v1/admin/analytics`

**Query Parameters:**
- `time_range`: "hour", "day", "week"
- `canteen_id`: optional

**Response:**
```json
{
  "time_range": "hour",
  "summary": {
    "total_reports": 45,
    "peak_time": "12:30-13:00",
    "most_crowded": "North Spine Food Court",
    "least_crowded": "Hall 2 Canteen"
  },
  "heatmap": [
    {
      "canteen_id": 1,
      "status": "High",
      "report_count": 15,
      "avg_confidence": 0.75
    }
  ]
}
```

---

## 🧠 Core Logic Layer

### Crowd Calculation Algorithm

**Rule:** Only consider reports from the last **10 minutes**.

**Step 1: Filter Recent Reports**
```python
def get_recent_reports(canteen_id, time_window_minutes=10):
    now = datetime.now()
    cutoff = now - timedelta(minutes=time_window_minutes)
    return Report.filter(
        canteen_id == canteen_id,
        timestamp >= cutoff
    )
```

**Step 2: Convert to Numeric Scale**
```
Low = 1
Medium = 2
High = 3
```

**Step 3: Calculate Average**
```python
def compute_crowd_status(canteen_id):
    reports = get_recent_reports(canteen_id)
    
    if len(reports) == 0:
        return {
            "status": "Unknown",
            "confidence": 0.0,
            "reason": "No recent data"
        }
    
    # Convert to numbers
    levels = [encode_level(r.crowd_level) for r in reports]  # [3, 2, 3]
    
    # Calculate average
    avg_level = sum(levels) / len(levels)  # 2.66
    
    # Convert back to string
    final_status = decode_level(avg_level)  # "High"
    
    # Calculate confidence
    expected_reports = 5  # expected per 10 min window
    confidence = min(len(reports) / expected_reports, 1.0)
    
    return {
        "status": final_status,
        "confidence": confidence,
        "report_count": len(reports)
    }
```

**Example:**
| Report | Level | Numeric |
|---|---|---|
| User 1 | High | 3 |
| User 2 | Medium | 2 |
| User 3 | High | 3 |
| **Average** | | **2.66 → High** |
| **Confidence** | | **3/5 = 0.6** |

---

### Staleness Logic (Critical for Reliability)

**Rule:** If last report > 15 minutes old → mark as UNKNOWN

```python
def apply_staleness_logic(status_info):
    last_report_time = status_info["last_updated"]
    now = datetime.now()
    age_minutes = (now - last_report_time).total_seconds() / 60
    
    if age_minutes > 15:
        return {
            "status": "Unknown",
            "confidence": 0.0,
            "reason": f"No data for {age_minutes:.0f} minutes",
            "last_updated": last_report_time
        }
    
    return status_info
```

---

## 🤖 Vision-to-Status AI Pipeline

### Simple But Impressive

**Don't overthink this.** A basic heuristic is fine.

**Pipeline:**
```
User uploads image
      ↓
Cloud Storage (S3/Firebase)
      ↓
Vision API call (Google Cloud Vision / AWS Rekognition)
      ↓
Extract people count
      ↓
Map to crowd level
      ↓
Create report
```

### Crowd Mapping Rules

```python
def map_people_count_to_level(people_count):
    if people_count <= 5:
        return "Low"
    elif people_count <= 15:
        return "Medium"
    else:
        return "High"

# Examples:
map_people_count_to_level(3)   # → "Low"
map_people_count_to_level(10)  # → "Medium"
map_people_count_to_level(20)  # → "High"
```

### Implementation Options

**Option A: Google Cloud Vision API**
```python
from google.cloud import vision

def detect_crowd_level(image_url):
    client = vision.ImageAnnotatorClient()
    image = vision.Image(source=vision.ImageSource(image_url=image_url))
    response = client.object_localization(image=image)
    
    # Count people objects
    person_count = sum(1 for obj in response.localized_objects 
                       if obj.name.lower() == "person")
    
    return map_people_count_to_level(person_count)
```

**Option B: Mock/Simulated (if API not available)**
```python
def detect_crowd_level_mock(image_file):
    # Fake it for demo purposes
    file_size = len(image_file.read())
    people_count = (file_size % 30)  # Random 0-29
    return map_people_count_to_level(people_count)
```

---

## 📦 Cloud Architecture

### Proposed Tech Stack

```
┌──────────────────────────────────────────────┐
│         Frontend (React/Vue)                 │
│  (Hosted on Vercel/Netlify)                  │
└────────────────┬─────────────────────────────┘
                 │ (HTTPS)
┌────────────────▼─────────────────────────────┐
│    CDN (CloudFlare / AWS CloudFront)         │  ⚡ VALUE-ADD
│    - Caching static assets                   │
│    - Global edge locations                   │
└────────────────┬─────────────────────────────┘
                 │
┌────────────────▼─────────────────────────────┐
│  API Gateway / Load Balancer (CORE)          │
│  (AWS API Gateway / Firebase)                │
│  - Request throttling                        │
│  - Rate limiting (3 reports/user/5min)       │
└────────────────┬─────────────────────────────┘
                 │
┌────────────────▼─────────────────────────────┐
│  Serverless Functions (Compute) (CORE)       │
│  - AWS Lambda / Google Cloud Functions       │
│  - Report submission handler                 │
│  - Status calculation handler                │
│  - Vision pipeline handler                   │
└────────────────┬─────────────────────────────┘
                 │
     ┌───────────┴──────────┬──────────┐
     ↓                      ↓          ↓
 ┌────────────┐  ┌──────────────────┐  ┌─────────────┐
 │ Redis Cache│  │  Database        │  │  Vision API │
 │ (VALUE-ADD)│  │ Firestore/Dynamo │  │  + Cloud    │
 │            │  │ (CORE)           │  │  Storage    │
 └────────────┘  └──────────────────┘  │  (CORE)     │
                                        └─────────────┘
```

### Why Serverless?

| Benefit | Why It Matters |
|---|---|
| **Auto-scaling** | Handles peak lunch hours (12-1pm) without manual intervention |
| **Pay-per-use** | Only pay for actual requests processed |
| **No infrastructure management** | Focus on logic, not DevOps |
| **Built-in logging** | Easy debugging and monitoring |
| **Fast deployment** | Deploy new logic instantly |

---

## 💾 Redis Cache Layer (VALUE-ADD)

**Purpose:** Reduce database load and improve response times

### Why Redis?

| Benefit | Implementation |
|---|---|
| **Low Latency** | In-memory storage → ~1ms response vs ~100ms DB |
| **High Availability** | Replicated across availability zones |
| **Efficient Scaling** | Handles peak hours (12-1pm) without DB strain |

### Caching Strategy

```python
# Cache computed status for 2 minutes
CACHE_KEY = f"canteen_status:{canteen_id}"
CACHE_TTL = 120  # seconds

def get_canteen_status_cached(canteen_id):
    # Check cache first
    cached = redis.get(CACHE_KEY)
    if cached:
        return json.loads(cached)
    
    # Miss: compute fresh status
    status = compute_crowd_status(canteen_id)
    
    # Store in cache
    redis.setex(CACHE_KEY, CACHE_TTL, json.dumps(status))
    
    return status

def invalidate_cache_on_report(canteen_id):
    # When new report arrives, invalidate cache
    redis.delete(f"canteen_status:{canteen_id}")
```

### What to Cache

- ✅ Computed canteen status (2 min TTL)
- ✅ GET `/canteens/status` response (1 min TTL)
- ✅ Analytics summaries (5 min TTL)
- ❌ Individual reports (always fresh)
- ❌ User data (always fresh for security)

---

## 🛡️ Rate Limiting & Abuse Prevention (CORE)

**Rule:** Max 3 reports per user per 5 minutes

### Why?

- ✅ Prevents malicious crowd manipulation
- ✅ Ensures quality signaling
- ✅ Forces thoughtful reporting

### Implementation

```python
from datetime import datetime, timedelta

def check_rate_limit(user_id, max_reports=3, window_minutes=5):
    key = f"rate_limit:{user_id}"
    current = redis.get(key)
    
    if current is None:
        # First report in window
        redis.setex(key, window_minutes * 60, "1")
        return True
    
    count = int(current)
    
    if count >= max_reports:
        return False  # Rate limited
    
    # Increment counter
    redis.incr(key)
    return True

# In report submission endpoint
if not check_rate_limit(user_id):
    return {
        "status": "error",
        "message": "Too many reports. Max 3 per 5 minutes.",
        "code": 429  # Too Many Requests
    }
```

### Response

```json
{
  "status": "error",
  "message": "Too many reports. Max 3 per 5 minutes.",
  "retry_after_seconds": 180,
  "code": 429
}
```

---

## 🚀 Implementation Phases

### Phase 1: Core Data & API (Weeks 1-2)

**Goals:**
- Set up database schema
- Implement basic CRUD endpoints
- Define data models

**Deliverables:**
1. Database setup (Firebase/DynamoDB)
2. POST `/report` working
3. GET `/canteens/status` working
4. Basic validation & error handling

**Success Criteria:**
- Frontend can submit reports
- Dashboard fetches real data
- Data persists in database

---

### Phase 2: Aggregation Logic (Weeks 2-3)

**Goals:**
- Implement crowd calculation algorithm
- Add confidence scoring
- Integrate staleness logic

**Deliverables:**
1. `compute_crowd_status()` function
2. `apply_staleness_logic()` function
3. Status update every 30 seconds
4. Database queries optimized

**Success Criteria:**
- Report aggregation working
- Confidence scores displaying on dashboard
- "Unknown" status appears correctly

---

### Phase 3: Vision Pipeline (Weeks 3-4)

**Goals:**
- Implement image upload endpoint
- Integrate Vision API
- Create report from detection

**Deliverables:**
1. POST `/vision-report` working
2. Vision API integration (or mock)
3. Image storage in cloud
4. Automatic crowd detection

**Success Criteria:**
- Upload image → get crowd level
- Detection results stored as report
- Mock detection working (if real API not available)

---

### Phase 4: Analytics & Admin (Weeks 4-5)

**Goals:**
- Implement admin dashboard endpoints
- Add historical data analysis
- Create heatmaps

**Deliverables:**
1. GET `/admin/analytics` working
2. Time-range filtering
3. Peak hour analysis
4. Canteen ranking

**Success Criteria:**
- Admin can see trends
- Heatmap data available
- Forecasting logic sketched

---

## 🎯 Component Importance Breakdown

| Component | Level | Why? | Effort |
|---|---|---|---|
| **Core Data & API** | 🔴 CORE | System foundation | Medium |
| **Crowd Calculation** | 🔴 CORE | Business logic | Medium |
| **Rate Limiting** | 🔴 CORE | Prevent abuse | Low |
| **Staleness Logic** | 🔴 CORE | Data reliability | Low |
| **Redis Cache** | 🟠 VALUE-ADD | Scalability & performance | Medium |
| **Improved Analytics** | 🟠 VALUE-ADD | Professors love trends | High |
| **Vision Pipeline** | 🟠 VALUE-ADD | AI integration story | High |
| **Failure Handling** | 🟠 VALUE-ADD | Fault tolerance | Medium |
| **Trust/Reputation** | 🟡 GOOD-TO-HAVE | Data quality | High |
| **Admin Dashboard** | 🟡 GOOD-TO-HAVE | Nice UI | High |

**Minimum MVP:** All CORE components
**Impressive Submission:** CORE + VALUE-ADD
**Perfect Submission:** All three levels

---

## 📝 Development Checklist

### Database Layer
- [ ] Create Canteens table
- [ ] Create Reports table
- [ ] Set up indexes for performance
- [ ] Create migration scripts

### Caching Layer (VALUE-ADD)
- [ ] Set up Redis cluster
- [ ] Implement cache invalidation
- [ ] Cache computed status (2 min TTL)
- [ ] Cache analytics responses (5 min TTL)

### API Layer (CORE)
- [ ] POST `/report` endpoint
- [ ] GET `/canteens/status` endpoint
- [ ] GET `/canteens/{id}` endpoint
- [ ] POST `/vision-report` endpoint
- [ ] GET `/admin/analytics` endpoint (with peak hours & trends)
- [ ] Add request validation
- [ ] Add error handling
- [ ] Add rate limiting (3 reports/user/5min) **CORE**

### Trust System (GOOD-TO-HAVE)
- [ ] Create UserReputation table
- [ ] Implement reputation calculation
- [ ] Weight reports by reputation
- [ ] Track spam reports

### Failure Handling (VALUE-ADD)
- [ ] Vision API fallback to manual
- [ ] Database fallback to cache
- [ ] Implement retry logic with exponential backoff
- [ ] Add comprehensive error logging

### Logic Layer
- [ ] `compute_crowd_status()` function
- [ ] `apply_staleness_logic()` function
- [ ] Crowd mapping algorithm
- [ ] Confidence calculation
- [ ] Report aggregation service

### Vision Layer
- [ ] Cloud storage setup
- [ ] Vision API integration (or mock)
- [ ] Image upload handler
- [ ] Detection-to-report workflow
- [ ] Error handling for failed detections

### Testing
- [ ] Unit tests for logic functions
- [ ] API endpoint tests
- [ ] Integration tests
- [ ] Load testing for scalability

### Deployment
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Environment configuration
- [ ] CI/CD pipeline
- [ ] Monitoring & logging

---

## 🎓 Academic Angle (What Professors Want)

### Key Selling Points

1. **Clear Architecture**
   - Document your 4 layers clearly
   - Show data flow diagrams
   - Explain why each layer exists

2. **Logical Pipeline**
   - Report → Aggregation → Status → Dashboard
   - Show the flow at each step
   - Explain decision-making logic

3. **Cloud Justification**
   - Explain serverless benefits
   - Show scalability during peak hours
   - Demonstrate cost efficiency

4. **XaaS Explanation**
   - Consumer service (students avoid queues)
   - Provider service (NTU gets analytics)
   - Dual value proposition

5. **Working Demo**
   - Functional backend + frontend
   - Real data flowing through system
   - Vision pipeline working (even if mocked)

---

## ⭐ Trust & Reputation System (GOOD-TO-HAVE)

**Why?** Weights reports from reliable users higher than spammers.

### Reputation Score Model

```python
UserReputation {
    user_id: string
    reputation_score: float (0.0 - 1.0)
    total_reports: int
    accurate_reports: int  # Matches consensus
    spam_reports: int
}
```

### Scoring Logic

```python
def calculate_reputation(user_id):
    user = get_user(user_id)
    
    if user.total_reports < 5:
        return 0.5  # New users = neutral
    
    accuracy = user.accurate_reports / user.total_reports
    
    # Penalize spam
    if user.spam_reports > 0:
        penalty = user.spam_reports * 0.1
    else:
        penalty = 0
    
    reputation = accuracy - penalty
    return max(0.0, min(reputation, 1.0))  # Clamp 0-1
```

### Using Reputation in Crowd Calculation

```python
def compute_crowd_status_with_reputation(canteen_id):
    reports = get_recent_reports(canteen_id)
    
    # Weight by user reputation
    weighted_levels = []
    for r in reports:
        reputation = get_reputation(r.user_id)
        weighted_level = decode_level(r.crowd_level) * reputation
        weighted_levels.append(weighted_level)
    
    avg_level = sum(weighted_levels) / len(weighted_levels)
    final_status = encode_level(avg_level)
    
    return final_status
```

---

## 📊 Improved Analytics Layer (VALUE-ADD)

### Peak Hour Detection

**Identify when canteens are busiest**

```python
def detect_peak_hours(canteen_id, days=7):
    # Group reports by hour
    hourly_counts = {}
    
    for hour in range(24):
        reports = Report.filter(
            canteen_id == canteen_id,
            extract_hour(timestamp) == hour,
            timestamp >= now - timedelta(days=days)
        )
        hourly_counts[hour] = len(reports)
    
    # Find peak
    peak_hour = max(hourly_counts, key=hourly_counts.get)
    peak_count = hourly_counts[peak_hour]
    
    return {
        "peak_hour": peak_hour,  # e.g., 12
        "peak_count": peak_count,
        "hourly_distribution": hourly_counts
    }
```

### Trend Detection

**Compare current vs historical crowd levels**

```python
def detect_trends(canteen_id):
    # Current hour status
    current_hour = get_current_hour()
    current_reports = Report.filter(
        canteen_id == canteen_id,
        timestamp >= now - timedelta(hours=1)
    )
    current_avg = average_crowd_level(current_reports)
    
    # Historical average for this hour (past 4 weeks)
    historical_reports = Report.filter(
        canteen_id == canteen_id,
        extract_hour(timestamp) == current_hour,
        timestamp >= now - timedelta(weeks=4)
    )
    historical_avg = average_crowd_level(historical_reports)
    
    # Compute delta
    delta = current_avg - historical_avg
    
    if delta > 0.5:
        trend = "BUSIER_THAN_USUAL"
    elif delta < -0.5:
        trend = "QUIETER_THAN_USUAL"
    else:
        trend = "NORMAL"
    
    return {
        "current_level": current_avg,
        "historical_avg": historical_avg,
        "trend": trend,
        "delta": delta
    }
```

### Enhanced Analytics Response

```python
@app.get("/api/v1/admin/analytics")
def get_analytics(time_range="hour", canteen_id=None):
    
    if canteen_id:
        canteens = [canteen_id]
    else:
        canteens = get_all_canteen_ids()
    
    analytics = []
    
    for cid in canteens:
        peak_data = detect_peak_hours(cid)
        trend_data = detect_trends(cid)
        
        analytics.append({
            "canteen_id": cid,
            "name": get_canteen_name(cid),
            "current_status": get_canteen_status(cid),
            "peak_hours": peak_data,
            "trends": trend_data,
            "recommendations": generate_recommendations(trend_data)
        })
    
    return {
        "time_range": time_range,
        "generated_at": datetime.now().isoformat(),
        "analytics": analytics
    }
```

### Example Output

```json
{
  "analytics": [
    {
      "canteen_id": 1,
      "name": "North Spine Food Court",
      "current_status": "High",
      "peak_hours": {
        "peak_hour": 12,
        "peak_count": 127,
        "hourly_distribution": {"11": 89, "12": 127, "13": 95}
      },
      "trends": {
        "current_level": 2.8,
        "historical_avg": 2.2,
        "trend": "BUSIER_THAN_USUAL",
        "delta": 0.6
      },
      "recommendations": "North Spine overcrowded 12–1pm. Consider opening extra stalls."
    }
  ]
}
```

---

## 🚨 Failure Handling & Fault Tolerance (VALUE-ADD)

### Vision API Failure Strategy

```python
def handle_vision_submission(image_file, canteen_id, user_id):
    try:
        # Try Vision API first
        people_count = call_vision_api(image_file)
        crowd_level = map_people_count_to_level(people_count)
        
        # Create report
        report = create_report(
            canteen_id=canteen_id,
            crowd_level=crowd_level,
            source="vision-ai",
            image_url=store_image(image_file)
        )
        
        return {
            "status": "success",
            "detected_crowd_level": crowd_level,
            "report_id": report.id
        }
    
    except VisionAPIError as e:
        # Fallback: ask user for manual input
        log_error(f"Vision API failed: {e}")
        
        return {
            "status": "vision_failed",
            "message": "Image analysis failed. Please submit crowd level manually.",
            "image_stored": True,
            "fallback_required": True
        }
    
    except Exception as e:
        log_critical_error(f"Unexpected error: {e}")
        return {
            "status": "error",
            "message": "Submission failed. Please try again.",
            "code": 500
        }
```

### Database Unavailable Strategy

```python
def get_canteen_status_with_fallback(canteen_id):
    try:
        # Try fresh data
        status = compute_crowd_status(canteen_id)
        return {"status": status, "source": "live"}
    
    except DatabaseError as e:
        log_error(f"Database error: {e}")
        
        # Fallback to cache
        cached_status = redis.get(f"canteen_status:{canteen_id}")
        if cached_status:
            return {
                "status": json.loads(cached_status),
                "source": "cached",
                "warning": "Showing cached data. Live data unavailable."
            }
        
        # Last resort: return Unknown
        return {
            "status": "Unknown",
            "source": "unavailable",
            "message": "Service temporarily unavailable."
        }
```

### Error Retry Strategy

```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10)
)
def call_vision_api_with_retry(image_file):
    return call_vision_api(image_file)

# Retries with exponential backoff:
# Attempt 1: immediate
# Attempt 2: wait 2-4 seconds
# Attempt 3: wait 4-10 seconds
```

---

## 🔄 Monitoring & Metrics

### Key Metrics to Track

```python
metrics = {
    "total_reports": count_all_reports(),
    "active_users": count_unique_users_hourly(),
    "avg_confidence": average_confidence_score(),
    "unknown_canteens": count_unknown_status(),
    "peak_hours": identify_peak_hours(),
    "api_latency": measure_response_time(),
    "vision_accuracy": track_detection_accuracy()
}
```

### Logging Strategy
- Log all report submissions
- Log status calculations
- Log Vision API calls
- Log errors with full context

---

## 📊 Project Timeline

| Phase | Duration | Key Milestone |
|---|---|---|
| **Phase 1: Core Data & API** | 2 weeks | Dashboard can fetch real data |
| **Phase 2: Aggregation & Logic** | 1 week | Status computed dynamically |
| **Phase 3: Vision Pipeline** | 1 week | Image upload working |
| **Phase 4: Analytics** | 1 week | Admin insights available |
| **Buffer** | 1 week | Testing & refinement |
| **Total** | ~6 weeks | Production ready |

---

## 🎯 Success Criteria (Final)

Your backend is "done" when:

✅ POST `/report` stores data correctly
✅ GET `/canteens/status` returns aggregated data
✅ Confidence scores calculated properly
✅ Staleness logic applied (Unknown status shows)
✅ Vision pipeline uploads & detects crowds
✅ Admin analytics show trends
✅ Frontend dashboard displays all data
✅ System handles concurrent requests
✅ Error handling is robust
✅ Code is documented

---

## 💡 Pro Tips

1. **Start with dummy data** - Don't wait for perfect database setup
2. **Build frontend + backend simultaneously** - Iterate together
3. **Mock Vision API first** - Real integration can come later
4. **Test with real data** - Submit actual reports, verify aggregation
5. **Document as you go** - Don't leave documentation for the end
6. **Show the logic working** - A demo is worth 1000 lines of documentation

---

**Last Updated:** 2026-04-03
**Status:** Ready for development
