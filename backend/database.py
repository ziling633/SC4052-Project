"""
Firebase database initialization and utilities
"""
import os
import json
import tempfile
import firebase_admin
from firebase_admin import credentials, firestore, storage
from dotenv import load_dotenv

load_dotenv()

# Global database client
db = None
bucket = None

# Initialize Firebase
def init_firebase():
    """Initialize Firebase Admin SDK"""
    global db, bucket
    try:
        # Check if already initialized
        if not firebase_admin._apps:
            cred_input = os.getenv("FIREBASE_CREDENTIALS", "firebase-key.json")
            
            # Handle two cases: JSON content or file path
            if cred_input.strip().startswith('{'):
                # Case 1: Environment variable contains JSON content
                try:
                    cred_dict = json.loads(cred_input)
                    # Write to temporary file
                    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
                        json.dump(cred_dict, f)
                        cred_path = f.name
                    print("✅ Firebase credentials loaded from environment variable")
                except json.JSONDecodeError as e:
                    print(f"❌ Invalid Firebase credentials JSON: {e}")
                    return None
            else:
                # Case 2: Environment variable contains file path
                cred_path = cred_input
                if not os.path.exists(cred_path):
                    print(f"⚠️  Firebase credentials file not found at: {cred_path}")
                    print(f"⚠️  Looking for: {os.path.abspath(cred_path)}")
                    return None
            
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            print("✅ Firebase initialized successfully")
        
        db = firestore.client()
        # Specify bucket name explicitly: project-id.firebasestorage.app
        bucket = storage.bucket("campus-flow-as-a-service-50de2.firebasestorage.app")
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

# Get Storage bucket
def get_bucket():
    """Get Firebase Storage bucket"""
    global bucket
    if bucket is None:
        init_firebase()
    return bucket

# Upload image to storage
def upload_image_to_storage(base64_image: str, canteen_name: str) -> str:
    """
    Upload base64 image to Firebase Storage and return download URL
    
    Args:
        base64_image: Base64 encoded image string (may include data URI prefix)
        canteen_name: Name of the canteen for the filename
    
    Returns:
        str: Public download URL for the image, or None if upload fails
    """
    try:
        import base64
        from datetime import datetime
        
        bucket = get_bucket()
        if bucket is None:
            print("⚠️  Storage bucket not available")
            return None
        
        # Generate filename: CanteenName_YYYY-MM-DD_HH-MM-SS.jpg
        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        clean_canteen_name = canteen_name.replace(" ", "_").replace("(", "").replace(")", "").strip()
        file_name = f"{clean_canteen_name}_{timestamp}.jpg"
        
        # Remove data URI prefix if present (e.g., "data:image/jpeg;base64,")
        if "," in base64_image:
            base64_image = base64_image.split(",")[1]
        
        # Decode base64 to bytes
        image_bytes = base64.b64decode(base64_image)
        
        # Upload to storage
        blob = bucket.blob(f"vision-reports/{file_name}")
        blob.upload_from_string(
            image_bytes,
            content_type="image/jpeg"
        )
        
        # Get public download URL (set as public)
        blob.make_public()
        url = blob.public_url
        print(f"✅ Image uploaded: {url}")
        return url
        
    except Exception as e:
        print(f"⚠️  Image upload skipped: {e}")
        return None
