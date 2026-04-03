# Phase 2: Aggregation Logic & Rate Limiting

**Duration:** 1 week  
**Goal:** Implement crowd calculation algorithm + prevent abuse  
**Priority Level:** 🔴 CRITICAL - Core business logic

---

## 📋 Phase Overview

In Phase 2, you'll build the **brain** of your system:

- ✅ Implement crowd calculation algorithm
- ✅ Add confidence scoring
- ✅ Implement staleness logic
- ✅ Add rate limiting (3 reports/user/5 min)
- ✅ Dashboard shows dynamic crowd levels

**By end of Phase 2:** Multiple reports → aggregated into single status with confidence score

---

## 🎯 Objectives

1. **Crowd Calculation Logic**
   - Average multiple recent reports (10-minute window)
   - Convert Low/Medium/High → numeric (1/2/3)
   - Average and convert back
   - Example: [High, Medium, High] → avg 2.66 → High

2. **Confidence Scoring**
   - Formula: `confidence = min(num_reports / expected_reports, 1.0)`
   - Expected: 5 reports per 10 minutes
   - Shows data reliability

3. **Staleness Logic**
   - If no reports > 15 minutes → Status = "Unknown"
   - Shows when data is too old

4. **Rate Limiting**
   - Max 3 reports per user per 5 minutes
   - Uses Redis (or in-memory for Phase 2)
   - Return 429 status code

---

## 📝 Detailed Tasks & Checkpoints

### Checkpoint 2.1: Crowd Calculation Algorithm (Days 1-2)

#### Task 2.1.1: Implement Core Logic Functions
**Status:** ⬜ Not Started

**File:** `backend/logic/crowd_calculation.py`

```python
from datetime import datetime, timedelta
from typing import List, Dict, Optional

# Constants
TIME_WINDOW_MINUTES = 10
EXPECTED_REPORTS_PER_WINDOW = 5
STALENESS_THRESHOLD_MINUTES = 15

def encode_level(crowd_level: str) -> int:
    """Convert string level to numeric."""
    mapping = {"Low": 1, "Medium": 2, "High": 3}
    return mapping.get(crowd_level, 0)

def decode_level(numeric_level: float) -> str:
    """Convert numeric level back to string."""
    if numeric_level >= 2.5:
        return "High"
    elif numeric_level >= 1.5:
        return "Medium"
    else:
        return "Low"

def get_recent_reports(db, canteen_id: str, minutes: int = TIME_WINDOW_MINUTES) -> List[Dict]:
    """Get reports from last N minutes for a canteen."""
    now = datetime.now()
    cutoff = now - timedelta(minutes=minutes)
    
    reports = db.collection("reports").where(
        "canteen_id", "==", canteen_id
    ).where(
        "timestamp", ">=", cutoff
    ).stream()
    
    return [doc.to_dict() for doc in reports]

def compute_crowd_status(db, canteen_id: str) -> Dict:
    """
    Compute crowd status for a canteen.
    
    Returns:
        {
            "status": "High" | "Medium" | "Low" | "Unknown",
            "confidence": 0.0-1.0,
            "report_count": int,
            "last_updated": timestamp
        }
    """
    reports = get_recent_reports(db, canteen_id)
    
    if not reports:
        return {
            "status": "Unknown",
            "confidence": 0.0,
            "report_count": 0,
            "last_updated": None,
            "reason": "No recent reports"
        }
    
    # Convert to numeric
    levels = [encode_level(r.get("crowd_level", "Low")) for r in reports]
    
    # Calculate average
    avg_level = sum(levels) / len(levels)
    
    # Convert back to string
    final_status = decode_level(avg_level)
    
    # Calculate confidence
    confidence = min(len(reports) / EXPECTED_REPORTS_PER_WINDOW, 1.0)
    
    # Get last update time
    timestamps = [r.get("timestamp") for r in reports if r.get("timestamp")]
    last_updated = max(timestamps) if timestamps else None
    
    return {
        "status": final_status,
        "confidence": round(confidence, 2),
        "report_count": len(reports),
        "last_updated": last_updated.isoformat() + "Z" if last_updated else None
    }

def apply_staleness_logic(status_info: Dict) -> Dict:
    """
    Apply staleness logic. If no data > 15 min, mark as Unknown.
    """
    last_update = status_info.get("last_updated")
    
    if not last_update:
        return status_info
    
    # Parse timestamp
    from datetime import datetime as dt
    last_time = dt.fromisoformat(last_update.replace("Z", "+00:00"))
    age_minutes = (dt.now(last_time.tzinfo) - last_time).total_seconds() / 60
    
    if age_minutes > STALENESS_THRESHOLD_MINUTES:
        return {
            "status": "Unknown",
            "confidence": 0.0,
            "report_count": status_info["report_count"],
            "last_updated": status_info["last_updated"],
            "reason": f"No data for {age_minutes:.0f} minutes"
        }
    
    return status_info
```

