from datetime import datetime, timedelta
from google.cloud import firestore

# Constants for logic tuning
TIME_WINDOW_MINUTES = 10
EXPECTED_REPORTS_PER_WINDOW = 5  # You can change this to 1 if you want 100% confidence always

def encode_level(crowd_level: str) -> int:
    """Converts string crowd levels to numeric values for calculation."""
    mapping = {
        "Low": 1,
        "Medium": 2,
        "High": 3
    }
    return mapping.get(crowd_level, 0)

def decode_level(numeric_level: float) -> str:
    """Converts a calculated average back into a human-readable string."""
    if numeric_level >= 2.5:
        return "High"
    elif numeric_level >= 1.5:
        return "Medium"
    elif numeric_level >= 0.5:
        return "Low"
    else:
        return "Unknown"

def compute_crowd_status(db, canteen_id: str):
    """
    Computes the aggregated crowd status for a canteen based on recent reports.
    """
    now = datetime.now()
    cutoff = now - timedelta(minutes=TIME_WINDOW_MINUTES)
    
    reports_ref = db.collection("reports")
    # Query for reports from this canteen within the last 10 minutes
    query = reports_ref.where("canteen_id", "==", canteen_id).where("timestamp", ">=", cutoff)
    recent_reports = query.stream()
    
    levels = []
    timestamps = []

    for doc in recent_reports:
        report = doc.to_dict()
        levels.append(encode_level(report.get("crowd_level")))
        
        ts = report.get("timestamp")
        if ts:
            timestamps.append(ts)

    if not levels:
        return {
            "status": "Unknown",
            "confidence": 0.0,
            "report_count": 0,
            "last_updated": None
        }

    # Calculation logic
    avg_level = sum(levels) / len(levels)
    final_status = decode_level(avg_level)
    
    # Confidence is the ratio of reports to our 'expected' benchmark, capped at 1.0
    confidence = min(len(levels) / EXPECTED_REPORTS_PER_WINDOW, 1.0)
    
    last_updated = max(timestamps).isoformat() + "Z" if timestamps else None

    return {
        "status": final_status,
        "confidence": round(confidence, 2),
        "report_count": len(levels),
        "last_updated": last_updated
    }