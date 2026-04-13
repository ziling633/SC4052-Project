"""
Pydantic models for Campus-Flow API
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ReportRequest(BaseModel):
    """Request model for submitting a crowd report"""
    canteen_id: str = Field(..., description="ID of the canteen")
    crowd_level: str = Field(..., description="Must be 'Low', 'Medium', or 'High'")
    source: str = Field(default="manual", description="Source of report: 'manual' or 'vision-ai'")
    image_name: Optional[str] = Field(default=None, description="Original file name uploaded by the user")
    image_type: Optional[str] = Field(default=None, description="MIME type of the uploaded image")
    image_size: Optional[int] = Field(default=None, description="Size of the uploaded image in bytes")
    image_preview: Optional[str] = Field(default=None, description="Base64 preview for privacy feed display")
    
    class Config:
        example = {
            "canteen_id": "1",
            "crowd_level": "High",
            "source": "manual",
            "image_name": None,
            "image_type": None,
            "image_size": None,
            "image_preview": None
        }


class ReportResponse(BaseModel):
    """Response model for submitted report"""
    status: str
    message: str
    report_id: str
    timestamp: str


class CanteenInfo(BaseModel):
    """Canteen information"""
    canteen_id: str
    name: str
    location: str
    lat: float
    lng: float


from typing import Optional # Add this import

class CrowdStatus(BaseModel):
    canteen_id: str
    name: str
    current_status: str
    lat: Optional[float] = None 
    lng: Optional[float] = None
    confidence: float
    last_updated: Optional[str] = None


class AllCanteenStatus(BaseModel):
    """Response containing status of all canteens"""
    status: str
    message: str
    data: list[CrowdStatus]
    timestamp: str


class ErrorResponse(BaseModel):
    """Error response model"""
    status: str
    message: str
    code: int