**Testing:**
```python
# tests/test_crowd_calculation.py
from logic.crowd_calculation import encode_level, decode_level, compute_crowd_status

def test_encode_decode():
    assert encode_level("Low") == 1
    assert encode_level("Medium") == 2
    assert encode_level("High") == 3
    
    assert decode_level(1.0) == "Low"
    assert decode_level(2.0) == "Medium"
    assert decode_level(3.0) == "High"
    assert decode_level(2.5) == "High"  # Rounds up

def test_crowd_calculation():
    # Mock database with sample reports
    # Expected: [High, Medium, High] → 2.66 → High, confidence 0.6
    pass
```

**Verification:**
- [ ] `encode_level()` converts correctly
- [ ] `decode_level()` converts correctly
- [ ] Average calculation correct (2.66 → High)
- [ ] Confidence calculation correct (3/5 = 0.6)

**Deliverable:**
```
✅ Crowd calculation logic implemented
✅ Unit tests passing
✅ Edge cases handled
```

---

### Checkpoint 2.2: Rate Limiting (Days 3-4)

#### Task 2.2.1: Implement Rate Limiting Service
**Status:** ⬜ Not Started

**For Phase 2, use simple in-memory solution (no Redis yet):**

**File:** `backend/services/rate_limiter.py`

```python
from datetime import datetime, timedelta
from collections import defaultdict
from threading import Lock

class SimpleRateLimiter:
    """In-memory rate limiter (Phase 2 only)."""
    
    def __init__(self, max_requests=3, window_minutes=5):
        self.max_requests = max_requests
        self.window_seconds = window_minutes * 60
        self.requests = defaultdict(list)  # user_id -> [timestamp, timestamp, ...]
        self.lock = Lock()
    
    def is_allowed(self, user_id: str) -> bool:
        """Check if user can make a request."""
        with self.lock:
            now = datetime.now()
            window_start = now - timedelta(seconds=self.window_seconds)
            
            # Clean old requests
            if user_id in self.requests:
                self.requests[user_id] = [
                    ts for ts in self.requests[user_id]
                    if ts >= window_start
                ]
            
            # Check if under limit
            if len(self.requests[user_id]) < self.max_requests:
                self.requests[user_id].append(now)
                return True
            
            return False
    
    def get_retry_after(self, user_id: str) -> int:
        """Get seconds until user can make next request."""
        with self.lock:
            if user_id not in self.requests or len(self.requests[user_id]) == 0:
                return 0
            
            oldest = self.requests[user_id][0]
            now = datetime.now()
            window_start = now - timedelta(seconds=self.window_seconds)
            
            retry_time = oldest + timedelta(seconds=self.window_seconds)
            seconds_until = max(0, (retry_time - now).total_seconds())
            
            return int(seconds_until)

# Global instance
rate_limiter = SimpleRateLimiter(max_requests=3, window_minutes=5)
```

**Verification:**
- [ ] First 3 requests allowed
- [ ] 4th request blocked
- [ ] `retry_after` shows correct wait time
- [ ] Cleanup of old requests works

**Deliverable:**
```
✅ Rate limiter implemented
✅ Works for single-server deployment
```

---

#### Task 2.2.2: Integrate Rate Limiting into POST `/report`
**Status:** ⬜ Not Started

**Update:** `backend/routes/reports.py`

```python
from fastapi import APIRouter, HTTPException
from services.rate_limiter import rate_limiter
from logic.crowd_calculation import compute_crowd_status, apply_staleness_logic

@router.post("/report", status_code=201)
def submit_report(request: ReportRequest):
    # Generate user_id (TODO: get from auth)
    user_id = request.user_id or "anonymous"
    
    # Check rate limit
    if not rate_limiter.is_allowed(user_id):
        retry_after = rate_limiter.get_retry_after(user_id)
        raise HTTPException(
            status_code=429,
            detail=f"Too many requests. Retry after {retry_after} seconds"
        )
    
    # Validate crowd_level
    valid_levels = ["Low", "Medium", "High"]
    if request.crowd_level not in valid_levels:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid crowd_level. Must be one of {valid_levels}"
        )
    
    # ... rest of report submission
```

**Testing:**
```bash
# Test rate limiting
for i in {1..5}; do
  curl -X POST http://localhost:8000/api/v1/report \
    -H "Content-Type: application/json" \
    -d '{"canteen_id":"1", "crowd_level":"High", "user_id":"test_user"}'
  echo "Request $i"
done

# Requests 1-3 should return 201
# Request 4-5 should return 429
```

**Verification:**
- [ ] First 3 requests return 201
- [ ] 4th request returns 429
- [ ] Response includes retry_after
- [ ] After 5 minutes, can submit again

**Deliverable:**
```
✅ Rate limiting integrated
✅ Returns correct error codes
✅ Retry-After header working
```

---

### Checkpoint 2.3: Update GET `/canteens/status` (Days 5-6)

#### Task 2.3.1: Use Aggregation Logic
**Status:** ⬜ Not Started

**Update:** `backend/routes/canteens.py`

