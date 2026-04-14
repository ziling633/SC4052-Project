"""
Report submission endpoints - Refactored for Phase 2
"""
import datetime
import uuid
from fastapi import APIRouter, HTTPException, Request

# Native Firebase/Google Cloud imports
from google.cloud import firestore

# Project internal imports
from models import ReportRequest, ReportResponse
from database import get_db, upload_image_to_storage
from logic.rate_limiter import global_rate_limiter
from logic.vision_analysis import analyze_crowd_level

router = APIRouter(prefix="/api/v1")

@router.post("/report", response_model=ReportResponse)
async def submit_report(request_payload: ReportRequest, request: Request):
    """
    Submit a crowd report with rate limiting scoped per canteen and database validation.
    """
    try:
        db = get_db()
        user_host = request.client.host 
        
        # --- UPDATED LOGIC ---
        # Create a unique key for (User + Specific Canteen)
        # This allows you to submit a report for Canteen A, and then immediately Canteen B,
        # but prevents spamming the SAME canteen multiple times.
        rate_limit_key = f"{user_host}:{request_payload.canteen_id}"
        
        # 1. Check Rate Limiter using the canteen-specific key
        if not global_rate_limiter.is_allowed(rate_limit_key):
            retry_after = global_rate_limiter.get_retry_after(rate_limit_key)
            raise HTTPException(
                status_code=429, 
                detail={
                    "message": f"You've already reported for this canteen recently. Please wait {retry_after}s.",
                    "retry_after_seconds": retry_after
                }
            )
        # ---------------------
        
        # 2. Validate that the canteen exists
        canteen_ref = db.collection("canteens").document(request_payload.canteen_id)
        canteen_doc = canteen_ref.get()
        if not canteen_doc.exists:
            raise HTTPException(
                status_code=404,
                detail=f"Canteen ID {request_payload.canteen_id} does not exist"
            )
        
        # 2b. Validate: user must provide either manual crowd level OR image for AI
        if not request_payload.crowd_level and not request_payload.image_preview:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "Please either select a crowd level manually or upload an image for AI detection"
                }
            )
        
        # 3. Initialize report data
        crowd_level_final = request_payload.crowd_level
        source_final = request_payload.source or "manual"
        ai_analysis = None
        
        # 3a. If image provided AND user didn't manually select crowd level, use AI to detect
        if request_payload.image_preview and not request_payload.crowd_level:
            # Validate image size (3MB limit for base64 encoded data)
            MAX_SIZE_BYTES = 3 * 1024 * 1024
            base64_size = len(request_payload.image_preview)
            estimated_actual_size = base64_size * 0.75
            
            if estimated_actual_size > MAX_SIZE_BYTES:
                raise HTTPException(
                    status_code=413,
                    detail={
                        "message": f"Image is too large (~{estimated_actual_size / 1024 / 1024:.1f}MB). Maximum allowed is 3MB."
                    }
                )
            
            # Use OpenAI Vision to analyze crowd level
            print("🔍 Analyzing image with GPT-4 Vision...")
            ai_analysis = analyze_crowd_level(request_payload.image_preview)
            
            if ai_analysis and ai_analysis.get("crowd_level") != "Unknown":
                crowd_level_final = ai_analysis["crowd_level"]
                source_final = "vision-ai"
                print(f"✅ AI Analysis: {crowd_level_final} (confidence: {ai_analysis.get('confidence', 0)}%)")
            else:
                print(f"⚠️  AI Analysis failed: {ai_analysis.get('error', 'Unknown error')}")
                raise HTTPException(
                    status_code=400,
                    detail={
                        "message": f"AI analysis failed. Please select a crowd level manually. Error: {ai_analysis.get('error', 'Unknown')}"
                    }
                )
        elif request_payload.image_preview and request_payload.crowd_level:
            # User manually set crowd level, validate image size but don't run AI
            MAX_SIZE_BYTES = 3 * 1024 * 1024
            base64_size = len(request_payload.image_preview)
            estimated_actual_size = base64_size * 0.75
            
            if estimated_actual_size > MAX_SIZE_BYTES:
                raise HTTPException(
                    status_code=413,
                    detail={
                        "message": f"Image is too large (~{estimated_actual_size / 1024 / 1024:.1f}MB). Maximum allowed is 3MB."
                    }
                )
            print("📸 Using manual crowd level (AI skipped due to user selection)")
        
        # 3b. Prepare report document
        report_data = {
            "canteen_id": request_payload.canteen_id,
            "canteen_name": canteen_doc.to_dict().get("name", "Unknown"),
            "crowd_level": crowd_level_final,
            "source": source_final,
            "image_name": request_payload.image_name,
            "image_type": request_payload.image_type,
            "image_size": request_payload.image_size,
            "image_preview_url": None,  # Will be populated if image provided
            "ai_confidence": ai_analysis.get("confidence", 0) if ai_analysis else None,
            "ai_reasoning": ai_analysis.get("description", "") if ai_analysis else None,
            "timestamp": firestore.SERVER_TIMESTAMP,
            "user_id": "anon_user"
        }
        
        # 3c. Upload image to Storage
        if request_payload.image_preview:
            try:
                canteen_name = canteen_doc.to_dict().get("name", "Unknown")
                image_url = upload_image_to_storage(request_payload.image_preview, canteen_name)
                if image_url:
                    report_data["image_preview_url"] = image_url
            except Exception as e:
                print(f"⚠️  Image upload failed (non-blocking): {e}")
                # Continue without image - report is still valid
        
        new_report_ref = db.collection("reports").document()
        new_report_ref.set(report_data)
        
        return ReportResponse(
            status="success",
            message="Report submitted successfully",
            report_id=new_report_ref.id,
            timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat() + "Z"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error submitting report: {e}")
        error_msg = str(e)
        if "maximum allowed size" in error_msg.lower() or "too large" in error_msg.lower():
            raise HTTPException(
                status_code=413,
                detail={"message": "The attached image is too large for our database limit (1MB). Please try a smaller file."}
            )
        raise HTTPException(
            status_code=500,
            detail={"message": f"An internal error occurred while saving your report: {error_msg}"}
        )

# ... health_check remains the same

@router.get("/health")
async def health_check():
    """Health check endpoint for monitoring tools"""
    return {
        "status": "ok",
        "message": "Campus-Flow API is healthy",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }