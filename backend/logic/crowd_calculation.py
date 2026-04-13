from datetime import datetime
from google.cloud import firestore

# Constants for logic tuning
TIME_WINDOW_MINUTES = 10
REPORT_LIMIT = 1
EXPECTED_REPORTS_PER_WINDOW = REPORT_LIMIT
LEVEL_PRIORITY = {"High": 3, "Medium": 2, "Low": 1}


def normalize_crowd_level(value):
    if not value:
        return None
    normalized = str(value).strip().lower()
    if normalized == "low":
        return "Low"
    if normalized == "medium":
        return "Medium"
    if normalized == "high":
        return "High"
    return None


def format_timestamp(ts):
    if isinstance(ts, datetime):
        return ts.isoformat() + "Z"
    if hasattr(ts, "to_datetime"):
        return ts.to_datetime().isoformat() + "Z"
    return None


def compute_crowd_status(db, canteen_id: str):
    """
    Computes the aggregated crowd status for a canteen based on the most recent reports.
    Only reads from the reports collection; no fallback to canteen metadata.
    """
    reports_ref = db.collection("reports")
    query = (
        reports_ref
        .where("canteen_id", "==", canteen_id)
        .order_by("timestamp", direction=firestore.Query.DESCENDING)
        .limit(REPORT_LIMIT)
    )

    recent_reports = query.stream()
    levels = []
    timestamps = []

    for doc in recent_reports:
        report = doc.to_dict()
        level = normalize_crowd_level(report.get("crowd_level"))
        if not level:
            continue
        levels.append(level)

        ts = report.get("timestamp")
        if ts:
            iso_ts = format_timestamp(ts)
            if iso_ts:
                timestamps.append(iso_ts)

    if not levels:
        # No reports found; return Unknown status
        return {
            "status": "Unknown",
            "confidence": 0.0,
            "report_count": 0,
            "last_updated": None
        }

    # Calculation logic
    counts = {}
    for level in levels:
        counts[level] = counts.get(level, 0) + 1

    final_status = max(counts.items(), key=lambda item: (item[1], LEVEL_PRIORITY.get(item[0], 0)))[0]
    confidence = min(len(levels) / EXPECTED_REPORTS_PER_WINDOW, 1.0)
    
    last_updated = max(timestamps) if timestamps else None

    return {
        "status": final_status,
        "confidence": round(confidence, 2),
        "report_count": len(levels),
        "last_updated": last_updated
    }