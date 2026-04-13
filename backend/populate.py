import random
from datetime import datetime, timedelta
# Change this line:
import firebase_admin
from firebase_admin import credentials, firestore

# Add this before you call db = firestore.client()
if not firebase_admin._apps:
    cred = credentials.Certificate("firebase-key.json") # Make sure this file is in your backend folder
    firebase_admin.initialize_app(cred)


# 1. Initialize Firebase (Ensure you have your key file)
# cred = credentials.Certificate("firebase-key.json")
# initialize_app(cred)
db = firestore.client()

def populate_sample_reports(total_records=120):
    batch = db.batch()
    canteen_ids = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14"] 
    levels = ["Low", "Medium", "High"]
    
    print(f"🚀 Populating {total_records} reports...")
    
    for i in range(total_records):
        report_id = f"sample_report_{i}"
        report_ref = db.collection("reports").document(report_id)
        
        # Random data for testing
        c_id = random.choice(canteen_ids)
        c_name = f"Canteen {c_id} Test"
        level = random.choice(levels)
        
        # Randomize timestamps within the last 30 minutes for aggregation testing
        random_minutes = random.randint(0, 30)
        ts = datetime.now() - timedelta(minutes=random_minutes)
        
        report_data = {
            "canteen_id": c_id,
            "canteen_name": c_name,
            "crowd_level": level,
            "source": "manual",
            "timestamp": ts
        }
        
        batch.set(report_ref, report_data)

    batch.commit()
    print("✅ Successfully added 120 records to the 'reports' collection.")

populate_sample_reports()