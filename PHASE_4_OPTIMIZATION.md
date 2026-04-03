# Phase 4: Optimization & Reliability

**Duration:** 1 week  
**Goal:** Add Redis caching + failure handling  
**Priority Level:** 🟠 VALUE-ADD - Production readiness

---

## 📋 Phase Overview

In Phase 4, you'll improve **performance and reliability**:

- ✅ Implement Redis caching
- ✅ Add failure handling & fallbacks
- ✅ Improve error recovery
- ✅ Add comprehensive logging
- ✅ Performance optimization

**By end of Phase 4:** System is resilient, fast, and handles failures gracefully

---

## 🎯 Objectives

1. **Redis Caching**
   - Cache computed status (2 min TTL)
   - Cache analytics results (5 min TTL)
   - Reduce database queries
   - Improve response time

2. **Failure Handling**
   - Vision API fallback
   - Database fallback to cache
   - Retry logic with exponential backoff
   - Graceful error messages

3. **Monitoring**
   - Comprehensive logging
   - Error tracking
   - Performance metrics

---

## 📝 Detailed Tasks

### Checkpoint 4.1: Redis Setup (Days 1-2)

#### Task 4.1.1: Add Redis to Stack
**Status:** ⬜ Not Started

**Update:** `requirements.txt`
```
redis==5.0.0
```

**Install:**
```bash
pip install redis
```

**Create:** `backend/services/cache.py`

```python
import redis
import json
import os
from typing import Optional

redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST", "localhost"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    decode_responses=True
)

class CacheService:
    """Simple Redis cache wrapper."""
    
    STATUS_TTL = 120  # 2 minutes
    ANALYTICS_TTL = 300  # 5 minutes
    
    @staticmethod
    def get_status(canteen_id: str) -> Optional[dict]:
        """Get cached canteen status."""
        key = f"status:{canteen_id}"
        cached = redis_client.get(key)
        return json.loads(cached) if cached else None
    
    @staticmethod
    def set_status(canteen_id: str, status: dict):
        """Cache canteen status."""
        key = f"status:{canteen_id}"
        redis_client.setex(key, CacheService.STATUS_TTL, json.dumps(status))
    
    @staticmethod
    def invalidate_status(canteen_id: str):
        """Invalidate cache when new report arrives."""
        key = f"status:{canteen_id}"
        redis_client.delete(key)
    
    @staticmethod
    def get_analytics(time_range: str) -> Optional[dict]:
        """Get cached analytics."""
        key = f"analytics:{time_range}"
        cached = redis_client.get(key)
        return json.loads(cached) if cached else None
    
    @staticmethod
    def set_analytics(time_range: str, data: dict):
        """Cache analytics."""
        key = f"analytics:{time_range}"
        redis_client.setex(key, CacheService.ANALYTICS_TTL, json.dumps(data))
    
    @staticmethod
    def invalidate_all():
        """Clear all cache."""
        redis_client.flushdb()
    
    @staticmethod
    def health_check() -> bool:
        """Check if Redis is healthy."""
        try:
            redis_client.ping()
            return True
        except Exception as e:
            print(f"Redis health check failed: {e}")
            return False
```

**Store credentials in .env:**
```
REDIS_HOST=localhost
REDIS_PORT=6379
```

**Verification:**
- [ ] Redis connection works
- [ ] Can set and get values
- [ ] Cache TTL working

---

#### Task 4.1.2: Integrate Caching into Endpoints
**Status:** ⬜ Not Started

**Update:** `backend/routes/canteens.py`

