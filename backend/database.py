"""
Firebase database initialization and utilities
"""
import os
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

load_dotenv()

# Global database client
db = None

# Initialize Firebase
def init_firebase():
    """Initialize Firebase Admin SDK"""
    global db
    try:
        # Check if already initialized
        if not firebase_admin._apps:
            cred_path = os.getenv("FIREBASE_CREDENTIALS", "firebase-key.json")
            if not os.path.exists(cred_path):
                print(f"⚠️  Firebase credentials file not found at: {cred_path}")
                print(f"⚠️  Looking for: {os.path.abspath(cred_path)}")
                return None
            
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            print("✅ Firebase initialized successfully")
        
        db = firestore.client()
        return db
    except Exception as e:
        print(f"❌ Firebase initialization issue: {e}")
        import traceback
        traceback.print_exc()
        return None

# Get Firestore client
def get_db():
    """Get Firestore client instance"""
    global db
    if db is None:
        db = init_firebase()
    return db
