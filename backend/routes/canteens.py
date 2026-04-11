"""
Canteen status and information endpoints
"""
from fastapi import APIRouter, HTTPException
from google.cloud import firestore
import datetime # Use native datetime for all math
from models import CrowdStatus, AllCanteenStatus
from database import get_db

router = APIRouter(prefix="/api/v1")

def encode_level(level: str) -> int:
    mapping = {"Low": 1, "Medium": 2, "High": 3}
    return mapping.get(level, 0)

def decode_level(numeric_value: float) -> str:
    if numeric_value < 1.5: return "Low"
    elif numeric_value < 2.5: return "Medium"
    else: return "High"

def apply_staleness_logic(last_report_time, status: str) -> str:
    """If last report is older than 15 minutes, mark as Unknown"""
    if last_report_time is None:
        return "Unknown"
    
    # Use timezone-aware UTC now for comparison
    now = datetime.datetime.now(datetime.timezone.utc)
    
    # Ensure last_report_time is also timezone aware
    if last_report_time.tzinfo is None:
        last_report_time = last_report_time.replace(tzinfo=datetime.timezone.utc)
        
    time_diff = now - last_report_time
    
    if time_diff > datetime.timedelta(minutes=15):
        return "Unknown"
    
    return status

def compute_crowd_status(canteen_id: str, db) -> dict:
    """Compute crowd status by averaging reports from last 10 minutes"""
    try:
        # FIX: Use native datetime cutoff instead of firestore.Timestamp
        now = datetime.datetime.now(datetime.timezone.utc)
        ten_min_ago = now - datetime.timedelta(minutes=10)
        
        reports_ref = db.collection("reports")
        query = (reports_ref
                .where("canteen_id", "==", canteen_id)
                .where("timestamp", ">=", ten_min_ago)
                .order_by("timestamp", direction=firestore.Query.DESCENDING)
                .limit(20))
        
        report_list = list(query.stream())
        
        if not report_list:
            return {"status": "Unknown", "confidence": 0.0, "last_updated": None, "report_count": 0}
        
        # Aggregate levels
        encoded_values = [encode_level(doc.get("crowd_level")) for doc in report_list]
        avg_value = sum(encoded_values) / len(encoded_values)
        
        # Confidence calculation
        confidence = min(len(report_list) / 6.0, 1.0)
        
        # Get last report timestamp
        last_timestamp = report_list[0].get("timestamp")
        
        # Apply staleness logic and return
        final_status = apply_staleness_logic(last_timestamp, decode_level(avg_value))
        
        return {
            "status": final_status,
            "confidence": round(confidence, 2),
            "last_updated": last_timestamp.isoformat() if last_timestamp else None,
            "report_count": len(report_list)
        }
        
    except Exception as e:
        print(f"❌ Error computing for canteen {canteen_id}: {e}")
        return {"status": "Unknown", "confidence": 0.0, "last_updated": None, "report_count": 0}

@router.get("/canteens/status", response_model=AllCanteenStatus)
async def get_all_canteens_status():
    """Get crowd status for all 14 canteens"""
    try:
        db = get_db()
        canteen_list = list(db.collection("canteens").stream())
        
        if not canteen_list:
            raise HTTPException(status_code=404, detail="No canteens found")
        
        statuses = []
        for canteen in canteen_list:
            cid = canteen.id
            cdata = canteen.to_dict()
            crowd = compute_crowd_status(cid, db)
            
            # Populate model allowing for null coordinates
            statuses.append(CrowdStatus(
                canteen_id=cid,
                name=cdata.get("name", "Unknown"),
                location=cdata.get("location", "Unknown"),
                lat=cdata.get("lat"),
                lng=cdata.get("lng"),
                current_status=crowd["status"],
                confidence=crowd["confidence"],
                last_updated=crowd["last_updated"] or "Never",
                report_count=crowd["report_count"]
            ))
        
        return AllCanteenStatus(
            status="success",
            message=f"Retrieved {len(statuses)} canteens",
            data=statuses,
            timestamp=datetime.datetime.now().isoformat()
        )
    except Exception as e:
        print(f"❌ Fetch Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/canteens/{canteen_id}", response_model=CrowdStatus)
async def get_canteen_details(canteen_id: str):
    db = get_db()
    canteen = db.collection("canteens").document(canteen_id).get()
    if not canteen.exists:
        raise HTTPException(status_code=404, detail="Not found")
    
    cdata = canteen.to_dict()
    crowd = compute_crowd_status(canteen_id, db)
    return CrowdStatus(
        canteen_id=canteen_id,
        name=cdata.get("name", "Unknown"),
        location=cdata.get("location", "Unknown"),
        lat=cdata.get("lat"),
        lng=cdata.get("lng"),
        current_status=crowd["status"],
        confidence=crowd["confidence"],
        last_updated=crowd["last_updated"] or "Never",
        report_count=crowd["report_count"]
    )