```python
from services.cache import CacheService

@router.get("/canteens/status")
def get_canteen_status():
    """Get canteen status with caching."""
    
    try:
        # Try cache first
        canteens = db.collection("canteens").stream()
        result = []
        
        for canteen_doc in canteens:
            canteen_id = canteen_doc.id
            
            # Check cache
            cached = CacheService.get_status(canteen_id)
            if cached:
                result.append(cached)
                continue
            
            # Cache miss: compute
            canteen = canteen_doc.to_dict()
            status = compute_crowd_status(db, canteen_id)
            status = apply_staleness_logic(status)
            
            status_info = {
                "canteen_id": canteen_id,
                "name": canteen.get("name"),
                "current_status": status.get("status"),
                "confidence": status.get("confidence"),
                "last_updated": status.get("last_updated"),
                "report_count": status.get("report_count")
            }
            
            # Store in cache
            CacheService.set_status(canteen_id, status_info)
            result.append(status_info)
        
        return {
            "data": result,
            "timestamp": datetime.now().isoformat() + "Z",
            "source": "computed"
        }
    
    except Exception as e:
        logger.error(f"Error getting canteen status: {e}")
        # Fallback: return cached data if available
        # or error response
        raise HTTPException(status_code=500, detail="Service unavailable")
```

**Update:** `backend/routes/reports.py` - Invalidate cache on new report

```python
@router.post("/report", status_code=201)
def submit_report(request: ReportRequest):
    # ... existing code ...
    
    # New: invalidate cache
    CacheService.invalidate_status(request.canteen_id)
    
    return {...}
```

**Verification:**
- [ ] First request hits database
- [ ] Second request hits cache
- [ ] Cache invalidates on new report
- [ ] Response time significantly faster

---

### Checkpoint 4.2: Failure Handling (Days 3-4)

#### Task 4.2.1: Vision API Fallback
**Status:** ⬜ Not Started

**Update:** `backend/routes/vision.py`

```python
from services.cache import CacheService
import logging

logger = logging.getLogger(__name__)

@router.post("/vision-report", status_code=201)
async def submit_vision_report(
    image: UploadFile = File(...),
    canteen_id: str = Form(...)
):
    """Handle vision report with fallback strategy."""
    
    # Validate canteen
    canteen = db.collection("canteens").document(canteen_id).get()
    if not canteen.exists:
        raise HTTPException(status_code=404, detail="Canteen not found")
    
    file_id = str(uuid.uuid4())
    filename = f"canteen_{canteen_id}_{file_id}.jpg"
    
    try:
        # Upload image
        image_data = await image.read()
        blob = bucket.blob(f"vision-reports/{filename}")
        blob.upload_from_string(image_data, content_type=image.content_type)
        
        # Try vision detection
        try:
            people_count, confidence = await run_vision_detection(image_data)
            crowd_level = map_people_count_to_level(people_count)
            
            logger.info(f"Vision detection: {people_count} people → {crowd_level}")
        
        except Exception as vision_error:
            # Fallback: ask user to submit manually
            logger.warning(f"Vision detection failed: {vision_error}")
            
            return {
                "status": "vision_failed",
                "message": "Image analysis failed. Please submit crowd level manually.",
                "image_stored": True,
                "fallback_required": True,
                "image_name": filename
            }
        
        # Create report
        report_data = {
            "canteen_id": canteen_id,
            "crowd_level": crowd_level,
            "source": "vision-ai",
            "image_url": f"gs://bucket/vision-reports/{filename}",
            "timestamp": firestore.SERVER_TIMESTAMP,
            "vision_metadata": {
                "people_count": people_count,
                "detection_confidence": confidence
            }
        }
        
        doc_ref = db.collection("reports").document()
        doc_ref.set(report_data)
        
        # Invalidate cache
        CacheService.invalidate_status(canteen_id)
        
        return {
            "status": "success",
            "message": "Image analyzed successfully",
            "detected_crowd_level": crowd_level,
            "people_count": people_count,
            "confidence": confidence,
            "report_id": doc_ref.id
        }
    
    except Exception as e:
        logger.error(f"Vision submission error: {e}")
        raise HTTPException(status_code=500, detail="Submission failed")
```

**Verification:**
- [ ] Vision failure handled gracefully
- [ ] Fallback message shown to user
- [ ] Image still stored even if analysis fails

---

#### Task 4.2.2: Database Fallback to Cache
**Status:** ⬜ Not Started

**Update:** `backend/routes/canteens.py`

```python
def get_canteen_status_with_fallback():
    """Get status with fallback to cache if DB unavailable."""
    
    try:
        return get_canteen_status()  # Normal flow
    
    except Exception as db_error:
        logger.error(f"Database error: {db_error}")
        
        # Try to return cached data
        canteens_list = []
        canteens = ["1", "2", "3", "4", "5", "6", "7", "8"]  # Hard-coded IDs
        
        has_any_cache = False
        for canteen_id in canteens:
            cached = CacheService.get_status(canteen_id)
            if cached:
                cached["_source"] = "cache"
                canteens_list.append(cached)
                has_any_cache = True
        
        if has_any_cache:
            return {
                "data": canteens_list,
                "timestamp": datetime.now().isoformat() + "Z",
                "warning": "Showing cached data. Live data unavailable.",
                "source": "cache"
            }
        
        # No cache available
        raise HTTPException(
            status_code=503,
            detail="Service temporarily unavailable. Try again soon."
        )
```

**Verification:**
- [ ] DB failure triggers fallback
- [ ] Cached data returned with warning
- [ ] User gets helpful message

---

#### Task 4.2.3: Retry Logic with Exponential Backoff
**Status:** ⬜ Not Started

**Create:** `backend/services/retry.py`

```python
import asyncio
import logging

logger = logging.getLogger(__name__)

async def retry_with_backoff(
    func,
    max_attempts=3,
    base_delay=1,
    max_delay=10,
    *args,
    **kwargs
):
    """Retry function with exponential backoff."""
    
    for attempt in range(max_attempts):
        try:
            return await func(*args, **kwargs) if asyncio.iscoroutinefunction(func) else func(*args, **kwargs)
        
        except Exception as e:
            if attempt == max_attempts - 1:
                logger.error(f"Failed after {max_attempts} attempts: {e}")
                raise
            
            delay = min(base_delay * (2 ** attempt), max_delay)
            logger.warning(f"Attempt {attempt + 1} failed. Retrying in {delay}s...")
            
            await asyncio.sleep(delay)
    
    raise Exception("All retry attempts exhausted")
```

**Update vision detection call:**

```python
async def submit_vision_report(...):
    ...
    # Retry vision detection 3 times
    people_count, confidence = await retry_with_backoff(
        run_vision_detection,
        max_attempts=3,
        base_delay=1,
        image_data
    )
    ...
```

**Verification:**
- [ ] Retries on failure
- [ ] Exponential backoff working
- [ ] Max attempts respected

---

### Checkpoint 4.3: Comprehensive Logging (Day 5)

#### Task 4.3.1: Setup Logging
**Status:** ⬜ Not Started

**Create:** `backend/config/logging.py`

```python
import logging
import logging.handlers
import os

def setup_logging():
    """Configure logging with file + console output."""
    
    # Create logs directory
    os.makedirs("logs", exist_ok=True)
    
    # Root logger
    logger = logging.getLogger()
    logger.setLevel(logging.DEBUG)
    
    # File handler
    file_handler = logging.handlers.RotatingFileHandler(
        "logs/app.log",
        maxBytes=10485760,  # 10MB
        backupCount=5
    )
    file_handler.setLevel(logging.DEBUG)
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    
    # Formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)
    
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    return logger

# In main.py
logger = setup_logging()
```

**Verification:**
- [ ] Logs written to file
- [ ] Console shows important events
- [ ] Log levels working

---

## ✅ Phase 4 Success Criteria

- [ ] Redis cache implemented
- [ ] Cache improves response time
- [ ] Vision API has fallback
- [ ] Database fallback working
- [ ] Retry logic implemented
- [ ] Comprehensive logging in place
- [ ] Error messages helpful
- [ ] System resilient to failures
- [ ] No unhandled exceptions

---

## 📊 Performance Improvements

| Metric | Before | After |
|---|---|---|
| GET /canteens/status (cold) | ~500ms | ~500ms |
| GET /canteens/status (cached) | N/A | ~50ms |
| Vision API failure | Error | Fallback |
| Database error | Crash | Cached data |

---

## ⏭️ Next Phase

When Phase 4 complete, proceed to **Phase 5: Deployment & Production**

---

**Phase 4 Status:** 🔴 Not Started  
**Last Updated:** 2026-04-03
