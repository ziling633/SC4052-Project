"""
Canteen status and information endpoints
"""
from fastapi import APIRouter, HTTPException
from firebase_admin import firestore
from datetime import datetime, timedelta
from models import CrowdStatus, AllCanteenStatus
from database import get_db

router = APIRouter(prefix="/api/v1")


def encode_level(level: str) -> int:
    """Convert crowd level to numeric value"""
    mapping = {"Low": 1, "Medium": 2, "High": 3}
    return mapping.get(level, 0)


def decode_level(numeric_value: float) -> str:
    """Convert numeric value back to crowd level"""
    if numeric_value < 1.5:
        return "Low"
    elif numeric_value < 2.5:
        return "Medium"
    else:
        return "High"


def apply_staleness_logic(last_report_time, status: str) -> str:
    """
    If last report is older than 15 minutes, mark as Unknown
    """
    if last_report_time is None:
        return "Unknown"
    
    now = datetime.now()
    time_diff = now - last_report_time.replace(tzinfo=None)
    
    if time_diff > timedelta(minutes=15):
        return "Unknown"
    
    return status


def compute_crowd_status(canteen_id: str, db) -> dict:
    """
    Compute crowd status for a canteen by averaging recent reports
    Algorithm:
    1. Get all reports from last 10 minutes
    2. Encode each level to numeric (Low=1, Medium=2, High=3)
    3. Calculate average
    4. Decode back to level
    5. Calculate confidence (reports / expected_reports)
    6. Apply staleness logic
    """
    try:
        # Get reports from last 10 minutes
        ten_min_ago = firestore.Timestamp.from_datetime(datetime.utcnow() - timedelta(minutes=10))
        
        reports_ref = db.collection("reports")
        query = (reports_ref
                .where("canteen_id", "==", canteen_id)
                .where("timestamp", ">=", ten_min_ago)
                .order_by("timestamp", direction=firestore.Query.DESCENDING)
                .limit(20))  # Limit to recent reports
        
        reports = query.stream()
        report_list = list(reports)
        
        if not report_list:
            return {
                "status": "Unknown",
                "confidence": 0.0,
                "last_updated": None,
                "report_count": 0
            }
        
        # Encode and average
        encoded_values = [encode_level(report.get("crowd_level")) for report in report_list]
        avg_value = sum(encoded_values) / len(encoded_values)
        decoded_status = decode_level(avg_value)
        
        # Calculate confidence (max 1.0, expect ~6 reports per 10 min in busy time)
        confidence = min(len(report_list) / 6.0, 1.0)
        
        # Get last report timestamp
        last_report = report_list[0]
        last_timestamp = last_report.get("timestamp")
        
        # Apply staleness logic
        final_status = apply_staleness_logic(last_timestamp, decoded_status)
        
        return {
            "status": final_status,
            "confidence": round(confidence, 2),
            "last_updated": last_timestamp.isoformat() if last_timestamp else None,
            "report_count": len(report_list)
        }
        
    except Exception as e:
        print(f"❌ Error computing crowd status for canteen {canteen_id}: {e}")
        return {
            "status": "Unknown",
            "confidence": 0.0,
            "last_updated": None,
            "report_count": 0
        }


