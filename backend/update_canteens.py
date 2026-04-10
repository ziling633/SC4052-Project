"""
Update canteens collection in Firestore with accurate NTU coordinates and details
"""
import firebase_admin
from firebase_admin import firestore
from database import get_db

# Canteen data with accurate NTU coordinates
CANTEENS_DATA = [
    {
        "id": "1",
        "name": "North Spine Food Court (Koufu)",
        "lat": 1.3485,
        "lng": 103.6813,
        "location": "Level 2, North Spine Plaza (N2.1)",
        "crowdLevel": "Unknown"
    },
    {
        "id": "2",
        "name": "South Spine Food Court (Fine Food)",
        "lat": 1.3424,
        "lng": 103.6823,
        "location": "Level B4, South Spine Plaza",
        "crowdLevel": "Unknown"
    },
    {
        "id": "3",
        "name": "Food Court @ NIE",
        "lat": 1.3483,
        "lng": 103.6783,
        "location": "Near NIE Block 3/5",
        "crowdLevel": "Unknown"
    },
    {
        "id": "4",
        "name": "Canteen 1 (Hall 1)",
        "lat": 1.3464,
        "lng": 103.6867,
        "location": "21 Nanyang Circle",
        "crowdLevel": "Unknown"
    },
    {
        "id": "5",
        "name": "Canteen 2 (Hall 2)",
        "lat": 1.3481,
        "lng": 103.6854,
        "location": "35 Student Walk",
        "crowdLevel": "Unknown"
    },
    {
        "id": "6",
        "name": "Canteen 4 (Hall 4)",
        "lat": 1.3440,
        "lng": 103.6860,
        "location": "11 Nanyang Circle",
        "crowdLevel": "Unknown"
    },
    {
        "id": "7",
        "name": "Canteen 5 (Hall 5)",
        "lat": 1.3445,
        "lng": 103.6873,
        "location": "8 Nanyang Drive",
        "crowdLevel": "Unknown"
    },
    {
        "id": "8",
        "name": "Canteen 9 (Hall 9)",
        "lat": 1.3521,
        "lng": 103.6849,
        "location": "24 Nanyang Avenue",
        "crowdLevel": "Unknown"
    },
]

def update_canteens():
    """Update all canteens in Firestore"""
    try:
        db = get_db()
        
        for canteen in CANTEENS_DATA:
            canteen_id = canteen.pop("id")
            doc_ref = db.collection("canteens").document(canteen_id)
            doc_ref.set(canteen, merge=True)
            print(f"✅ Updated canteen {canteen_id}: {canteen['name']}")
        
        print(f"\n✅ Successfully updated {len(CANTEENS_DATA)} canteens in Firestore!")
        
    except Exception as e:
        print(f"❌ Error updating canteens: {e}")

if __name__ == "__main__":
    print("🚀 Starting canteen update...\n")
    update_canteens()
