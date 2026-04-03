"""
Firebase Collection Setup Script
Run this ONCE to initialize collections with sample data

Usage:
    python setup_collections.py
"""
import os
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, firestore

load_dotenv()

# Initialize Firebase
def setup_firebase():
    try:
        if not firebase_admin._apps:
            cred_path = os.getenv("FIREBASE_CREDENTIALS", "firebase-key.json")
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            print("✅ Firebase initialized")
        return firestore.client()
    except Exception as e:
        print(f"❌ Firebase init failed: {e}")
        raise


def setup_canteens(db):
    """Create canteens collection with NTU canteen data"""
    print("\n📍 Setting up Canteens collection...")
    
    canteens_data = [
        {"name": "North Spine Food Court", "location": "North", "lat": 1.3456, "lng": 103.6789},
        {"name": "The Deck Food Court", "location": "Central", "lat": 1.3467, "lng": 103.6800},
        {"name": "Canteen 11", "location": "Central", "lat": 1.3475, "lng": 103.6810},
        {"name": "Canteen 13", "location": "North", "lat": 1.3440, "lng": 103.6775},
        {"name": "Food Paradise (North Hill)", "location": "North", "lat": 1.3420, "lng": 103.6760},
        {"name": "Canteen 16", "location": "South", "lat": 1.3500, "lng": 103.6850},
        {"name": "Canteen 18", "location": "East", "lat": 1.3480, "lng": 103.6900},
        {"name": "Canteen 9", "location": "West", "lat": 1.3490, "lng": 103.6700},
    ]
    
    canteens_ref = db.collection("canteens")
    
    # Check if already exists
    existing = list(canteens_ref.limit(1).stream())
    if existing:
        print("⚠️  Canteens collection already exists, skipping...")
        return
    
    # Insert canteens
    for i, canteen in enumerate(canteens_data, start=1):
        canteens_ref.document(str(i)).set(canteen)
        print(f"  ✅ Created canteen {i}: {canteen['name']}")
    
    print(f"✅ All {len(canteens_data)} canteens created successfully!")


def setup_reports(db):
    """Create reports collection"""
    print("\n📝 Setting up Reports collection...")
    
    # Reports collection doesn't need pre-setup, just verify it can be written to
    # Add a sample report for testing
    sample_report = {
        "canteen_id": "1",
        "crowd_level": "Medium",
        "source": "manual",
        "timestamp": firestore.SERVER_TIMESTAMP,
        "user_id": "setup_script"
    }
    
    doc_ref = db.collection("reports").document()
    doc_ref.set(sample_report)
    
    print(f"  ✅ Sample report created: {doc_ref.id}")
    print("✅ Reports collection ready!")


def main():
    """Main setup function"""
    print("=" * 50)
    print("🚀 Campus-Flow Firebase Setup Script")
    print("=" * 50)
    
    try:
        db = setup_firebase()
        setup_canteens(db)
        setup_reports(db)
        
        print("\n" + "=" * 50)
        print("✅ Setup complete! Your database is ready.")
        print("=" * 50)
        print("\nNext steps:")
        print("1. Run: python main.py")
        print("2. Visit: http://localhost:8000/docs")
        print("3. Test the POST /api/v1/report endpoint")
        print("=" * 50 + "\n")
        
    except Exception as e:
        print(f"\n❌ Setup failed: {e}")
        raise


if __name__ == "__main__":
    main()