@router.get("/canteens/status", response_model=AllCanteenStatus)
async def get_all_canteens_status():
    """
    Get crowd status for all canteens
    Returns current crowd level, confidence, and last update time for each canteen
    """
    try:
        db = get_db()
        
        # Get all canteens
        canteens = db.collection("canteens").stream()
        canteen_list = list(canteens)
        
        if not canteen_list:
            raise HTTPException(
                status_code=404,
                detail="No canteens found in database"
            )
        
        # Compute status for each canteen
        statuses = []
        for canteen in canteen_list:
            canteen_data = canteen.to_dict()
            canteen_id = canteen.id
            
            # Get crowd status
            crowd_data = compute_crowd_status(canteen_id, db)
            
            status = CrowdStatus(
                canteen_id=canteen_id,
                name=canteen_data.get("name", "Unknown"),
                location=canteen_data.get("location", "Unknown"),
                lat=canteen_data.get("lat", 0.0),
                lng=canteen_data.get("lng", 0.0),
                current_status=crowd_data["status"],
                confidence=crowd_data["confidence"],
                last_updated=crowd_data["last_updated"] or "Never",
                report_count=crowd_data["report_count"]
            )
            statuses.append(status)
        
        return AllCanteenStatus(
            status="success",
            message=f"Retrieved status for {len(statuses)} canteens",
            data=statuses,
            timestamp=datetime.now().isoformat() + "Z"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching canteen statuses: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/canteens/{canteen_id}", response_model=CrowdStatus)
async def get_canteen_details(canteen_id: str):
    """
    Get detailed status for a single canteen
    
    - **canteen_id**: ID of the canteen (1-8)
    """
    try:
        db = get_db()
        
        # Get canteen info
        canteen_ref = db.collection("canteens").document(canteen_id)
        canteen = canteen_ref.get()
        
        if not canteen.exists:
            raise HTTPException(
                status_code=404,
                detail=f"Canteen with ID {canteen_id} not found"
            )
        
        canteen_data = canteen.to_dict()
        
        # Get crowd status
        crowd_data = compute_crowd_status(canteen_id, db)
        
        return CrowdStatus(
            canteen_id=canteen_id,
            name=canteen_data.get("name", "Unknown"),
            location=canteen_data.get("location", "Unknown"),
            lat=canteen_data.get("lat", 0.0),
            lng=canteen_data.get("lng", 0.0),
            current_status=crowd_data["status"],
            confidence=crowd_data["confidence"],
            last_updated=crowd_data["last_updated"] or "Never",
            report_count=crowd_data["report_count"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching canteen {canteen_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


def encode_level(level: str) -> int:
    """Convert crowd level to numeric value"""
    mapping = {"Low": 1, "Medium": 2, "High": 3}
    return mapping.get(level, 0)


def decode_level(numeric_value: float) -> str:
    """Convert numeric value back to crowd level"""
    if numeric_value < 1.5:
        return "Low"
    elif numeric_value < 2.5:
        return "Medium"
    else:
        return "High"


def apply_staleness_logic(last_report_time, status: str) -> str:
    """
    If last report is older than 15 minutes, mark as Unknown
    """
    if last_report_time is None:
        return "Unknown"
    
    now = datetime.now()
    time_diff = now - last_report_time.replace(tzinfo=None)
    
    if time_diff > timedelta(minutes=15):
        return "Unknown"
    
    return status


@router.get("/canteens/status", response_model=AllCanteenStatus)
async def get_all_canteens_status():
    """
    Get crowd status for all canteens
    Returns current crowd level, confidence, and last update time for each canteen
    """
    try:
        # Get all canteens
        canteens = db.collection("canteens").stream()
        canteen_list = list(canteens)
        
        if not canteen_list:
            raise HTTPException(
                status_code=404,
                detail="No canteens found in database"
            )
        
        # Compute status for each canteen
        statuses = []
        for canteen in canteen_list:
            canteen_data = canteen.to_dict()
            canteen_id = canteen.id
            
            # Get crowd status
            crowd_data = compute_crowd_status(canteen_id, db)
            
            status = CrowdStatus(
                canteen_id=canteen_id,
                name=canteen_data.get("name", "Unknown"),
                location=canteen_data.get("location", "Unknown"),
                lat=canteen_data.get("lat", 0.0),
                lng=canteen_data.get("lng", 0.0),
                current_status=crowd_data["status"],
                confidence=crowd_data["confidence"],
                last_updated=crowd_data["last_updated"] or "Never",
                report_count=crowd_data["report_count"]
            )
            statuses.append(status)
        
        return AllCanteenStatus(
            status="success",
            message=f"Retrieved status for {len(statuses)} canteens",
            data=statuses,
            timestamp=datetime.now().isoformat() + "Z"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching canteen statuses: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/canteens/{canteen_id}", response_model=CrowdStatus)
async def get_canteen_details(canteen_id: str):
    """
    Get detailed status for a single canteen
    
    - **canteen_id**: ID of the canteen (1-8)
    """
    try:
        # Get canteen info
        canteen_ref = db.collection("canteens").document(canteen_id)
        canteen = canteen_ref.get()
        
        if not canteen.exists:
            raise HTTPException(
                status_code=404,
                detail=f"Canteen with ID {canteen_id} not found"
            )
        
        canteen_data = canteen.to_dict()
        
        # Get crowd status
        crowd_data = compute_crowd_status(canteen_id, db)
        
        return CrowdStatus(
            canteen_id=canteen_id,
            name=canteen_data.get("name", "Unknown"),
            location=canteen_data.get("location", "Unknown"),
            lat=canteen_data.get("lat", 0.0),
            lng=canteen_data.get("lng", 0.0),
            current_status=crowd_data["status"],
            confidence=crowd_data["confidence"],
            last_updated=crowd_data["last_updated"] or "Never",
            report_count=crowd_data["report_count"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching canteen {canteen_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