```python
from logic.crowd_calculation import compute_crowd_status, apply_staleness_logic

@router.get("/canteens/status")
def get_canteen_status():
    canteens = db.collection("canteens").stream()
    result = []
    
    for canteen_doc in canteens:
        canteen = canteen_doc.to_dict()
        canteen_id = canteen_doc.id
        
        # Use new aggregation logic instead of just taking latest
        status = compute_crowd_status(db, canteen_id)
        status = apply_staleness_logic(status)
        
        # Build response
        status_info = {
            "canteen_id": canteen_id,
            "name": canteen.get("name", "Unknown"),
            "current_status": status.get("status"),
            "confidence": status.get("confidence"),
            "last_updated": status.get("last_updated"),
            "report_count": status.get("report_count")
        }
        
        result.append(status_info)
    
    return {
        "data": result,
        "timestamp": datetime.now().isoformat() + "Z"
    }
```

**Testing:**

1. Submit multiple reports for same canteen:
```bash
# Submit 5 reports for canteen 1
for i in {1..5}; do
  curl -X POST http://localhost:8000/api/v1/report \
    -H "Content-Type: application/json" \
    -d '{"canteen_id":"1", "crowd_level":"High"}'
done
```

2. Fetch status:
```bash
curl http://localhost:8000/api/v1/canteens/status | python -m json.tool
```

3. Expected output:
```json
{
  "canteen_id": "1",
  "name": "North Spine Food Court",
  "current_status": "High",
  "confidence": 1.0,  // 5 reports / 5 expected
  "report_count": 5,
  "last_updated": "..."
}
```

**Verification:**
- [ ] Confidence increases with more reports
- [ ] Status calculated from average
- [ ] Multiple reports aggregated correctly
- [ ] Confidence capped at 1.0

**Deliverable:**
```
✅ Aggregation logic integrated
✅ Confidence scores showing
✅ Dynamic status calculation working
```

---

### Checkpoint 2.4: Testing & Validation (Day 7)

#### Task 2.4.1: Comprehensive Test Suite
**Status:** ⬜ Not Started

**Create:** `tests/test_phase_2.py`

```python
import pytest
from datetime import datetime, timedelta
from logic.crowd_calculation import (
    encode_level, decode_level, compute_crowd_status, apply_staleness_logic
)
from services.rate_limiter import SimpleRateLimiter

class TestCrowdCalculation:
    
    def test_average_calculation(self):
        """Test: [High, Medium, High] → High (2.66)"""
        assert decode_level(2.66) == "High"
    
    def test_confidence_scoring(self):
        """Test: 3 reports / 5 expected = 0.6"""
        assert min(3 / 5, 1.0) == 0.6
    
    def test_staleness_logic(self):
        """Test: Old data marked as Unknown"""
        old_status = {
            "status": "High",
            "report_count": 3,
            "last_updated": (datetime.now() - timedelta(minutes=20)).isoformat() + "Z"
        }
        result = apply_staleness_logic(old_status)
        assert result["status"] == "Unknown"

class TestRateLimiter:
    
    def test_rate_limiting(self):
        limiter = SimpleRateLimiter(max_requests=3, window_minutes=5)
        
        # First 3 allowed
        assert limiter.is_allowed("user1") == True
        assert limiter.is_allowed("user1") == True
        assert limiter.is_allowed("user1") == True
        
        # 4th blocked
        assert limiter.is_allowed("user1") == False
    
    def test_different_users(self):
        """Test: Different users have separate limits"""
        limiter = SimpleRateLimiter(max_requests=3, window_minutes=5)
        
        # User 1: 3 requests
        for _ in range(3):
            assert limiter.is_allowed("user1") == True
        
        # User 2: can still request
        assert limiter.is_allowed("user2") == True
```

**Run tests:**
```bash
pytest tests/test_phase_2.py -v
```

**Verification:**
- [ ] All tests pass
- [ ] Coverage > 80%
- [ ] Edge cases handled

**Deliverable:**
```
✅ Test suite created
✅ All tests passing
✅ High coverage
```

---

## ✅ Phase 2 Success Criteria

- [ ] Crowd calculation algorithm working
- [ ] Confidence scores calculated correctly
- [ ] Staleness logic implemented
- [ ] Rate limiting working (3 reports/user/5min)
- [ ] GET `/canteens/status` returns aggregated data
- [ ] Dashboard shows dynamic confidence scores
- [ ] Error handling for rate limits (429)
- [ ] Unit tests passing
- [ ] E2E test with multiple reports

---

## 📊 Example: Before vs After Phase 2

### Before (Phase 1):
```
GET /canteens/status
→ [
    {
      "canteen_id": "1",
      "status": "High",  ← Just the latest report
      "confidence": 0.0
    }
  ]
```

### After (Phase 2):
```
(User submits: High, Medium, High, Medium, High)

GET /canteens/status
→ [
    {
      "canteen_id": "1",
      "status": "High",  ← Average of all 5
      "confidence": 1.0,  ← 5/5 reports
      "report_count": 5
    }
  ]
```

---

## ⏭️ Next Phase

When Phase 2 complete, proceed to **Phase 3: Vision Pipeline & Analytics**

In Phase 3, you'll add:
- Image upload endpoint
- Vision API integration (or mock)
- Improved analytics (peak hours, trends)

---

**Phase 2 Status:** 🔴 Not Started  
**Last Updated:** 2026-04-03
