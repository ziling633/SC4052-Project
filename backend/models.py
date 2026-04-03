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
    
    class Config:
        example = {
            "canteen_id": "1",
            "crowd_level": "High",
            "source": "manual"
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


class CrowdStatus(BaseModel):
    """Crowd status for a single canteen"""
    canteen_id: str
    name: str
    location: str
    lat: float
    lng: float
    current_status: str  # "Low", "Medium", "High", "Unknown"
    confidence: float  # 0.0 to 1.0 based on number of reports
    last_updated: str
    report_count: int


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
