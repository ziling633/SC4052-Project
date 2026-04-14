"""
Canteen status and information endpoints - Refactored for Phase 2
"""
import datetime
from fastapi import APIRouter, HTTPException

# Native Firebase/Google Cloud imports
from google.cloud import firestore

# Project internal imports
from models import CrowdStatus, AllCanteenStatus
from database import get_db
from logic.crowd_calculation import compute_crowd_status

router = APIRouter(prefix="/api/v1")

@router.get("/canteens/status", response_model=AllCanteenStatus)
async def get_all_canteens_status():
    """
    Get aggregated crowd status for all canteens.
    This endpoint now uses logic that averages reports from the last 10 minutes.
    """
    try:
        print("📡 Fetching canteen status...")
        db = get_db()
        
        # Fetch all canteens to ensure the dashboard shows every location
        canteen_list = list(db.collection("canteens").stream())
        
        if not canteen_list:
            raise HTTPException(status_code=404, detail="No canteens found in database")
        
        print(f"📋 Found {len(canteen_list)} canteens, computing status...")
        
        statuses = []
        for i, canteen in enumerate(canteen_list):
            cid = canteen.id
            cdata = canteen.to_dict()
            
            try:
                # Use the specialized logic function to handle the math and staleness
                crowd = compute_crowd_status(db, cid)
                
                # Map the results to our Pydantic model
                statuses.append(CrowdStatus(
                    canteen_id=cid,
                    name=cdata.get("name", "Unknown"),
                    location=cdata.get("location", "Unknown"),
                    lat=cdata.get("lat"),
                    lng=cdata.get("lng"),
                    current_status=crowd["status"],
                    confidence=crowd["confidence"],
                    last_updated=crowd["last_updated"],
                    report_count=crowd["report_count"]
                ))
                print(f"  ✅ [{i+1}/{len(canteen_list)}] {cdata.get('name', 'Unknown')}: {crowd['status']}")
            except Exception as e:
                print(f"  ⚠️  [{i+1}/{len(canteen_list)}] Error computing {cdata.get('name', 'Unknown')}: {e}")
                # Use fallback status if computation fails
                statuses.append(CrowdStatus(
                    canteen_id=cid,
                    name=cdata.get("name", "Unknown"),
                    location=cdata.get("location", "Unknown"),
                    lat=cdata.get("lat"),
                    lng=cdata.get("lng"),
                    current_status="Unknown",
                    confidence=0,
                    last_updated=None,
                    report_count=0
                ))
        
        print(f"✅ Returning {len(statuses)} canteen statuses")
        return AllCanteenStatus(
            status="success",
            message=f"Retrieved aggregation for {len(statuses)} canteens",
            data=statuses,
            timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat()
        )
    except Exception as e:
        print(f"❌ Fetch Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/canteens/{canteen_id}", response_model=CrowdStatus)
async def get_canteen_details(canteen_id: str):
    """
    Get detailed aggregated status for a single specific canteen.
    """
    try:
        db = get_db()
        canteen_doc = db.collection("canteens").document(canteen_id).get()
        
        if not canteen_doc.exists:
            raise HTTPException(status_code=404, detail=f"Canteen {canteen_id} not found")
        
        cdata = canteen_doc.to_dict()
        crowd = compute_crowd_status(db, canteen_id)
        
        return CrowdStatus(
            canteen_id=canteen_id,
            name=cdata.get("name", "Unknown"),
            location=cdata.get("location", "Unknown"),
            lat=cdata.get("lat"),
            lng=cdata.get("lng"),
            current_status=crowd["status"],
            confidence=crowd["confidence"],
            last_updated=crowd["last_updated"],
            report_count=crowd["report_count"]
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Detail Fetch Error: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving canteen details")