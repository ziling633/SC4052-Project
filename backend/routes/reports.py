"""
Report submission endpoints
"""
from fastapi import APIRouter, HTTPException
from firebase_admin import firestore
from datetime import datetime
from models import ReportRequest, ReportResponse
from database import get_db

router = APIRouter(prefix="/api/v1")

VALID_LEVELS = ["Low", "Medium", "High"]


@router.post("/report", status_code=201, response_model=ReportResponse)
async def submit_report(request: ReportRequest):
    """
    Submit a crowd report for a canteen
    
    - **canteen_id**: ID of the canteen (1-8)
    - **crowd_level**: One of "Low", "Medium", "High"
    - **source**: Optional, "manual" or "vision-ai" (default: "manual")
    """
    try:
        db = get_db()
        
        # Validate crowd_level
        if request.crowd_level not in VALID_LEVELS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid crowd_level. Must be one of {VALID_LEVELS}. Got: {request.crowd_level}"
            )
        
        # Validate canteen_id exists
        canteen_ref = db.collection("canteens").document(request.canteen_id)
        canteen = canteen_ref.get()
        
        if not canteen.exists:
            raise HTTPException(
                status_code=404,
                detail=f"Canteen with ID {request.canteen_id} not found"
            )
        
        # Create report document
        report_data = {
            "canteen_id": request.canteen_id,
            "crowd_level": request.crowd_level,
            "source": request.source,
            "timestamp": firestore.Timestamp.from_datetime(datetime.utcnow()),
            "user_id": "anon_user"  # TODO: Get from auth in Phase 4
        }
        
        doc_ref = db.collection("reports").document()
        doc_ref.set(report_data)
        
        return ReportResponse(
            status="success",
            message="Report submitted successfully",
            report_id=doc_ref.id,
            timestamp=datetime.now().isoformat() + "Z"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error submitting report: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "message": "Campus-Flow API is running",
        "timestamp": datetime.now().isoformat() + "Z"
    }
