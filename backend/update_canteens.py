"""
Update canteens collection in Firestore with simplified IDs and null coordinates
"""
from google.cloud import firestore
from database import get_db

# Simplified list with numerical IDs and empty coordinates
CANTEENS_DATA = [
    {"id": "1", "name": "Canteen 1", "lat": 1.345693, "lng": 103.687562, "location": "Hall 1"},
    {"id": "2", "name": "Canteen 2", "lat": None, "lng": None, "location": "Hall 2"},
    {"id": "3", "name": "Canteen 4", "lat": None, "lng": None, "location": "Hall 4"},
    {"id": "4", "name": "Canteen 9", "lat": None, "lng": None, "location": "Hall 9"},
    {"id": "5", "name": "Canteen 11", "lat": 1.355034, "lng": 103.685917, "location": "Hall 11"},
    {"id": "6", "name": "Canteen 14", "lat": 1.352906, "lng": 103.682304, "location": "Hall 14"},
    {"id": "7", "name": "Canteen 16", "lat": 1.349720, "lng": 103.681284, "location": "Hall 16"},
    {"id": "8", "name": "North Hill Food Court", "lat": None, "lng": None, "location": "North Hill"},
    {"id": "9", "name": "Crescent Food Court", "lat": None, "lng": None, "location": "Crescent Hall"},
    {"id": "10", "name": "Northspine food court (Canteen A)", "lat": 1.348440, "lng": 103.685478, "location": "North Spine"},
    {"id": "11", "name": "Southspine food court (Canteen B)", "lat": None, "lng": None, "location": "South Spine"},
    {"id": "12", "name": "Quad Cafe", "lat": None, "lng": None, "location": "School of Biological Sciences"},
    {"id": "13", "name": "Pioneer Food Court", "lat": None, "lng": None, "location": "Pioneer Hall"},
    {"id": "14", "name": "Nanyang Crescent Food Court", "lat": None, "lng": None, "location": "Nanyang Crescent Hall"}
]

def update_canteens():
    """Update all canteens in Firestore with simplified IDs"""
    try:
        db = get_db()
        
        for canteen in CANTEENS_DATA:
            canteen_id = canteen.pop("id")
            doc_ref = db.collection("canteens").document(canteen_id)
            # Use merge=True so you don't overwrite existing reports if they exist
            doc_ref.set(canteen, merge=True)
            print(f"✅ Created/Updated ID {canteen_id}: {canteen['name']}")
        
        print(f"\n✅ Successfully updated {len(CANTEENS_DATA)} canteens with clean IDs!")
        
    except Exception as e:
        print(f"❌ Error updating canteens: {e}")

if __name__ == "__main__":
    print("🚀 Starting clean ID canteen seeding...\n")
    update_canteens()