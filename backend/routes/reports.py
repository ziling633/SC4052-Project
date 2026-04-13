"""
Report submission endpoints - Refactored for Phase 2
"""
import datetime
from fastapi import APIRouter, HTTPException, Request

# Native Firebase/Google Cloud imports
from google.cloud import firestore

# Project internal imports
from models import ReportRequest, ReportResponse
from database import get_db
from logic.rate_limiter import global_rate_limiter

router = APIRouter(prefix="/api/v1")

@router.post("/report", response_model=ReportResponse)
async def submit_report(request_payload: ReportRequest, request: Request):
    """
    Submit a crowd report with rate limiting and database validation.
    """
    try:
        db = get_db()
        # Use the client's IP address as a unique identifier for rate limiting
        user_host = request.client.host 
        
        # 1. Check Rate Limiter (3 reports / 5 minutes)
        if not global_rate_limiter.is_allowed(user_host):
            retry_after = global_rate_limiter.get_retry_after(user_host)
            raise HTTPException(
                status_code=429, 
                detail={
                    "message": "Too many reports. Please wait before submitting again.",
                    "retry_after_seconds": retry_after
                }
            )
        
        # 2. Validate that the canteen exists
        canteen_ref = db.collection("canteens").document(request_payload.canteen_id)
        canteen_doc = canteen_ref.get()
        if not canteen_doc.exists:
            raise HTTPException(
                status_code=404,
                detail=f"Canteen ID {request_payload.canteen_id} does not exist"
            )
        
        # 3. Prepare and save the report document
        report_data = {
            "canteen_id": request_payload.canteen_id,
            "canteen_name": canteen_doc.to_dict().get("name", "Unknown"),
            "crowd_level": request_payload.crowd_level,
            "source": request_payload.source or "manual",
            "image_name": request_payload.image_name,
            "image_type": request_payload.image_type,
            "image_size": request_payload.image_size,
            "image_preview": request_payload.image_preview,
            "timestamp": firestore.SERVER_TIMESTAMP,
            "user_id": "anon_user"
        }
        
        new_report_ref = db.collection("reports").document()
        new_report_ref.set(report_data)
        
        return ReportResponse(
            status="success",
            message="Report submitted successfully",
            report_id=new_report_ref.id,
            timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat() + "Z"
        )
        
    except HTTPException:
        # Re-raise FastAPI-specific errors (429, 404, etc.)
        raise
    except Exception as e:
        print(f"❌ Error submitting report: {e}")
        raise HTTPException(
            status_code=500,
            detail="An internal error occurred while saving your report."
        )

@router.get("/health")
async def health_check():
    """Health check endpoint for monitoring tools"""
    return {
        "status": "ok",
        "message": "Campus-Flow API is healthy",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }