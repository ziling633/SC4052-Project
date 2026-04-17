"""
Update canteens collection in Firestore with complete location details and randomized lastUpdated timestamps.
"""
import random
from datetime import datetime, timedelta
from google.cloud import firestore
from database import get_db

CANTEENS_DATA = [
    {"id": "1", "name": "Canteen 1 (Hall 1)", "lat": 1.345693, "lng": 103.687562, "location": "Hall 1"},
    {"id": "2", "name": "Canteen 2 (Hall 2)", "lat": 1.3481, "lng": 103.6854, "location": "Hall 2"},
    {"id": "3", "name": "Canteen 4 (Hall 4)", "lat": 1.3440, "lng": 103.6860, "location": "Hall 4"},
    {"id": "13", "name": "Canteen 5", "lat": 1.3475, "lng": 103.6784, "location": "Hall 5"},
    {"id": "4", "name": "Canteen 9 (Hall 9)", "lat": 1.3521, "lng": 103.6849, "location": "Hall 9"},
    {"id": "5", "name": "Canteen 11 (Hall 11)", "lat": 1.355034, "lng": 103.685917, "location": "Hall 11"},
    {"id": "6", "name": "Canteen 14 (Hall 14)", "lat": 1.352906, "lng": 103.682304, "location": "Hall 14"},
    {"id": "7", "name": "Canteen 16 (Hall 16)", "lat": 1.349720, "lng": 103.681284, "location": "Hall 16"},
    {"id": "8", "name": "North Hill Food Court", "lat": 1.3487, "lng": 103.6890, "location": "North Hill"},
    {"id": "9", "name": "Crespion Food Court", "lat": 1.3490, "lng": 103.6860, "location": "Crespion Hall"},
    {"id": "10", "name": "Northspine food court (Canteen A)", "lat": 1.348440, "lng": 103.685478, "location": "North Spine"},
    {"id": "11", "name": "Southspine food court (Canteen B)", "lat": 1.3424, "lng": 103.6823, "location": "South Spine"},
    {"id": "12", "name": "Quad Cafe", "lat": 1.3505, "lng": 103.6860, "location": "School of Biological Sciences"},
    {"id": "14", "name": "Nanyang Crescent Food Court", "lat": 1.3528, "lng": 103.6808, "location": "Nanyang Crescent Hall"}
]


def random_last_updated():
    """Return a random timestamp around today at 16:30 ± 5 minutes."""
    today = datetime.now()
    base = today.replace(hour=16, minute=30, second=0, microsecond=0)
    offset_seconds = random.randint(-300, 300)
    return base + timedelta(seconds=offset_seconds)

def update_report_names(db, canteen_id, canteen_name, batch_size=400):
    reports_ref = db.collection("reports")
    docs = list(reports_ref.where("canteen_id", "==", canteen_id).stream())
    if not docs:
        return 0

    updated = 0
    for start in range(0, len(docs), batch_size):
        batch = db.batch()
        chunk = docs[start:start + batch_size]
        for doc in chunk:
            batch.update(doc.reference, {"canteen_name": canteen_name})
            updated += 1
        batch.commit()

    return updated

def update_canteens():
    """Update all canteens in Firestore with simplified IDs and lastUpdated timestamps."""
    try:
        db = get_db()
        
        for canteen in CANTEENS_DATA:
            canteen_id = canteen["id"]
            canteen_payload = {k: v for k, v in canteen.items() if k != "id"}
            last_updated = random_last_updated()
            doc_ref = db.collection("canteens").document(canteen_id)
            # Use merge=True so you don't overwrite existing reports if they exist
            doc_ref.set({**canteen_payload, "lastUpdated": last_updated}, merge=True)
            print(f"✅ Created/Updated ID {canteen_id}: {canteen_payload['name']} at {last_updated.isoformat()}")

        report_name_map = {
            "5": "Canteen 11 (Hall 11)",
            "6": "Canteen 14 (Hall 14)",
            "7": "Canteen 16 (Hall 16)",
        }
        updated_reports = 0
        for canteen_id, canteen_name in report_name_map.items():
            updated_reports += update_report_names(db, canteen_id, canteen_name)
        
        if updated_reports:
            print(f"✅ Updated canteen_name for {updated_reports} report documents.")

        print(f"\n✅ Successfully updated {len(CANTEENS_DATA)} canteens with timestamped metadata!")
        
    except Exception as e:
        print(f"❌ Error updating canteens: {e}")

if __name__ == "__main__":
    print("🚀 Starting clean ID canteen seeding...\n")
    update_canteens()
