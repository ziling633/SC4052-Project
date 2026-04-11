"""
Report submission endpoints
"""
from fastapi import APIRouter, HTTPException
from google.cloud import firestore # Corrected import for Timestamp handling
from datetime import datetime
from models import ReportRequest, ReportResponse
from database import get_db

router = APIRouter(prefix="/api/v1")

VALID_LEVELS = ["Low", "Medium", "High"]

@router.post("/report", status_code=201, response_model=ReportResponse)
async def submit_report(request: ReportRequest):
    """
    Submit a crowd report for a canteen
    
    - **canteen_id**: ID of the canteen (1-14)
    - **crowd_level**: One of "Low", "Medium", "High"
    - **source**: Optional, "manual" or "vision-ai" (default: "manual")
    """
    try:
        db = get_db()
        
        # 1. Validate crowd_level
        if request.crowd_level not in VALID_LEVELS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid crowd_level. Must be one of {VALID_LEVELS}. Got: {request.crowd_level}"
            )
        
        # 2. Validate canteen_id exists
        canteen_ref = db.collection("canteens").document(request.canteen_id)
        if not canteen_ref.get().exists:
            raise HTTPException(
                status_code=404,
                detail=f"Canteen with ID {request.canteen_id} not found"
            )
        
        # 3. Create report document
        report_data = {
            "canteen_id": request.canteen_id,
            "crowd_level": request.crowd_level,
            "source": request.source,
            # FIX: Use SERVER_TIMESTAMP to resolve the 'no attribute Timestamp' error
            "timestamp": firestore.SERVER_TIMESTAMP,
            "user_id": "anon_user"
        }
        
        doc_ref = db.collection("reports").document()
        doc_ref.set(report_data)

        # 4. Trigger Canteen Metadata Update
        # This allows the frontend to sort by 'lastUpdated' instantly
        canteen_ref.update({
            "lastUpdated": firestore.SERVER_TIMESTAMP,
            "crowdLevel": request.crowd_level # Update the single-point-of-truth field
        })
        
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